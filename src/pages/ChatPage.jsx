import { useState, useEffect, useRef } from 'react'
import { motion as Motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import {
  HiOutlineArrowDown,
  HiOutlineDocumentText,
  HiOutlinePaperAirplane,
  HiOutlinePlus,
  HiOutlineSparkles,
} from 'react-icons/hi2'
import { RiRobot2Line } from 'react-icons/ri'
import { listDocuments } from '../services/api'
import { useChat } from '../context/ChatContext'

const promptIdeas = [
  'Summarize the selected document in five points.',
  'What are the most important dates mentioned?',
  'Find the exact amount, name, or identifier from the source.',
]

export default function ChatPage() {
  const {
    messages, setMessages,
    loading, setLoading,
    documents, setDocuments,
    selectedDoc, setSelectedDoc,
    startNewChat,
    history, loadChat,
    settings,
  } = useChat()

  const [input, setInput] = useState('')
  const [showDocDrop, setShowDocDrop] = useState(false)
  const [isAtBottom, setIsAtBottom] = useState(true)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)
  const scrollRef = useRef(null)

  useEffect(() => {
    if (documents.length === 0) {
      listDocuments()
        .then((data) => setDocuments(data.documents || []))
        .catch(() => {})
    }
  }, [documents.length, setDocuments])

  useEffect(() => {
    if (isAtBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, loading, isAtBottom])

  const handleScroll = () => {
    if (!scrollRef.current) return
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current
    setIsAtBottom(scrollHeight - scrollTop - clientHeight < 60)
  }

  const handleSend = async () => {
    if (!input.trim() || loading) return

    const question = input.trim()
    setInput('')
    setMessages((prev) => [...prev, { role: 'user', content: question }])
    setLoading(true)
    setMessages((prev) => [...prev, { role: 'assistant', content: '', sources: [], streaming: true }])

    try {
      const payload = {
        question,
        document_id: selectedDoc,
        top_k: settings.topK,
        stream: settings.stream,
      }

      if (settings.stream) {
        const res = await fetch('/api/ask-question/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!res.ok) throw new Error('Network error')

        const reader = res.body.getReader()
        const decoder = new TextDecoder('utf-8')
        let done = false

        while (!done) {
          const { value, done: readerDone } = await reader.read()
          done = readerDone

          if (value) {
            const text = decoder.decode(value, { stream: true })

            for (const line of text.split('\n')) {
              if (!line.startsWith('data: ')) continue

              const raw = line.replace('data: ', '').trim()
              if (raw === '[DONE]') {
                setMessages((prev) => prev.map((message, index) =>
                  index === prev.length - 1 ? { ...message, streaming: false } : message
                ))
                break
              }

              try {
                const data = JSON.parse(raw)

                if (data.type === 'sources') {
                  setMessages((prev) => prev.map((message, index) =>
                    index === prev.length - 1 ? { ...message, sources: data.sources } : message
                  ))
                } else if (data.type === 'token') {
                  setMessages((prev) => prev.map((message, index) =>
                    index === prev.length - 1
                      ? { ...message, content: message.content + data.content }
                      : message
                  ))
                }
              } catch {
                // Ignore partial JSON chunks while streaming.
              }
            }
          }
        }
      } else {
        const res = await fetch('/api/ask-question/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        const data = await res.json()

        setMessages((prev) => prev.map((message, index) =>
          index === prev.length - 1
            ? { ...message, content: data.answer, sources: data.sources, streaming: false }
            : message
        ))
      }
    } catch {
      toast.error('Failed to get answer')
      setMessages((prev) => prev.map((message, index) =>
        index === prev.length - 1
          ? { ...message, content: 'Sorry, an error occurred.', error: true, streaming: false }
          : message
      ))
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      handleSend()
    }
  }

  const selectedTitle = selectedDoc
    ? (documents.find((doc) => doc.id === selectedDoc)?.title || 'Selected document')
    : 'All documents'

  return (
    <div className="space-y-6">
      <div className="page-header-band">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="page-kicker mb-4">
              <HiOutlineSparkles className="h-4 w-4" />
              Animated answer workspace
            </div>
            <h2 className="text-3xl font-black text-text-primary sm:text-4xl">Ask with context, not guesswork.</h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-text-secondary sm:text-base">
              The refreshed chat keeps document scope, retrieval settings, and source previews visible
              so answers feel more grounded and easier to trust.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <div className="metric-pill text-xs font-bold uppercase tracking-[0.18em] text-text-secondary">
              <span className="h-2 w-2 rounded-full bg-primary pulse-dot" />
              Top-K {settings.topK}
            </div>
            <div className="metric-pill text-xs font-bold uppercase tracking-[0.18em] text-text-secondary">
              <span className="h-2 w-2 rounded-full bg-accent pulse-dot" />
              Chunk {settings.chunkSize}
            </div>
            <div className="metric-pill text-xs font-bold uppercase tracking-[0.18em] text-text-secondary">
              <span className={`h-2 w-2 rounded-full ${settings.stream ? 'bg-success' : 'bg-text-muted'}`} />
              {settings.stream ? 'Streaming on' : 'Streaming off'}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[290px_minmax(0,1fr)]">
        <aside className="chat-stage p-4">
          <button
            onClick={startNewChat}
            className="relative z-10 flex w-full items-center justify-center gap-2 rounded-2xl bg-text-primary px-4 py-3 text-sm font-bold text-white shadow-xl shadow-text-primary/10 transition-transform hover:-translate-y-1"
          >
            <HiOutlinePlus className="h-4 w-4" />
            Start a new chat
          </button>

          <div className="relative z-10 mt-6 rounded-[1.4rem] bg-white/68 p-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-text-muted">Conversation scope</p>
            <button
              onClick={() => setShowDocDrop((prev) => !prev)}
              className="mt-3 flex w-full items-center justify-between gap-3 rounded-2xl border border-white/60 bg-white/85 px-4 py-3 text-left text-sm font-semibold text-text-primary shadow-sm transition hover:border-primary/20"
            >
              <span className="flex min-w-0 items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <HiOutlineDocumentText className="h-5 w-5" />
                </span>
                <span className="truncate">{selectedTitle}</span>
              </span>
              <span className="text-xs uppercase tracking-[0.18em] text-text-muted">Scope</span>
            </button>

            <AnimatePresence>
              {showDocDrop && (
                <Motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="mt-3 max-h-72 overflow-y-auto rounded-2xl border border-white/60 bg-white/95 p-2 shadow-xl"
                >
                  <button
                    onClick={() => {
                      setSelectedDoc(null)
                      setShowDocDrop(false)
                    }}
                    className={`w-full rounded-xl px-3 py-3 text-left text-sm transition-colors hover:bg-surface-light ${
                      !selectedDoc ? 'bg-primary/10 font-bold text-primary' : 'text-text-secondary'
                    }`}
                  >
                    Entire database
                  </button>
                  {documents.map((doc) => (
                    <button
                      key={doc.id}
                      onClick={() => {
                        setSelectedDoc(doc.id)
                        setShowDocDrop(false)
                      }}
                      className={`mt-1 w-full truncate rounded-xl px-3 py-3 text-left text-sm transition-colors hover:bg-surface-light ${
                        selectedDoc === doc.id ? 'bg-primary/10 font-bold text-primary' : 'text-text-secondary'
                      }`}
                    >
                      {doc.title}
                    </button>
                  ))}
                </Motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="relative z-10 mt-6 rounded-[1.4rem] bg-white/68 p-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-text-muted">Previous chats</p>
            <div className="mt-3 max-h-[26rem] space-y-2 overflow-y-auto pr-1">
              {history.length === 0 ? (
                <p className="rounded-2xl bg-white/80 px-4 py-5 text-sm leading-6 text-text-muted">
                  Your history will appear here after the first conversation.
                </p>
              ) : (
                history.map((chat) => (
                  <button
                    key={chat.id}
                    onClick={() => loadChat(chat.id)}
                    className="w-full rounded-2xl border border-white/55 bg-white/82 px-4 py-3 text-left text-sm text-text-secondary transition hover:-translate-y-0.5 hover:border-primary/20 hover:text-text-primary"
                  >
                    <div className="line-clamp-2 font-semibold">{chat.preview}</div>
                    <div className="mt-2 text-[11px] uppercase tracking-[0.18em] text-text-muted">
                      {new Date(chat.date).toLocaleDateString()}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </aside>

        <section className="chat-stage relative min-h-[68vh] p-3 sm:p-4">
          <div
            ref={scrollRef}
            onScroll={handleScroll}
            className="relative z-10 flex h-full flex-col overflow-y-auto rounded-[1.6rem] bg-white/34 pb-36"
          >
            {messages.length === 0 && (
              <Motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex min-h-[28rem] flex-col items-center justify-center px-6 py-16 text-center"
              >
                <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-[1.8rem] bg-gradient-to-br from-primary to-accent text-white shadow-2xl shadow-primary/15">
                  <RiRobot2Line className="h-10 w-10" />
                </div>
                <h3 className="text-3xl font-black text-text-primary">What do you want to uncover?</h3>
                <p className="mt-3 max-w-xl text-sm leading-7 text-text-secondary sm:text-base">
                  Ask for a summary, a specific value, a comparison, or a timeline. The assistant will
                  search your indexed context first and then answer.
                </p>

                <div className="mt-8 flex max-w-2xl flex-wrap justify-center gap-3">
                  {promptIdeas.map((idea) => (
                    <button
                      key={idea}
                      onClick={() => setInput(idea)}
                      className="rounded-full border border-white/70 bg-white/80 px-4 py-2.5 text-sm font-semibold text-text-secondary shadow-sm transition hover:-translate-y-0.5 hover:text-text-primary"
                    >
                      {idea}
                    </button>
                  ))}
                </div>
              </Motion.div>
            )}

            <div className="mx-auto w-full max-w-4xl space-y-5 px-3 py-4 sm:px-5">
              <AnimatePresence initial={false}>
                {messages.map((msg, index) => (
                  <Motion.div
                    key={index}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className="max-w-[88%]">
                      <div
                        className={`rounded-[1.7rem] px-5 py-4 text-[15px] leading-7 shadow-sm ${
                          msg.role === 'user'
                            ? 'rounded-tr-md bg-text-primary text-white'
                            : msg.error
                              ? 'rounded-tl-md border border-red-100 bg-red-50 text-red-700'
                              : 'rounded-tl-md border border-white/70 bg-white/88 text-text-primary'
                        }`}
                      >
                        {msg.role === 'user' ? (
                          <p className="whitespace-pre-wrap">{msg.content}</p>
                        ) : (() => {
                          const content = msg.content || ''
                          const hasThink = content.includes('<think>')
                          const parts = hasThink
                            ? content.split(/(<think>[\s\S]*?<\/think>|<think>[\s\S]*$)/g).filter(Boolean)
                            : [content]

                          return (
                            <div className="space-y-3">
                              {parts.map((part, partIndex) => {
                                if (part.startsWith('<think>')) {
                                  let thinkText = part.replace('<think>', '')
                                  if (thinkText.endsWith('</think>')) thinkText = thinkText.slice(0, -8)

                                  return (
                                    <details
                                      key={partIndex}
                                      open={partIndex === parts.length - 1 && msg.streaming}
                                      className="overflow-hidden rounded-2xl border border-border bg-surface-light"
                                    >
                                      <summary className="flex cursor-pointer items-center justify-between bg-white/75 px-4 py-3 text-xs font-bold uppercase tracking-[0.18em] text-text-secondary transition hover:bg-white">
                                        <span className="flex items-center gap-2">
                                          <HiOutlineSparkles className="h-4 w-4 text-primary" />
                                          Reasoning trail
                                        </span>
                                        <span>Open</span>
                                      </summary>
                                      <div className="border-t border-border/50 p-4 text-sm italic text-text-muted">
                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{thinkText}</ReactMarkdown>
                                      </div>
                                    </details>
                                  )
                                }

                                return (
                                  <div
                                    key={partIndex}
                                    className="prose prose-sm max-w-none prose-p:leading-7 prose-pre:border prose-pre:border-border prose-pre:bg-surface-light prose-a:text-primary prose-code:text-primary prose-strong:text-text-primary prose-headings:text-text-primary"
                                  >
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{part}</ReactMarkdown>
                                  </div>
                                )
                              })}

                              {msg.streaming && (
                                <span className="inline-block h-4 w-2 rounded-sm bg-primary animate-pulse" />
                              )}
                            </div>
                          )
                        })()}
                      </div>

                      {msg.sources && msg.sources.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2 px-1">
                          {msg.sources.map((src, sourceIndex) => (
                            <div key={sourceIndex} className="group/source relative">
                              <span className="inline-flex cursor-pointer items-center rounded-full border border-white/70 bg-white/88 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-text-secondary transition hover:border-primary/20 hover:text-primary">
                                Source {sourceIndex + 1}
                              </span>
                              <div className="pointer-events-none invisible absolute bottom-full left-0 z-20 mb-2 w-72 rounded-2xl border border-white/65 bg-white/95 p-4 opacity-0 shadow-2xl transition-all duration-200 group-hover/source:visible group-hover/source:opacity-100">
                                <p className="text-sm font-bold text-primary">{src.document}</p>
                                <p className="mt-2 text-xs leading-6 text-text-secondary">"{src.text_preview}"</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </Motion.div>
                ))}

                {loading && !messages.some((message) => message.streaming) && (
                  <Motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex justify-start">
                    <div className="flex items-center gap-1.5 rounded-[1.5rem] border border-white/70 bg-white/90 px-5 py-4 shadow-sm">
                      {[0, 150, 300].map((delay) => (
                        <div
                          key={delay}
                          className="h-2.5 w-2.5 animate-bounce rounded-full bg-text-muted"
                          style={{ animationDelay: `${delay}ms` }}
                        />
                      ))}
                    </div>
                  </Motion.div>
                )}
              </AnimatePresence>
              <div ref={messagesEndRef} />
            </div>
          </div>

          <AnimatePresence>
            {!isAtBottom && (
              <Motion.button
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                onClick={() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })}
                className="absolute bottom-28 left-1/2 z-20 flex h-11 w-11 -translate-x-1/2 items-center justify-center rounded-full border border-white/70 bg-white/95 text-text-muted shadow-lg transition hover:text-primary"
              >
                <HiOutlineArrowDown className="h-5 w-5" />
              </Motion.button>
            )}
          </AnimatePresence>

          <div className="absolute inset-x-0 bottom-0 z-20 px-3 pb-3 pt-12 sm:px-4">
            <div className="mx-auto max-w-4xl rounded-[1.8rem] border border-white/70 bg-white/92 p-2 shadow-2xl shadow-text-primary/8 backdrop-blur-xl">
              <div className="flex items-end gap-2 rounded-[1.3rem] bg-surface-light/75 px-3 py-2">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask anything about your documents..."
                  rows={1}
                  className="min-h-[48px] max-h-[160px] flex-1 resize-none bg-transparent px-1 py-2 text-[15px] text-text-primary placeholder:text-text-muted focus:outline-none"
                  style={{ overflow: 'auto' }}
                  onInput={(event) => {
                    event.target.style.height = 'auto'
                    event.target.style.height = `${Math.min(event.target.scrollHeight, 160)}px`
                  }}
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || loading}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-text-primary text-white shadow-lg shadow-text-primary/10 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <HiOutlinePaperAirplane className="h-5 w-5 -rotate-45" />
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
