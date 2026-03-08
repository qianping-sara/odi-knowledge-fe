"use client"

import { useRef, useEffect } from "react"
import type { UIMessage } from "@/lib/types"
import MessageBubble from "./MessageBubble"
import WelcomeScreen from "./WelcomeScreen"

interface ChatAreaProps {
  messages: UIMessage[]
  isNewSession: boolean
  onEditMessage: (content: string) => void
  onToggleToolCall: (messageId: string, toolCallId: string) => void
  onOpenSource?: (filename: string) => void
}

export default function ChatArea({
  messages,
  isNewSession,
  onEditMessage,
  onToggleToolCall,
  onOpenSource,
}: ChatAreaProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  // Only scroll to bottom on new messages or streaming updates, NOT on tool expand/collapse
  const scrollTrigger = messages.length > 0
    ? `${messages.length}-${messages[messages.length - 1]?.content?.length ?? 0}`
    : "0"
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [scrollTrigger])

  if (isNewSession && messages.length === 0) {
    return (
      <div className="flex flex-col h-full">
        <WelcomeScreen />
        <div ref={bottomRef} />
      </div>
    )
  }

  return (
    <div className="px-4 md:px-8 pt-6 pb-2">
      {messages.map((msg) => (
        <MessageBubble
          key={msg.id}
          message={msg}
          onEditMessage={onEditMessage}
          onToggleToolCall={onToggleToolCall}
          onOpenSource={onOpenSource}
        />
      ))}
      <div ref={bottomRef} />
    </div>
  )
}
