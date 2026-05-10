import json
import logging
import re
from pathlib import Path

from django.conf import settings
from django.http import StreamingHttpResponse
from rest_framework import status
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView

import chromadb

from .ingest_pipeline import ingest_document
from .models import Document, QueryHistory
from .ollama_embedding import embed_query
from .ollama_llm import generate_response, generate_response_stream
from .serializers import DocumentUploadSerializer

logger = logging.getLogger(__name__)

_client = chromadb.PersistentClient(path=str(settings.CHROMA_PERSIST_DIRECTORY))
collection = _client.get_or_create_collection(name=str(settings.CHROMA_COLLECTION_NAME))

STOP_WORDS = {
    "a", "an", "and", "are", "as", "at", "be", "by", "do", "for", "from", "how",
    "i", "in", "is", "it", "me", "of", "on", "or", "please", "show", "tell", "that",
    "the", "to", "was", "what", "when", "where", "which", "who", "with", "work",
}


def _question_tokens(question):
    tokens = re.findall(r"\b[a-z0-9]+\b", question.lower())
    return [token for token in tokens if token.isdigit() or (len(token) > 2 and token not in STOP_WORDS)]


def _question_phrases(question):
    lowered = question.lower()
    phrases = set(match.strip() for match in re.findall(r'"([^"]+)"', lowered))
    phrases.update(re.findall(r"\bweek\s+\d+\b", lowered))
    phrases.update(re.findall(r"\bday\s+\d+\b", lowered))
    return [phrase for phrase in phrases if phrase]


def _normalize_lookup_text(text):
    lowered = (text or "").lower()
    lowered = Path(lowered).name
    lowered = re.sub(r"[^a-z0-9]+", " ", lowered)
    return " ".join(lowered.split())


def _infer_document_from_question(question):
    normalized_question = _normalize_lookup_text(question)
    if not normalized_question:
        return None

    candidates = Document.objects.only("id", "filename").order_by("-uploaded_at")
    best_match = None
    best_score = 0

    for doc in candidates:
        filename = doc.filename or ""
        normalized_name = _normalize_lookup_text(filename)
        stem = _normalize_lookup_text(Path(filename).stem)
        score = 0

        if normalized_name and normalized_name in normalized_question:
            score = max(score, 10 + len(normalized_name.split()))
        if stem and stem in normalized_question:
            score = max(score, 8 + len(stem.split()))

        if score > best_score:
            best_score = score
            best_match = doc

    return best_match if best_score >= 8 else None


def _ensure_document_indexed(document):
    if document is None or document.chunks.exists():
        return document.chunks.count()

    if not document.file or not document.file.name or not document.file.storage.exists(document.file.name):
        raise RuntimeError("Source file is missing from storage. Please re-upload this document.")

    chunk_size = 800
    if isinstance(document.metadata, dict):
        try:
            chunk_size = int(document.metadata.get("chunk_size") or 800)
        except (TypeError, ValueError):
            chunk_size = 800

    chunks_created = ingest_document(document.id, chunk_size=max(200, min(chunk_size, 2000)))
    if chunks_created <= 0:
        raise RuntimeError("No text could be extracted from this document.")
    return chunks_created


def _chunk_relevance_score(question, chunk_text, rank, distance=None):
    question_text = question.lower()
    chunk_text_lower = chunk_text.lower()
    score = max(0, 8 - rank)

    if distance is not None:
        try:
            score += max(0, 2.5 - float(distance))
        except (TypeError, ValueError):
            pass

    if question_text and question_text in chunk_text_lower:
        score += 12

    for phrase in _question_phrases(question):
        if phrase in chunk_text_lower:
            score += 10 + len(phrase.split())

    for token in _question_tokens(question):
        if token in chunk_text_lower:
            score += 5 if token.isdigit() else 2

    return score


def _rank_context_chunks(question, docs, metas, distances, limit=3):
    ranked = []

    for index, (text, meta) in enumerate(zip(docs, metas)):
        distance = distances[index] if index < len(distances) else None
        ranked.append({
            "text": text,
            "meta": meta,
            "distance": distance,
            "score": _chunk_relevance_score(question, text, index, distance),
        })

    ranked.sort(key=lambda item: item["score"], reverse=True)

    selected = []
    seen_texts = set()
    for item in ranked:
        normalized = item["text"].strip()
        if normalized in seen_texts:
            continue
        seen_texts.add(normalized)
        selected.append(item)
        if len(selected) >= limit:
            break

    return selected


class DocumentUploadView(APIView):
    parser_classes = [MultiPartParser, FormParser]
    authentication_classes = []
    permission_classes = []

    def post(self, request):
        user = request.user if request.user.is_authenticated else None
        serializer = DocumentUploadSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        doc = serializer.save(user=user)
        try:
            chunk_size = int(request.data.get("chunk_size") or 800)
        except (TypeError, ValueError):
            return Response({"error": "Invalid chunk size"}, status=status.HTTP_400_BAD_REQUEST)

        chunk_size = max(200, min(chunk_size, 2000))
        try:
            chunks_created = ingest_document(doc.id, chunk_size=chunk_size)
        except Exception as e:
            logger.exception("Ingest failed")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response(
            {"id": doc.id, "chunks_created": chunks_created, "duplicate": False},
            status=status.HTTP_201_CREATED,
        )


class DocumentListView(APIView):
    authentication_classes = []
    permission_classes = []

    def get(self, request):
        docs = Document.objects.prefetch_related("chunks").order_by("-uploaded_at")
        result = [
            {
                "id": doc.id,
                "title": doc.filename or f"Document {doc.id}",
                "file_name": doc.filename,
                "chunk_count": doc.chunks.count(),
                "file_missing": not doc.file or not doc.file.name or not doc.file.storage.exists(doc.file.name),
                "uploaded_at": doc.uploaded_at.isoformat(),
            }
            for doc in docs
        ]
        return Response({"documents": result})


