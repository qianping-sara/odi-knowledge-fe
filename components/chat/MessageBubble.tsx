"use client"

import { useState, useRef, useEffect } from "react"
import { Copy, Pencil, Check, Loader2, ChevronDown, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import type { UIMessage, ToolCall } from "@/lib/types"
import ToolCallCard from "./ToolCallCard"

interface MessageBubbleProps {
  message: UIMessage
  onEditMessage: (content: string) => void
  onToggleToolCall: (messageId: string, toolCallId: string) => void
}

function renderMarkdown(text: string): string {
  return text
    // Horizontal rule
    .replace(/^---$/gm, "<hr />")
    // Bold
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    // Italic (not touching bold)
    .replace(/(?<!\*)\*(?!\*)([^*]+?)(?<!\*)\*(?!\*)/g, "<em>$1</em>")
    // Inline code
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    // Headers
    .replace(/^### (.*)/gm, "<h3>$1</h3>")
    .replace(/^## (.*)/gm, "<h2>$1</h2>")
    .replace(/^# (.*)/gm, "<h1>$1</h1>")
    // Unordered list items (incl. bullet •)
    .replace(/^[-*•] (.*)/gm, "<li>$1</li>")
    // Ordered list items
    .replace(/^\d+\. (.*)/gm, "<li>$1</li>")
    // Paragraph breaks — use compact gap
    .replace(/\n\n/g, "<span class='prose-gap' aria-hidden='true'></span>")
    // Single newlines
    .replace(/\n/g, "<br />")
    // Wrap consecutive <li> in <ul>
    .replace(/((?:<li>.*?<\/li>(?:<br \/>)?)+)/g, (m) => "<ul>" + m.replace(/<br \/>/g, "") + "</ul>")
}

function UserMessage({ message, onEdit }: { message: UIMessage; onEdit: (c: string) => void }) {
  const [copied, setCopied] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editValue, setEditValue] = useState(message.content)

  async function handleCopy() {
    await navigator.clipboard.writeText(message.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleEditClick() {
    setEditValue(message.content)
    setEditing(true)
    onEdit(message.content)
  }

  return (
    <div className="flex flex-col items-end gap-2 mb-6">
      <div
        className="max-w-[80%] md:max-w-[65%] rounded-2xl rounded-br-sm px-4 py-3 text-sm leading-relaxed"
        style={{
          background: "var(--user-bubble-bg)",
          border: "1px solid var(--user-bubble-border)",
          color: "var(--user-bubble-text)",
        }}
      >
        {message.content}
      </div>
      <div className="flex items-center gap-1.5">
        <button
          onClick={handleCopy}
          className="w-7 h-7 flex items-center justify-center rounded text-muted-foreground/50 hover:text-muted-foreground hover:bg-muted/50 transition-colors"
          aria-label="Copy message"
        >
          {copied
            ? <Check className="w-3.5 h-3.5" style={{ color: "var(--check-color)" }} />
            : <Copy className="w-3.5 h-3.5" />}
        </button>
        <button
          onClick={handleEditClick}
          className="w-7 h-7 flex items-center justify-center rounded text-muted-foreground/50 hover:text-muted-foreground hover:bg-muted/50 transition-colors"
          aria-label="Edit message"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}

function ThinkingBlock({ isStreaming }: { isStreaming?: boolean }) {
  if (!isStreaming) return null

  return (
    <div className="flex items-start gap-3 mb-2">
      <div className="w-7 h-7 flex-shrink-0 rounded-full flex items-center justify-center border"
        style={{ borderColor: "var(--border)", background: "var(--tool-bg)" }}>
        <Loader2 className="w-3.5 h-3.5 animate-spin" style={{ color: "var(--primary)" }} />
      </div>
      <div className="flex-1">
        <div
          className="rounded-xl border p-3"
          style={{ background: "var(--tool-bg)", borderColor: "var(--tool-border)" }}
        >
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="w-3 h-3 animate-spin" />
            <span>Thinking...</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function AssistantMessage({
  message,
  onToggleToolCall,
}: {
  message: UIMessage
  onToggleToolCall: (toolCallId: string) => void
}) {
  const [copied, setCopied] = useState(false)
  const [thinkExpanded, setThinkExpanded] = useState(false)
  const hasTools = message.toolCalls && message.toolCalls.length > 0
  const hasContent = message.content.trim().length > 0

  async function handleCopy() {
    await navigator.clipboard.writeText(message.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex flex-col items-start gap-2 mb-6">
      <div className="flex items-start gap-3 w-full max-w-3xl">
        <div
          className="w-7 h-7 flex-shrink-0 rounded-full flex items-center justify-center border border-primary/30 mt-0.5 ai-avatar-dark"
          style={{ background: "rgba(var(--primary-rgb, 249 115 22) / 0.08)" }}
        >
          <span className="text-[8px] font-bold" style={{ color: "var(--primary)" }}>A</span>
        </div>

        <div className="flex-1 min-w-0">
          {message.isStreaming && !hasContent && !hasTools && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" style={{ color: "var(--primary)" }} />
              <span>Thinking...</span>
            </div>
          )}

          {/* Tool calls - collapsible block */}
          {hasTools && (
            <div className="mb-3">
              <button
                className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors mb-2"
                onClick={() => setThinkExpanded((v) => !v)}
              >
                {thinkExpanded ? (
                  <ChevronDown className="w-3.5 h-3.5" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5" />
                )}
                <span className="text-muted-foreground/70">
                  {message.isStreaming ? "Processing..." : `${message.toolCalls!.length} tool call${message.toolCalls!.length > 1 ? "s" : ""}`}
                </span>
              </button>

              {thinkExpanded && (
                <div className="pl-1">
                  {message.toolCalls!.map((tool) => (
                    <ToolCallCard
                      key={tool.tool_call_id}
                      tool={tool}
                      onToggle={onToggleToolCall}
                    />
                  ))}
                </div>
              )}

              {/* Always show running tool even when collapsed */}
              {!thinkExpanded && message.toolCalls!.some((t) => t.status === "running") && (
                <div className="pl-1">
                  {message.toolCalls!
                    .filter((t) => t.status === "running")
                    .map((tool) => (
                      <ToolCallCard
                        key={tool.tool_call_id}
                        tool={tool}
                        onToggle={onToggleToolCall}
                      />
                    ))}
                </div>
              )}
            </div>
          )}

          {/* Main answer content */}
          {hasContent && (
            <div
              className="prose-odi text-sm"
              dangerouslySetInnerHTML={{ __html: renderMarkdown(message.content) }}
            />
          )}

          {/* Streaming cursor */}
          {message.isStreaming && hasContent && (
        <span className="inline-block w-1.5 h-4 animate-pulse ml-0.5 rounded-sm" style={{ background: "var(--primary)" }} />
          )}
        </div>
      </div>

      {/* Copy button for assistant */}
      {!message.isStreaming && hasContent && (
        <div className="pl-10">
          <button
            onClick={handleCopy}
            className="w-7 h-7 flex items-center justify-center rounded text-muted-foreground/50 hover:text-muted-foreground hover:bg-muted/50 transition-colors"
            aria-label="Copy response"
          >
            {copied
              ? <Check className="w-3.5 h-3.5" style={{ color: "var(--check-color)" }} />
              : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      )}
    </div>
  )
}

export default function MessageBubble({
  message,
  onEditMessage,
  onToggleToolCall,
}: MessageBubbleProps) {
  if (message.role === "user") {
    return (
      <UserMessage
        message={message}
        onEdit={onEditMessage}
      />
    )
  }

  return (
    <AssistantMessage
      message={message}
      onToggleToolCall={(toolCallId) => onToggleToolCall(message.id, toolCallId)}
    />
  )
}
