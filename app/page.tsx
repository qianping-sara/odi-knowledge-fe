"use client"

import { useState, useEffect } from "react"
import { useChat } from "@/hooks/useChat"
import Header from "@/components/chat/Header"
import Sidebar from "@/components/chat/Sidebar"
import ChatArea from "@/components/chat/ChatArea"
import ChatInput from "@/components/chat/ChatInput"
import EditMessageBar from "@/components/chat/EditMessageBar"

export default function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [inputValue, setInputValue] = useState("")
  const [editMode, setEditMode] = useState(false)
  const [editValue, setEditValue] = useState("")
  const [isMd, setIsMd] = useState(false)

  // Track viewport size
  useEffect(() => {
    function check() { setIsMd(window.innerWidth >= 768) }
    check()
    window.addEventListener("resize", check)
    return () => window.removeEventListener("resize", check)
  }, [])

  const {
    sessions,
    activeSessionId,
    messages,
    isStreaming,
    sessionsLoaded,
    loadSessions,
    selectSession,
    startNewSession,
    sendMessage,
    removeSession,
    removeAllSessions,
    toggleToolCall,
  } = useChat()

  // Load sessions on mount
  useEffect(() => {
    loadSessions()
  }, [loadSessions])

  // Open sidebar on desktop by default
  useEffect(() => {
    if (window.innerWidth >= 768) setSidebarOpen(true)
  }, [])

  function handleToggleSidebar() {
    setSidebarOpen((v) => !v)
  }

  function handleNewSession() {
    startNewSession()
  }

  async function handleSend() {
    if (!inputValue.trim() || isStreaming) return
    const text = inputValue.trim()
    setInputValue("")
    await sendMessage(text)
  }

  function handleEditMessage(content: string) {
    setEditValue(content)
    setEditMode(true)
    setInputValue("")
  }

  function handleCancelEdit() {
    setEditMode(false)
    setEditValue("")
  }

  async function handleSendEdit() {
    if (!editValue.trim()) return
    const text = editValue.trim()
    setEditMode(false)
    setEditValue("")
    await sendMessage(text)
  }

  const isNewSession = !activeSessionId && messages.length === 0

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      {/* Fixed Header */}
      <Header
        sidebarOpen={sidebarOpen}
        onToggleSidebar={handleToggleSidebar}
        onNewSession={handleNewSession}
        onDeleteAllSessions={removeAllSessions}
      />

      {/* Below header */}
      <div className="flex flex-1 overflow-hidden pt-14">
        {/* Sidebar */}
        <Sidebar
          open={sidebarOpen}
          sessions={sessions}
          activeSessionId={activeSessionId}
          onSelectSession={(id) => {
            const s = sessions.find((x) => x.id === id)
            selectSession(id, s)
          }}
          onDeleteSession={removeSession}
        />

        {/* Main content: offset when sidebar open on desktop */}
        <main
          className="flex-1 flex flex-col overflow-hidden transition-[margin] duration-300"
          style={{
            marginLeft: sidebarOpen && isMd ? "16rem" : "0",
          }}
        >
          {/* Chat area — fills available space */}
          <div className="flex-1 overflow-y-auto">
            <ChatArea
              messages={messages}
              isNewSession={isNewSession}
              onEditMessage={handleEditMessage}
              onToggleToolCall={toggleToolCall}
            />
          </div>

          {/* Input area */}
          {editMode ? (
            <EditMessageBar
              value={editValue}
              onChange={setEditValue}
              onCancel={handleCancelEdit}
              onSend={handleSendEdit}
            />
          ) : (
            <ChatInput
              value={inputValue}
              onChange={setInputValue}
              onSend={handleSend}
              disabled={isStreaming}
              placeholder={
                isStreaming
                  ? "AI is responding..."
                  : isNewSession
                  ? "Ask anything about ODI China..."
                  : "Continue the conversation..."
              }
            />
          )}
        </main>
      </div>
    </div>
  )
}
