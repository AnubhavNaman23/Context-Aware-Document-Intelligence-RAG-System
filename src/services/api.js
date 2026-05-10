import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: { Accept: 'application/json' },
})

export async function uploadDocument(file, chunkSize, onProgress) {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('chunk_size', String(chunkSize || 800))

  const response = await api.post('/upload-doc/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (e) => {
      if (onProgress && e.total) {
        onProgress(Math.round((e.loaded * 100) / e.total))
      }
    },
  })
  return response.data
}

export async function listDocuments() {
  const response = await api.get('/documents/')
  return response.data
}

export async function deleteDocument(id) {
  const response = await api.delete(`/documents/${id}/delete/`)
  return response.data
}

export async function reindexDocuments(documentId) {
  const response = await api.post('/documents/reindex/', documentId ? { document_id: documentId } : {})
  return response.data
}
