import { useState, useEffect } from 'react'
import { motion as Motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  HiOutlineCloudArrowUp,
  HiOutlineCube,
  HiOutlineDocumentText,
  HiOutlineMagnifyingGlass,
  HiOutlineArrowPath,
  HiOutlineSparkles,
  HiOutlineTrash,
} from 'react-icons/hi2'
import { listDocuments, deleteDocument, reindexDocuments } from '../services/api'

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [deleting, setDeleting] = useState(null)
  const [repairing, setRepairing] = useState(false)
  const navigate = useNavigate()

  const refreshDocuments = async () => {
    try {
      setLoading(true)
      const data = await listDocuments()
      setDocuments(data.documents || [])
    } catch {
      toast.error('Failed to load documents')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let cancelled = false

    const run = async () => {
      try {
        setLoading(true)
        const data = await listDocuments()
        if (!cancelled) {
          setDocuments(data.documents || [])
        }
      } catch {
        if (!cancelled) {
          toast.error('Failed to load documents')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    run()
    return () => {
      cancelled = true
    }
  }, [])

  const handleDelete = async (doc) => {
    if (!confirm(`Delete "${doc.title}"? This removes it from the knowledge base.`)) return

    setDeleting(doc.id)
    try {
      await deleteDocument(doc.id)
      setDocuments((prev) => prev.filter((item) => item.id !== doc.id))
      toast.success(`Deleted "${doc.title}"`)
    } catch {
      toast.error('Failed to delete document')
    } finally {
      setDeleting(null)
    }
  }

  const handleRepairIndex = async () => {
    setRepairing(true)
    try {
      const result = await reindexDocuments()
      await refreshDocuments()
      if (result.failed?.length) {
        toast.error(`Reindexed ${result.indexed} documents, ${result.failed.length} failed`)
      } else {
        toast.success(`Indexed ${result.indexed} documents`)
      }
    } catch {
      toast.error('Failed to repair document index')
    } finally {
      setRepairing(false)
    }
  }

  const filtered = documents.filter((doc) =>
    (doc.title || '').toLowerCase().includes(search.toLowerCase())
  )

  const missingIndexCount = documents.filter((doc) => doc.chunk_count === 0).length

  return (
    <div className="space-y-8">
      <div className="page-header-band">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="page-kicker mb-4">
              <HiOutlineSparkles className="h-4 w-4" />
              Document library
            </div>
            <h2 className="text-3xl font-black text-text-primary sm:text-4xl">Browse your indexed knowledge base.</h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-text-secondary sm:text-base">
              Search across uploaded files, inspect chunk counts, and prune the collection when you
              want a tighter retrieval set.
            </p>
          </div>

          <div className="flex w-full max-w-2xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
            {missingIndexCount > 0 && (
              <button
                onClick={handleRepairIndex}
                disabled={repairing}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/75 bg-white/80 px-5 py-3 text-sm font-bold text-text-primary shadow-sm transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <HiOutlineArrowPath className={`h-4 w-4 ${repairing ? 'animate-spin' : ''}`} />
                {repairing ? 'Repairing index...' : `Index missing files (${missingIndexCount})`}
              </button>
            )}

            <div className="relative w-full max-w-sm">
              <HiOutlineMagnifyingGlass className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                placeholder="Search files..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="w-full rounded-full border border-white/70 bg-white/85 py-3 pl-11 pr-4 text-sm text-text-primary shadow-sm outline-none transition focus:border-primary/25"
              />
            </div>
          </div>
        </div>
      </div>

      {loading && (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((item) => (
            <div key={item} className="h-52 skeleton" />
          ))}
        </div>
      )}

      {!loading && documents.length === 0 && (
        <Motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="section-card px-6 py-20 text-center"
        >
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[1.6rem] bg-primary/10 text-primary">
            <HiOutlineDocumentText className="h-9 w-9" />
          </div>
          <h3 className="mt-6 text-2xl font-black text-text-primary">Your library is waiting for its first upload.</h3>
          <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-text-secondary">
            Add a file and this space becomes the retrieval layer behind your chat experience.
          </p>
          <button
            onClick={() => navigate('/upload')}
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-text-primary px-7 py-3 text-sm font-bold text-white transition-transform hover:-translate-y-1"
          >
            <HiOutlineCloudArrowUp className="h-5 w-5" />
            Upload a document
          </button>
        </Motion.div>
      )}

      {!loading && documents.length > 0 && (
        <>
          <div className="flex flex-wrap gap-3">
            <div className="metric-pill text-xs font-bold uppercase tracking-[0.18em] text-text-secondary">
              {documents.length} documents total
            </div>
            <div className="metric-pill text-xs font-bold uppercase tracking-[0.18em] text-text-secondary">
              {filtered.length} visible in current search
            </div>
            <div className="metric-pill text-xs font-bold uppercase tracking-[0.18em] text-text-secondary">
              {documents.length - missingIndexCount} indexed
            </div>
          </div>

          {filtered.length > 0 ? (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              <AnimatePresence>
                {filtered.map((doc, index) => (
                  <Motion.div
                    key={doc.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{ delay: index * 0.04 }}
                    className="section-card lift-card group p-6"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/15 to-accent/15 text-primary">
                          <HiOutlineDocumentText className="h-6 w-6" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="truncate text-base font-black text-text-primary" title={doc.title}>
                            {doc.title}
                          </h3>
                          <p className="mt-1 truncate text-sm text-text-muted" title={doc.file_name}>
                            {doc.file_name || doc.title}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleDelete(doc)}
                        disabled={deleting === doc.id}
                        className="rounded-full bg-white/85 p-2 text-text-muted transition hover:bg-red-50 hover:text-error disabled:opacity-50"
                        title="Delete document"
                      >
                        {deleting === doc.id ? (
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-200 border-t-error" />
                        ) : (
                          <HiOutlineTrash className="h-4 w-4" />
                        )}
                      </button>
                    </div>

                    <div className="mt-6 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-2xl bg-white/78 p-4">
                        <div className="flex items-center gap-2 text-text-muted">
                          <HiOutlineCube className="h-4 w-4" />
                          <span className="text-[11px] font-bold uppercase tracking-[0.18em]">Chunks</span>
                        </div>
                        <p className="mt-3 text-2xl font-black text-text-primary">{doc.chunk_count}</p>
                        {doc.chunk_count === 0 && (
                          <p className="mt-2 text-[11px] font-bold uppercase tracking-[0.16em] text-amber-600">
                            Not indexed yet
                          </p>
                        )}
                        {doc.file_missing && (
                          <p className="mt-2 text-[11px] font-bold uppercase tracking-[0.16em] text-red-600">
                            Source file missing
                          </p>
                        )}
                      </div>
                      <div className="rounded-2xl bg-white/78 p-4">
                        <div className="flex items-center gap-2 text-text-muted">
                          <HiOutlineSparkles className="h-4 w-4" />
                          <span className="text-[11px] font-bold uppercase tracking-[0.18em]">Uploaded</span>
                        </div>
                        <p className="mt-3 text-base font-black text-text-primary">{formatDate(doc.uploaded_at)}</p>
                      </div>
                    </div>
                  </Motion.div>
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <div className="section-card px-6 py-16 text-center">
              <HiOutlineMagnifyingGlass className="mx-auto h-12 w-12 text-text-muted/70" />
              <h3 className="mt-5 text-xl font-black text-text-primary">No documents match that search.</h3>
              <p className="mt-2 text-sm text-text-muted">Try a different file name or clear the filter.</p>
              <button
                onClick={() => setSearch('')}
                className="mt-6 rounded-full border border-white/70 bg-white/85 px-5 py-2.5 text-sm font-bold text-text-primary"
              >
                Clear search
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
