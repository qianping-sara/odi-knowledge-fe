"use client"

import { useRef, useEffect, KeyboardEvent } from "react"
import { ArrowUp } from "lucide-react"

interface ChatInputProps {
  value: string
  onChange: (v: string) => void
  onSend: () => void
  disabled?: boolean
  placeholder?: string
}

export default function ChatInput({
  value,
  onChange,
  onSend,
  disabled,
  placeholder = "Ask anything...",
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = "auto"
    const maxLines = window.innerWidth < 768 ? 1 : 2
    const lineHeight = 24
    const maxHeight = maxLines * lineHeight + 24 // padding
    el.style.height = Math.min(el.scrollHeight, maxHeight) + "px"
  }, [value])

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      if (value.trim() && !disabled) onSend()
    }
  }

  const canSend = value.trim().length > 0 && !disabled

  return (
    <div
      className="relative z-10 px-4 md:px-8 pb-5 pt-3 flex-shrink-0"
      style={{
        background: "linear-gradient(to top, var(--background) 70%, transparent)",
      }}
    >
      <div
        className="rounded-2xl border flex items-end gap-2 px-4 pt-3 pb-3"
        style={{
          borderColor: "var(--border)",
          background: "var(--background)",
          boxShadow: "0 2px 16px rgba(0,0,0,0.06)",
        }}
      >
        <textarea
          ref={textareaRef}
          rows={1}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={placeholder}
          className="flex-1 resize-none bg-transparent text-foreground placeholder:text-muted-foreground/50 text-sm leading-6 outline-none"
          style={{ minHeight: "24px" }}
          aria-label="Message input"
        />
        <button
          onClick={onSend}
          disabled={!canSend}
          className="flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-200"
          style={{
            background: canSend ? "var(--primary)" : "var(--muted)",
            color: canSend ? "var(--primary-foreground)" : "var(--muted-foreground)",
            opacity: canSend ? 1 : 0.4,
          }}
          aria-label="Send message"
        >
          <ArrowUp className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
