from langchain_text_splitters import RecursiveCharacterTextSplitter

def chunk_document_text(document, chunk_size=800, chunk_overlap=None):
    if not document or not document.strip():
        return []

    if chunk_overlap is None:
        chunk_overlap = max(50, min(chunk_size // 5, 200))

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
        separators=["\n\n", "\n", " ", ""],
    )
    chunks = splitter.split_text(document)
    return [c.strip() for c in chunks if c.strip()]
