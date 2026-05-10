import { useState } from 'react'
import { motion as Motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  HiOutlineChatBubbleLeftRight,
  HiOutlineClock,
  HiOutlineMagnifyingGlass,
  HiOutlineSparkles,
  HiOutlineTrash,
} from 'react-icons/hi2'
import { useChat } from '../context/ChatContext'

export default function HistoryPage() {
  const { history, loadChat, clearHistory } = useChat()
  const [search, setSearch] = useState('')
  const navigate = useNavigate()

  const filtered = history.filter((chat) =>
    chat.preview.toLowerCase().includes(search.toLowerCase()) ||
    new Date(chat.date).toLocaleDateString().includes(search)
  )

  const handleOpen = (id) => {
    loadChat(id)
    navigate('/chat')
  }

  const handleClear = () => {
    if (!confirm('Clear all conversation history?')) return
    clearHistory()
    toast.success('History cleared')
  }

  return (
    <div className="space-y-8">
      <div className="page-header-band">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="page-kicker mb-4">
              <HiOutlineSparkles className="h-4 w-4" />
              Memory archive
            </div>
            <h2 className="text-3xl font-black text-text-primary sm:text-4xl">Revisit past conversations quickly.</h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-text-secondary sm:text-base">
              Every saved exchange is surfaced as a searchable thread so you can continue prior analysis
              instead of starting from zero.
            </p>
          </div>

          <div className="flex w-full max-w-md flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <HiOutlineMagnifyingGlass className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                placeholder="Search history..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="w-full rounded-full border border-white/70 bg-white/85 py-3 pl-11 pr-4 text-sm text-text-primary shadow-sm outline-none transition focus:border-primary/25"
              />
            </div>
            {history.length > 0 && (
              <button
                onClick={handleClear}
                className="rounded-full border border-red-100 bg-white/82 px-5 py-3 text-sm font-bold text-error transition hover:bg-red-50"
              >
                Clear all
              </button>
            )}
          </div>
        </div>
      </div>

      {history.length === 0 && (
        <Motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="section-card px-6 py-20 text-center"
        >
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[1.6rem] bg-primary/10 text-primary">
            <HiOutlineClock className="h-9 w-9" />
          </div>
          <h3 className="mt-6 text-2xl font-black text-text-primary">No history yet.</h3>
          <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-text-secondary">
            Once you start asking questions, the conversation timeline will appear here.
          </p>
          <button
            onClick={() => navigate('/chat')}
            className="mt-8 rounded-full bg-text-primary px-7 py-3 text-sm font-bold text-white transition-transform hover:-translate-y-1"
          >
            Start chatting
          </button>
        </Motion.div>
      )}

      {history.length > 0 && (
        <div className="space-y-3">
          <AnimatePresence>
            {filtered.map((chat, index) => (
              <Motion.button
                key={chat.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ delay: index * 0.04 }}
                onClick={() => handleOpen(chat.id)}
                className="section-card lift-card flex w-full flex-col gap-4 p-5 text-left sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/15 to-accent/15 text-primary">
                    <HiOutlineChatBubbleLeftRight className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="line-clamp-1 text-base font-black text-text-primary">{chat.preview}</h3>
                    <div className="mt-2 flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-text-muted">
                      <span>{new Date(chat.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                      <span>{new Date(chat.date).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</span>
                      <span>{chat.messages.length} messages</span>
                    </div>
                  </div>
                </div>
                <div className="rounded-full bg-white/80 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-primary">
                  Open chat
                </div>
              </Motion.button>
            ))}
          </AnimatePresence>

          {filtered.length === 0 && search && (
            <div className="section-card px-6 py-14 text-center">
              <HiOutlineMagnifyingGlass className="mx-auto h-10 w-10 text-text-muted/70" />
              <p className="mt-4 text-sm text-text-muted">No conversations match "{search}"</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
