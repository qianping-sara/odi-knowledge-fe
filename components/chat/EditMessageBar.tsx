"use client"

import { useRef, useEffect, KeyboardEvent } from "react"
import { ArrowUp, X } from "lucide-react"

interface EditMessageBarProps {
  value: string
  onChange: (v: string) => void
  onCancel: () => void
  onSend: () => void
}

export default function EditMessageBar({ value, onChange, onCancel, onSend }: EditMessageBarProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    textareaRef.current?.focus()
    const el = textareaRef.current
    if (el) {
      el.selectionStart = el.value.length
      el.selectionEnd = el.value.length
    }
  }, [])

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      if (value.trim()) onSend()
    }
    if (e.key === "Escape") onCancel()
  }

  const canSend = value.trim().length > 0

  return (
    <div
      className="relative z-10 px-4 md:px-8 pb-5 pt-3 flex-shrink-0"
      style={{
        background: "linear-gradient(to top, var(--background) 70%, transparent)",
      }}
    >
      <div
        className="rounded-2xl border overflow-hidden"
        style={{
          borderColor: "var(--primary)",
          background: "var(--background)",
          boxShadow: "0 2px 16px rgba(0,0,0,0.06)",
        }}
      >
        {/* Editable textarea */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={3}
          className="w-full bg-transparent resize-none text-sm text-foreground outline-none leading-relaxed px-4 pt-3 pb-1"
          placeholder="Edit your message..."
          aria-label="Edit message"
        />
        {/* Action row — inside the box */}
        <div className="flex items-center justify-end gap-2 px-3 pb-3">
          <button
            onClick={onCancel}
            className="w-8 h-8 rounded-xl flex items-center justify-center border transition-colors hover:bg-muted"
            style={{ borderColor: "var(--border)", color: "var(--muted-foreground)" }}
            aria-label="Cancel edit"
          >
            <X className="w-4 h-4" />
          </button>
          <button
            onClick={onSend}
            disabled={!canSend}
            className="w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-200"
            style={{
              background: canSend ? "var(--primary)" : "var(--muted)",
              color: canSend ? "var(--primary-foreground)" : "var(--muted-foreground)",
              opacity: canSend ? 1 : 0.4,
            }}
            aria-label="Send edited message"
          >
            <ArrowUp className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
