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
  onOpenSource?: (filename: string) => void
}

function escapeAttr(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/"/g, "&quot;")
}

function parseTableBlock(match: string): string {
  const rows = match
    .trim()
    .split("\n")
    .map((line) =>
      line
        .split("|")
        .slice(1, -1)
        .map((c) => c.trim())
    )
  if (rows.length < 1) return match
  const first = rows[0]
  const isSep = (arr: string[]) => arr.every((c) => /^:?-+:?$/.test(c) || /^-+$/.test(c))
  const hasSeparator = rows.length >= 2 && isSep(rows[1])
  const headerRow = hasSeparator ? rows[0] : null
  const bodyRows = hasSeparator ? rows.slice(2) : rows
  const toCell = (c: string, th: boolean) =>
    th ? `<th>${c}</th>` : `<td>${c}</td>`
  let html = "<table class=\"prose-odi-table\"><tbody>"
  if (headerRow && headerRow.some(Boolean)) {
    html = "<table class=\"prose-odi-table\"><thead><tr>"
    html += headerRow.map((c) => toCell(c, true)).join("") + "</tr></thead><tbody>"
  }
  for (const row of bodyRows) {
    if (row.some(Boolean)) html += "<tr>" + row.map((c) => toCell(c, false)).join("") + "</tr>"
  }
  return html + "</tbody></table>"
}

function renderMarkdown(text: string): string {
  return text
    // Tables (must run before \n -> <br />)
    .replace(/(?:^\|.+\|\s*\n)+/gm, parseTableBlock)
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
    // Source tag: [Source: 《filename》，第X页] -> bagel-style tag (whole block first)
    .replace(/\[Source:\s*《([^》]+)》(?:[，,]\s*([^\]]*))?\]/g, (_, f, pages) => {
      const fn = f.trim()
      const pagesStr = pages ? pages.trim() : ""
      const suffix = pagesStr ? `，${pagesStr}` : ""
      return `<span class="source-tag"><em><a href="#" class="source-link" data-filename="${escapeAttr(fn)}">《${fn}》</a>${suffix}</em></span>`
    })
    // Fallback: standalone 《filename》 -> clickable
    .replace(/《([^》]+)》/g, (_, f) =>
      `<a href="#" class="source-link" data-filename="${escapeAttr(f.trim())}">《${f}》</a>`
    )
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
  onOpenSource,
}: {
  message: UIMessage
  onToggleToolCall: (toolCallId: string) => void
  onOpenSource?: (filename: string) => void
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

          {/* Main answer content — subtle card for future like/dislike footer */}
          {hasContent && (
            <div
              className="response-card rounded-lg overflow-hidden"
              style={{
                background: "var(--response-card-bg)",
                border: "1px solid var(--response-card-border)",
              }}
            >
              <div className="flex flex-wrap items-baseline gap-x-1">
                <div
                  className="prose-odi text-sm px-3.5 py-2.5 flex-1 min-w-0"
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(message.content) }}
                  onClick={(e) => {
                    const target = (e.target as HTMLElement).closest(".source-link")
                    if (target && onOpenSource) {
                      e.preventDefault()
                      const fn = (target as HTMLAnchorElement).dataset.filename
                      if (fn) onOpenSource(fn)
                    }
                  }}
                />
                {message.isStreaming && (
                  <span
                    className="inline-block w-1.5 h-4 animate-pulse rounded-sm shrink-0"
                    style={{ background: "var(--primary)" }}
                  />
                )}
              </div>
              {!message.isStreaming && (
                <div
                  className="response-card-footer flex items-center gap-1 px-3.5 py-2 border-t"
                  style={{ borderColor: "var(--response-card-border)" }}
                >
                  {/* 预留：点赞、点踩等小按钮 */}
                </div>
              )}
            </div>
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
  onOpenSource,
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
      onOpenSource={onOpenSource}
    />
  )
}
