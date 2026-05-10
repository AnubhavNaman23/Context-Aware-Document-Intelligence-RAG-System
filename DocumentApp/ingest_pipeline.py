import os
import logging

from django.conf import settings

from .models import Document, Chunk
from .extractors import extract_text_from_file
from .chunker import chunk_document_text
from .ollama_embedding import embed_text
import chromadb

logger = logging.getLogger(__name__)

CHROMA_DIR = str(settings.CHROMA_PERSIST_DIRECTORY)
os.makedirs(CHROMA_DIR, exist_ok=True)

client = chromadb.PersistentClient(path=CHROMA_DIR)
collection = client.get_or_create_collection(name=str(settings.CHROMA_COLLECTION_NAME))


def ingest_document(document_id, chunk_size=800):
    doc = Document.objects.get(id=document_id)

    text, metadata = extract_text_from_file(doc.file.path)
    doc.extracted_text = text
    doc.metadata = {**(metadata or {}), "chunk_size": chunk_size}
    doc.save(update_fields=["extracted_text", "metadata"])

    if not text.strip():
        logger.warning("No text extracted from document %s", document_id)
        return 0

    chunks = chunk_document_text(text, chunk_size=chunk_size)
    if not chunks:
        logger.warning("No chunks created for document %s", document_id)
        return 0

    # Remove any previous vectors/chunks for this document only
    existing_ids = list(doc.chunks.values_list("chroma_id", flat=True))
    existing_ids = [cid for cid in existing_ids if cid]
    if existing_ids:
        try:
            collection.delete(ids=existing_ids)
        except Exception:
            pass
    doc.chunks.all().delete()

    embeddings = embed_text(chunks)
    if len(embeddings) != len(chunks):
        raise RuntimeError("Embedding count mismatch")

    ids = [f"doc{doc.id}_chunk{i}" for i in range(len(chunks))]
    metadatas = [{"document_id": doc.id, "chunk_index": i} for i in range(len(chunks))]

    collection.add(ids=ids, documents=chunks, embeddings=embeddings, metadatas=metadatas)

    Chunk.objects.bulk_create([
        Chunk(document=doc, chunk_index=i, text=chunks[i], chroma_id=ids[i])
        for i in range(len(chunks))
    ])

    logger.info("Ingested %d chunks for document %s", len(chunks), document_id)
    return len(chunks)
