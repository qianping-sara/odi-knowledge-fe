"use client"

import { useEffect, useState } from "react"
import { X, Loader2 } from "lucide-react"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerClose } from "@/components/ui/drawer"
import { fetchKnowledgeSource, type KnowledgeSourceData } from "@/lib/api"

interface SourceDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  filename: string | null
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

function renderMarkdownForSource(text: string): string {
  return text
    .replace(/(?:^\|.+\|\s*\n)+/gm, parseTableBlock)
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/^### (.*)/gm, "<h3>$1</h3>")
    .replace(/^## (.*)/gm, "<h2>$1</h2>")
    .replace(/^# (.*)/gm, "<h1>$1</h1>")
    .replace(/^[-*•] (.*)/gm, "<li>$1</li>")
    .replace(/^\d+\. (.*)/gm, "<li>$1</li>")
    .replace(/\n\n/g, "<span class='prose-gap' aria-hidden='true'></span>")
    .replace(/\n/g, "<br />")
    .replace(/((?:<li>.*?<\/li>(?:<br \/>)?)+)/g, (m) => "<ul>" + m.replace(/<br \/>/g, "") + "</ul>")
}

export default function SourceDrawer({ open, onOpenChange, filename }: SourceDrawerProps) {
  const [data, setData] = useState<KnowledgeSourceData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [direction, setDirection] = useState<"right" | "bottom">("right")

  useEffect(() => {
    function check() {
      const isLandscape = window.innerWidth >= 768 && window.innerWidth > window.innerHeight
      setDirection(isLandscape ? "right" : "bottom")
    }
    check()
    window.addEventListener("resize", check)
    return () => window.removeEventListener("resize", check)
  }, [])

  useEffect(() => {
    if (!open || !filename) {
      setData(null)
      setError(null)
      return
    }
    setLoading(true)
    setError(null)
    fetchKnowledgeSource(filename)
      .then((res) => {
        if (res.code === 200 && res.data) {
          setData(res.data)
        } else {
          setError(res.message || "Failed to load document")
        }
      })
      .catch(() => setError("Failed to load document"))
      .finally(() => setLoading(false))
  }, [open, filename])

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction={direction}>
      <DrawerContent
        className={
          direction === "right"
            ? "!w-[50vw] !max-w-[50vw] max-md:!w-full max-md:!max-w-full h-full rounded-none border-l [&>div:first-child]:hidden"
            : "!w-full !max-w-full max-h-[100dvh] rounded-t-2xl border-t [&>div:first-child]:block"
        }
      >
        <DrawerHeader className="flex flex-row items-center justify-between gap-2 border-b px-4 py-3 shrink-0">
          <DrawerTitle className="text-sm font-semibold truncate pr-8">
            {filename || "Document"}
          </DrawerTitle>
          <DrawerClose className="absolute right-4 top-4 p-1 rounded-md hover:bg-muted transition-colors">
            <X className="w-5 h-5" />
          </DrawerClose>
        </DrawerHeader>
        <div className="flex-1 overflow-y-auto min-h-0">
          {loading && (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          )}
          {error && (
            <div className="px-4 py-8 text-center text-muted-foreground text-sm">{error}</div>
          )}
          {data && !loading && (
            <div className="px-4 py-4 w-full max-w-full overflow-x-hidden">
              <div
                className="prose-odi text-sm max-w-none w-full break-words"
                dangerouslySetInnerHTML={{
                  __html: data.pages
                    .sort((a, b) => a.page_index - b.page_index)
                    .map(
                      (p) =>
                        `<div class="mb-6"><div class="text-xs text-muted-foreground mb-2">第${p.page_index}页</div>${renderMarkdownForSource(p.markdown || "")}</div>`
                    )
                    .join(""),
                }}
              />
            </div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  )
}
