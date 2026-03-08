"use client"

import { useState } from "react"
import { ChevronDown, ChevronRight, Wrench, CheckCircle2, AlertCircle, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import type { ToolCall } from "@/lib/types"

interface ToolCallCardProps {
  tool: ToolCall
  onToggle: (id: string) => void
}

function getToolDisplayName(name: string): string {
  const map: Record<string, string> = {
    list_pageindex_documents: "List knowledge documents",
    query_pageindex: "Search knowledge base",
    think_tool: "Analyze information",
    get_document_structure: "Get document structure",
    get_page_content: "Get page content",
    find_relevant_documents: "Find relevant documents",
  }
  return map[name] ?? name.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
}

export default function ToolCallCard({ tool, onToggle }: ToolCallCardProps) {
  const [resultExpanded, setResultExpanded] = useState(false)
  const isComplete = tool.status === "completed"
  const isError = tool.status === "error"
  const isRunning = tool.status === "running"

  return (
    <div
      className="rounded-xl border my-1.5 overflow-hidden"
      style={{ borderColor: "var(--tool-border)", background: "var(--tool-bg)" }}
    >
      {/* Header row */}
      <button
        className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm hover:bg-black/[0.03] dark:hover:bg-white/[0.03] transition-colors"
        onClick={() => onToggle(tool.tool_call_id)}
      >
        {/* Status icon */}
        <span className="flex-shrink-0">
          {isRunning && (
            <Loader2 className="w-3.5 h-3.5 animate-spin" style={{ color: "var(--primary)" }} />
          )}
          {isComplete && (
            <CheckCircle2 className="w-3.5 h-3.5 text-orange-400" />
          )}
          {isError && (
            <AlertCircle className="w-3.5 h-3.5 text-destructive" />
          )}
        </span>

        <Wrench className="w-3 h-3 text-muted-foreground flex-shrink-0" />

        <span className="flex-1 text-left text-xs text-sidebar-foreground">
          <span className="text-muted-foreground">Tools: </span>
          <span>{getToolDisplayName(tool.tool_name)}</span>
          {isComplete && (
            <span className="ml-2 text-orange-400/80">Completed</span>
          )}
          {isError && (
            <span className="ml-2 text-destructive/80">Error</span>
          )}
          {isRunning && (
            <span className="ml-2 text-muted-foreground/60">Running...</span>
          )}
        </span>

        {/* Expand/collapse indicator */}
        <span className="flex-shrink-0 text-muted-foreground/50">
          {tool.expanded ? (
            <ChevronDown className="w-3.5 h-3.5" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5" />
          )}
        </span>
      </button>

      {/* Expanded content */}
      {tool.expanded && (
        <div className="border-t border-border px-3 py-3 space-y-3">
          {/* Input params if any */}
          {tool.input && Object.keys(tool.input).length > 0 && (
            <div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground/50 mb-1.5">
                Input
              </div>
              <pre className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap break-words font-mono">
                {JSON.stringify(tool.input, null, 2)}
              </pre>
            </div>
          )}

          {/* Output */}
          {(tool.output_raw || tool.error) && (
            <div>
              <button
                className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground/50 mb-1.5 hover:text-muted-foreground transition-colors"
                onClick={() => setResultExpanded((v) => !v)}
              >
                {resultExpanded ? (
                  <ChevronDown className="w-3 h-3" />
                ) : (
                  <ChevronRight className="w-3 h-3" />
                )}
                Result
              </button>

              {resultExpanded && (
                <div
                  className="rounded-lg border border-border p-3 overflow-auto max-h-64 bg-card"
                >
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground/40 mb-2">
                    {isError ? "ERROR" : "RESULT"}
                  </div>
                  <pre className={cn(
                    "text-xs leading-relaxed whitespace-pre-wrap break-words font-mono",
                    isError ? "text-destructive/80" : "text-muted-foreground"
                  )}>
                    {tool.error ?? tool.output_raw}
                  </pre>
                </div>
              )}

              {!resultExpanded && (tool.output_preview ?? tool.error) && (
                <p className="text-xs text-muted-foreground/60 truncate">
                  {tool.output_preview ?? tool.error}
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