class DocumentDeleteView(APIView):
    authentication_classes = []
    permission_classes = []

    def delete(self, request, id):
        try:
            doc = Document.objects.get(id=id)
        except Document.DoesNotExist:
            return Response({"error": "Not found"}, status=status.HTTP_404_NOT_FOUND)

        chroma_ids = [c.chroma_id for c in doc.chunks.all() if c.chroma_id]
        if chroma_ids:
            try:
                collection.delete(ids=chroma_ids)
            except Exception:
                logger.warning("Failed to delete some ChromaDB entries for doc %s", id)

        doc.delete()
        return Response({"success": True})


class AskQuestionView(APIView):
    authentication_classes = []
    permission_classes = []

    def post(self, request):
        question = (request.data.get("question") or "").strip()
        if not question:
            return Response({"error": "Question is required"}, status=status.HTTP_400_BAD_REQUEST)

        document_id = request.data.get("document_id")
        top_k = int(request.data.get("top_k") or 5)
        do_stream = bool(request.data.get("stream", False))
        user = request.user if request.user.is_authenticated else None

        effective_document = None
        if document_id:
            try:
                effective_document = Document.objects.get(id=int(document_id))
            except (TypeError, ValueError, Document.DoesNotExist):
                return Response({"error": "Selected document not found"}, status=status.HTTP_404_NOT_FOUND)
        else:
            effective_document = _infer_document_from_question(question)

        if effective_document:
            try:
                _ensure_document_indexed(effective_document)
            except RuntimeError as exc:
                return Response({"error": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
            except Exception:
                logger.exception("Failed to index selected/inferred document %s", effective_document.id)
                return Response({"error": "Failed to index requested document"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        try:
            qvec = embed_query(question)
        except Exception:
            logger.exception("Embedding failed")
            return Response({"error": "Failed to embed query"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        try:
            fetch_k = max(6, min(max(top_k, 1) * 3, 15))
            query_kwargs = {"query_embeddings": [qvec], "n_results": fetch_k}
            if effective_document:
                query_kwargs["where"] = {"document_id": int(effective_document.id)}
            results = collection.query(**query_kwargs)
        except Exception:
            logger.exception("ChromaDB query failed")
            return Response({"error": "Failed to query documents"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        raw_docs = results.get("documents") or []
        raw_metas = results.get("metadatas") or []
        raw_distances = results.get("distances") or []
        docs = raw_docs[0] if raw_docs and isinstance(raw_docs[0], list) else []
        metas = raw_metas[0] if raw_metas and isinstance(raw_metas[0], list) else []
        distances = raw_distances[0] if raw_distances and isinstance(raw_distances[0], list) else []

        if not docs:
            return Response({"error": "No relevant documents found"}, status=status.HTTP_404_NOT_FOUND)

        selected_chunks = _rank_context_chunks(question, docs, metas, distances, limit=min(max(top_k, 1), 3))
        context_text = "\n\n".join(
            f"[Chunk {index + 1}]\n{item['text']}"
            for index, item in enumerate(selected_chunks[:2])
        )

        # Build source references
        sources = []
        doc_cache = {}
        for item in selected_chunks:
            text = item["text"]
            meta = item["meta"]
            doc_id = meta.get("document_id")
            if doc_id not in doc_cache:
                try:
                    doc_cache[doc_id] = Document.objects.get(id=doc_id).filename or f"Document {doc_id}"
                except Document.DoesNotExist:
                    doc_cache[doc_id] = f"Document {doc_id}"
            sources.append({"document": doc_cache[doc_id], "text_preview": text[:200]})

        if do_stream:
            def event_stream():
                yield f"data: {json.dumps({'type': 'sources', 'sources': sources})}\n\n"
                try:
                    for token in generate_response_stream(context_text, question):
                        if token:
                            yield f"data: {json.dumps({'type': 'token', 'content': token})}\n\n"
                except Exception as exc:
                    logger.exception("Streaming LLM error")
                    yield f"data: {json.dumps({'type': 'error', 'content': str(exc)})}\n\n"
                yield "data: [DONE]\n\n"

            response = StreamingHttpResponse(event_stream(), content_type="text/event-stream")
            response["Cache-Control"] = "no-cache"
            response["X-Accel-Buffering"] = "no"
            return response

        try:
            answer = generate_response(context_text, question)
        except Exception:
            logger.exception("LLM generation failed")
            return Response({"error": "Failed to generate answer"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        QueryHistory.objects.create(
            user=user,
            query_text=question,
            top_ids=str([item["meta"].get("document_id") for item in selected_chunks]),
            answer=answer,
        )
        return Response({"answer": answer, "sources": sources})


class DocumentReindexView(APIView):
    authentication_classes = []
    permission_classes = []

    def post(self, request):
        document_id = request.data.get("document_id")

        if document_id:
            try:
                documents = [Document.objects.get(id=int(document_id))]
            except (TypeError, ValueError, Document.DoesNotExist):
                return Response({"error": "Document not found"}, status=status.HTTP_404_NOT_FOUND)
        else:
            documents = list(Document.objects.order_by("id"))

        indexed = 0
        skipped = 0
        failures = []

        for doc in documents:
            try:
                before = doc.chunks.count()
                _ensure_document_indexed(doc)
                doc.refresh_from_db()
                if doc.chunks.count() > before:
                    indexed += 1
                else:
                    skipped += 1
            except Exception as exc:
                logger.exception("Failed to reindex document %s", doc.id)
                failures.append({"id": doc.id, "filename": doc.filename, "error": str(exc)})

        return Response({
            "indexed": indexed,
            "skipped": skipped,
            "failed": failures,
        })
