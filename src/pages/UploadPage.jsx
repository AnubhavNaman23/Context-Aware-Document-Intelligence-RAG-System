import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { motion as Motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import {
  HiOutlineArrowUpTray,
  HiOutlineCheck,
  HiOutlineCloudArrowUp,
  HiOutlineDocumentText,
  HiOutlineSparkles,
  HiOutlineXMark,
} from 'react-icons/hi2'
import { uploadDocument } from '../services/api'
import { useChat } from '../context/ChatContext'

const EXT_STYLES = {
  pdf: 'bg-red-50 text-red-600 border-red-200',
  docx: 'bg-blue-50 text-blue-600 border-blue-200',
  doc: 'bg-blue-50 text-blue-600 border-blue-200',
  pptx: 'bg-orange-50 text-orange-600 border-orange-200',
  ppt: 'bg-orange-50 text-orange-600 border-orange-200',
  txt: 'bg-slate-50 text-slate-500 border-slate-200',
  jpg: 'bg-green-50 text-green-600 border-green-200',
  jpeg: 'bg-green-50 text-green-600 border-green-200',
  png: 'bg-green-50 text-green-600 border-green-200',
}

function ext(name) {
  return name.split('.').pop().toLowerCase()
}

export default function UploadPage() {
  const [files, setFiles] = useState([])
  const [uploading, setUploading] = useState({})
  const [results, setResults] = useState({})
  const { settings } = useChat()

  const onDrop = useCallback((accepted) => {
    const newFiles = accepted.map((file) => ({ id: `${file.name}-${Date.now()}`, file }))
    setFiles((prev) => [...prev, ...newFiles])
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
      'application/vnd.ms-powerpoint': ['.ppt'],
      'text/plain': ['.txt'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
    },
    maxSize: 10 * 1024 * 1024,
  })

  const handleUpload = async (fileItem) => {
    const { id, file } = fileItem
    setUploading((prev) => ({ ...prev, [id]: 0 }))

    try {
      const result = await uploadDocument(file, settings.chunkSize, (pct) =>
        setUploading((prev) => ({ ...prev, [id]: pct }))
      )

      setResults((prev) => ({ ...prev, [id]: { success: true, data: result } }))
      if (result.duplicate) {
        toast('Already in database', { icon: 'File' })
      } else {
        toast.success(`"${file.name}" - ${result.chunks_created} chunks created`)
      }
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Upload failed'
      setResults((prev) => ({ ...prev, [id]: { success: false, error: msg } }))
      toast.error(msg)
    } finally {
      setUploading((prev) => {
        const next = { ...prev }
        delete next[id]
        return next
      })
    }
  }

  const handleUploadAll = () => {
    files.filter((fileItem) => !results[fileItem.id]).forEach(handleUpload)
  }

  const removeFile = (id) => {
    setFiles((prev) => prev.filter((fileItem) => fileItem.id !== id))
    setResults((prev) => {
      const next = { ...prev }
      delete next[id]
      return next
    })
  }

  const pendingCount = files.filter((fileItem) => !results[fileItem.id] && !(fileItem.id in uploading)).length

  return (
    <div className="space-y-8">
      <div className="page-header-band">
        <div className="page-kicker mb-4">
          <HiOutlineSparkles className="h-4 w-4" />
          Ingestion studio
        </div>
        <h2 className="text-3xl font-black text-text-primary sm:text-4xl">Drop files into the pipeline.</h2>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-text-secondary sm:text-base">
          Upload PDFs, DOCX, PPT, TXT, or images and prepare them for retrieval.
          The current chunk size is <span className="font-black text-primary">{settings.chunkSize}</span> characters
          for newly ingested documents.
        </p>
      </div>

      <div className="section-card overflow-hidden p-4 sm:p-6">
        <div
          {...getRootProps()}
          className={`relative cursor-pointer rounded-[2rem] border-2 border-dashed p-10 text-center transition-all duration-300 sm:p-16 ${
            isDragActive
              ? 'border-primary bg-primary/8 shadow-xl shadow-primary/10'
              : 'border-white/65 bg-white/55 hover:border-primary/30'
          }`}
        >
          <input {...getInputProps()} />
          <div className="glow-orb left-1/2 top-1/2 h-48 w-48 -translate-x-1/2 -translate-y-1/2 bg-primary/10" />

          <Motion.div
            animate={isDragActive ? { scale: 1.08, y: -4 } : { scale: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 280 }}
            className="relative z-10"
          >
            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-[2rem] bg-gradient-to-br from-primary to-accent text-white shadow-2xl shadow-primary/20">
              <HiOutlineCloudArrowUp className="h-12 w-12" />
            </div>
            <h3 className="mt-6 text-2xl font-black text-text-primary">
              {isDragActive ? 'Release to start ingestion' : 'Click or drag files here'}
            </h3>
            <p className="mt-3 text-sm leading-7 text-text-secondary">
              Maximum size: 10 MB per file. The uploader keeps the queue visible while processing.
            </p>

            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {['PDF', 'DOCX', 'PPT', 'TXT', 'IMG'].map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-white/70 bg-white/80 px-3 py-1.5 text-xs font-bold tracking-[0.14em] text-text-secondary"
                >
                  {item}
                </span>
              ))}
            </div>
          </Motion.div>
        </div>
      </div>

      <AnimatePresence>
        {files.length > 0 && (
          <Motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="space-y-5"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="metric-pill text-xs font-bold uppercase tracking-[0.18em] text-text-secondary">
                {files.length} files queued
              </div>
              {pendingCount > 0 && (
                <button
                  onClick={handleUploadAll}
                  className="inline-flex items-center gap-2 rounded-full bg-text-primary px-6 py-3 text-sm font-bold text-white transition-transform hover:-translate-y-1"
                >
                  <HiOutlineArrowUpTray className="h-4 w-4" />
                  Upload all ({pendingCount})
                </button>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {files.map((fileItem, index) => {
                const extension = ext(fileItem.file.name)
                const colorClass = EXT_STYLES[extension] || 'bg-slate-50 text-slate-500 border-slate-200'
                const isUploading = fileItem.id in uploading
                const result = results[fileItem.id]
                const progress = uploading[fileItem.id] || 0

                return (
                  <Motion.div
                    key={fileItem.id}
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{ delay: index * 0.04 }}
                    className="section-card lift-card relative p-5"
                  >
                    <button
                      onClick={() => removeFile(fileItem.id)}
                      className="absolute right-4 top-4 rounded-full bg-white/85 p-2 text-text-muted transition hover:bg-red-50 hover:text-error"
                    >
                      <HiOutlineXMark className="h-4 w-4" />
                    </button>

                    <div className="flex gap-4">
                      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border ${colorClass}`}>
                        <HiOutlineDocumentText className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate pr-8 text-sm font-black text-text-primary">{fileItem.file.name}</p>
                        <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-text-muted">
                          {(fileItem.file.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 rounded-[1.3rem] bg-white/72 p-4">
                      {isUploading && (
                        <div>
                          <div className="mb-2 flex items-center justify-between text-[11px] font-bold uppercase tracking-[0.18em]">
                            <span className="text-primary">Uploading</span>
                            <span className="text-text-secondary">{progress}%</span>
                          </div>
                          <div className="h-2 w-full overflow-hidden rounded-full bg-surface-lighter">
                            <Motion.div
                              className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
                              initial={{ width: 0 }}
                              animate={{ width: `${progress}%` }}
                              transition={{ duration: 0.25 }}
                            />
                          </div>
                        </div>
                      )}

                      {result?.success && (
                        <div className="flex items-center gap-2 rounded-2xl border border-green-100 bg-green-50 px-3 py-3 text-sm font-bold text-green-700">
                          <HiOutlineCheck className="h-4 w-4" />
                          Done - {result.data?.chunks_created} chunks
                        </div>
                      )}

                      {result && !result.success && (
                        <div className="rounded-2xl border border-red-100 bg-red-50 px-3 py-3 text-sm font-bold text-red-600">
                          Upload failed
                        </div>
                      )}

                      {!isUploading && !result && (
                        <button
                          onClick={() => handleUpload(fileItem)}
                          className="w-full rounded-2xl bg-text-primary px-4 py-3 text-sm font-bold text-white transition-transform hover:-translate-y-0.5"
                        >
                          Upload now
                        </button>
                      )}
                    </div>
                  </Motion.div>
                )
              })}
            </div>
          </Motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
