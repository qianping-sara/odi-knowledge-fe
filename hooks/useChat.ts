"use client"

import { useState, useCallback, useRef } from "react"
import { flushSync } from "react-dom"
import type { UIMessage, ToolCall, Session } from "@/lib/types"
import {
  fetchSessions,
  createSession,
  deleteSession,
  sendMessageStream,
} from "@/lib/api"

function generateId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

export function useChat() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  const [messages, setMessages] = useState<UIMessage[]>([])
  const [isStreaming, setIsStreaming] = useState(false)
  const [sessionsLoaded, setSessionsLoaded] = useState(false)
  const abortRef = useRef<(() => void) | null>(null)

  // Load sessions from API
  const loadSessions = useCallback(async () => {
    try {
      const data = await fetchSessions()
      setSessions(data)
      setSessionsLoaded(true)
    } catch (err) {
      console.error("[v0] Failed to load sessions:", err)
      setSessionsLoaded(true)
    }
  }, [])

  // Select a session and load its messages
  const selectSession = useCallback(async (sessionId: string, sessionData?: Session) => {
    setActiveSessionId(sessionId)
    let s = sessionData
    if (!s) {
      s = sessions.find((x) => x.id === sessionId)
    }
    if (s?.messages && s.messages.length > 0) {
      const uiMessages: UIMessage[] = s.messages.map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        toolCalls: [],
        isStreaming: false,
      }))
      setMessages(uiMessages)
    } else {
      setMessages([])
    }
  }, [sessions])

  // Start new session (client side only, backend session created on first message)
  const startNewSession = useCallback(() => {
    setActiveSessionId(null)
    setMessages([])
  }, [])

  // Send a message
  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isStreaming) return

    // Add user message to UI
    const userMsgId = generateId()
    const userMsg: UIMessage = {
      id: userMsgId,
      role: "user",
      content: content.trim(),
    }
    setMessages((prev) => [...prev, userMsg])
    setIsStreaming(true)

    // Placeholder assistant message
    const assistantMsgId = generateId()
    const assistantMsg: UIMessage = {
      id: assistantMsgId,
      role: "assistant",
      content: "",
      toolCalls: [],
      isStreaming: true,
      isThinking: true,
    }
    setMessages((prev) => [...prev, assistantMsg])

    let currentSessionId = activeSessionId

    try {
      // Create session if needed
      if (!currentSessionId) {
        const session = await createSession()
        currentSessionId = session.id
        setActiveSessionId(currentSessionId)
        setSessions((prev) => [session, ...prev])
      }

      let aborted = false
      abortRef.current = () => { aborted = true }

      // Stream response
      for await (const event of sendMessageStream(currentSessionId, content.trim())) {
        if (aborted) break

        if (event.type === "progress") {
          // Update to show "thinking"
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMsgId
                ? { ...m, isThinking: true, isStreaming: true }
                : m
            )
          )
        } else if (event.type === "process") {
          if (event.subtype === "tool_start") {
            const newTool: ToolCall = {
              tool_call_id: event.tool_call_id,
              tool_name: event.tool_name,
              status: "running",
              input: event.input,
              expanded: false,
            }
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantMsgId
                  ? {
                      ...m,
                      isThinking: false,
                      toolCalls: [...(m.toolCalls ?? []), newTool],
                    }
                  : m
              )
            )
          } else if (event.subtype === "tool_end") {
            setMessages((prev) =>
              prev.map((m) => {
                if (m.id !== assistantMsgId) return m
                const updatedTools = (m.toolCalls ?? []).map((t) =>
                  t.tool_call_id === event.tool_call_id
                    ? {
                        ...t,
                        status: event.status as "completed" | "error",
                        output_raw: event.output_raw,
                        output_preview: event.output_preview,
                        error: event.error,
                      }
                    : t
                )
                return { ...m, toolCalls: updatedTools }
              })
            )
          }
        } else if (event.type === "answer_delta") {
          // Tools 完成后，后端以增量形式流式推送答案，逐片段追加展示
          // 使用 flushSync 强制每次 delta 后立即渲染，避免 React 批处理导致「一次性展示」
          flushSync(() => {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantMsgId
                  ? {
                      ...m,
                      content: m.content + (event.delta ?? ""),
                      isThinking: false,
                      isStreaming: true,
                    }
                  : m
              )
            )
          })
        } else if (event.type === "final") {
          // If a new session was auto-created by backend, sync the session_id
          if (event.session_id && event.session_id !== currentSessionId) {
            currentSessionId = event.session_id
            setActiveSessionId(currentSessionId)
          }
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMsgId
                ? {
                    ...m,
                    content: event.answer,
                    isStreaming: false,
                    isThinking: false,
                    sessionId: event.session_id,
                  }
                : m
            )
          )
          // Refresh session list to pick up new name
          loadSessions()
        } else if (event.type === "error") {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMsgId
                ? {
                    ...m,
                    content: `Error: ${event.message}`,
                    isStreaming: false,
                    isThinking: false,
                  }
                : m
            )
          )
        }
      }
    } catch (err) {
      console.error("[v0] Stream error:", err)
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMsgId
            ? {
                ...m,
                content: "An error occurred. Please try again.",
                isStreaming: false,
                isThinking: false,
              }
            : m
        )
      )
    } finally {
      setIsStreaming(false)
      // Ensure streaming is cleared
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMsgId && m.isStreaming
            ? { ...m, isStreaming: false, isThinking: false }
            : m
        )
      )
    }
  }, [activeSessionId, isStreaming, loadSessions])

  // Delete a single session
  const removeSession = useCallback(async (sessionId: string) => {
    try {
      await deleteSession([sessionId])
      setSessions((prev) => prev.filter((s) => s.id !== sessionId))
      if (activeSessionId === sessionId) {
        setActiveSessionId(null)
        setMessages([])
      }
    } catch (err) {
      console.error("[v0] Failed to delete session:", err)
    }
  }, [activeSessionId])

  // Delete all sessions
  const removeAllSessions = useCallback(async () => {
    try {
      const ids = sessions.map((s) => s.id)
      if (ids.length > 0) await deleteSession(ids)
      setSessions([])
      setActiveSessionId(null)
      setMessages([])
    } catch (err) {
      console.error("[v0] Failed to delete all sessions:", err)
    }
  }, [sessions])

  // Toggle tool call expanded
  const toggleToolCall = useCallback((messageId: string, toolCallId: string) => {
    setMessages((prev) =>
      prev.map((m) => {
        if (m.id !== messageId) return m
        return {
          ...m,
          toolCalls: (m.toolCalls ?? []).map((t) =>
            t.tool_call_id === toolCallId ? { ...t, expanded: !t.expanded } : t
          ),
        }
      })
    )
  }, [])

  return {
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
  }
}
