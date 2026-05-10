/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect } from 'react'
import { v4 as uuidv4 } from 'uuid'

const ChatContext = createContext()

export function ChatProvider({ children }) {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)
  const [documents, setDocuments] = useState([])
  const [selectedDoc, setSelectedDoc] = useState(null)
  const [currentChatId, setCurrentChatId] = useState(() => uuidv4())

  const [history, setHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('chat_history')
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })

  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('rag_settings')
      return saved ? JSON.parse(saved) : { stream: true, topK: 5, chunkSize: 800 }
    } catch {
      return { stream: true, topK: 5, chunkSize: 800 }
    }
  })

  useEffect(() => {
    localStorage.setItem('chat_history', JSON.stringify(history))
  }, [history])

  useEffect(() => {
    localStorage.setItem('rag_settings', JSON.stringify(settings))
  }, [settings])

  useEffect(() => {
    if (messages.length > 0) {
      setHistory(prev => {
        const existingIdx = prev.findIndex(h => h.id === currentChatId)
        const updatedChat = {
          id: currentChatId,
          date: prev[existingIdx]?.date || new Date().toISOString(),
          messages,
          preview: messages[0].content.substring(0, 60) + (messages[0].content.length > 60 ? '...' : ''),
        }
        if (existingIdx >= 0) {
          const next = [...prev]
          next[existingIdx] = updatedChat
          return next
        }
        return [updatedChat, ...prev]
      })
    }
  }, [messages, currentChatId])

  const startNewChat = () => {
    setMessages([])
    setCurrentChatId(uuidv4())
  }

  const loadChat = (chatId) => {
    const chat = history.find(h => h.id === chatId)
    if (chat) {
      setMessages(chat.messages)
      setCurrentChatId(chat.id)
    }
  }

  const clearHistory = () => {
    setHistory([])
    startNewChat()
  }

  return (
    <ChatContext.Provider value={{
      messages, setMessages,
      loading, setLoading,
      documents, setDocuments,
      selectedDoc, setSelectedDoc,
      startNewChat,
      currentChatId, loadChat, clearHistory,
      history, setHistory,
      settings, setSettings,
    }}>
      {children}
    </ChatContext.Provider>
  )
}

export function useChat() {
  const ctx = useContext(ChatContext)
  if (!ctx) throw new Error('useChat must be used within a ChatProvider')
  return ctx
}
