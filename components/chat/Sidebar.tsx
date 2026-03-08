"use client"

import { useEffect, useRef, useState } from "react"
import { MoreHorizontal, Trash2, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Session } from "@/lib/types"

interface SidebarProps {
  open: boolean
  sessions: Session[]
  activeSessionId: string | null
  onSelectSession: (id: string) => void
  onDeleteSession: (id: string) => void
}

function groupSessionsByTime(sessions: Session[]): {
  label: string
  items: Session[]
}[] {
  const now = Date.now()
  const oneDay = 86400000
  const sevenDays = 7 * oneDay
  const thirtyDays = 30 * oneDay

  const today: Session[] = []
  const last7: Session[] = []
  const last30: Session[] = []
  const older: Session[] = []

  for (const s of sessions) {
    // update_time may be in ms (large number) or seconds, or update_date may be ISO string
    let ts = s.update_time
    if (!ts && s.update_date) {
      ts = new Date(s.update_date).getTime()
    }
    // If value looks like seconds (< year 3000 in ms), convert
    if (ts && ts < 9999999999) ts = ts * 1000
    const diff = now - (ts || 0)
    if (diff < oneDay) today.push(s)
    else if (diff < sevenDays) last7.push(s)
    else if (diff < thirtyDays) last30.push(s)
    else older.push(s)
  }

  const groups = []
  if (today.length) groups.push({ label: "Today", items: today })
  if (last7.length) groups.push({ label: "Last 7 days", items: last7 })
  if (last30.length) groups.push({ label: "Last 30 days", items: last30 })
  if (older.length) groups.push({ label: "Older", items: older })
  return groups
}

function SessionItem({
  session,
  isActive,
  onSelect,
  onDelete,
}: {
  session: Session
  isActive: boolean
  onSelect: () => void
  onDelete: () => void | Promise<void>
}) {
  const [hovered, setHovered] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    if (menuOpen) document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [menuOpen])

  return (
    <div
      className={cn(
        "relative group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors text-sm",
        isActive
          ? "bg-white/[0.08] text-foreground"
          : "text-sidebar-foreground hover:bg-black/[0.06] dark:hover:bg-white/[0.08] hover:text-foreground"
      )}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); if (!menuOpen) setMenuOpen(false) }}
      onClick={onSelect}
    >
      <span className="flex-1 truncate">{session.name || "New Chat"}</span>

      {/* ... menu button or loading - show on hover or when deleting */}
      {(hovered || menuOpen || isDeleting) && (
        <div className="relative flex-shrink-0 w-6 h-6 flex items-center justify-center" ref={menuRef}>
          {isDeleting ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />
          ) : (
            <>
              <button
                className="w-6 h-6 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-white/[0.1] transition-colors"
                onClick={(e) => {
                  e.stopPropagation()
                  setMenuOpen(!menuOpen)
                }}
                aria-label="Session options"
              >
                <MoreHorizontal className="w-3.5 h-3.5" />
              </button>
              {menuOpen && (
                <div
                  className="absolute right-0 top-7 z-50 w-36 rounded-lg border border-border py-1 shadow-xl bg-popover"
                >
                  <button
                    className="flex w-full items-center gap-2 px-3 py-2 text-xs text-orange-500 hover:bg-orange-500/10 transition-colors"
                    onClick={async (e) => {
                      e.stopPropagation()
                      setMenuOpen(false)
                      setIsDeleting(true)
                      try {
                        await onDelete()
                      } finally {
                        setIsDeleting(false)
                      }
                    }}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}

export default function Sidebar({
  open,
  sessions,
  activeSessionId,
  onSelectSession,
  onDeleteSession,
}: SidebarProps) {
  const groups = groupSessionsByTime(sessions)

  return (
    <>
      {/* Overlay for mobile */}
      {open && (
        <div className="fixed inset-0 z-30 bg-black/50 md:hidden" />
      )}

      {/* Sidebar panel */}
      <aside
        className={cn(
          "fixed top-14 left-0 bottom-0 z-40 w-64 flex flex-col border-r border-border transition-transform duration-300 ease-in-out bg-sidebar",
        )}
        style={{
          transform: open ? "translateX(0)" : "translateX(-100%)",
        }}
      >
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {sessions.length === 0 ? (
            <div className="px-3 py-8 text-center">
              <p className="text-muted-foreground text-xs">No conversations yet</p>
            </div>
          ) : (
            groups.map((group) => (
              <div key={group.label} className="mb-2">
                <div className="px-3 py-1.5 text-xs font-medium text-muted-foreground/60 uppercase tracking-wider">
                  {group.label}
                </div>
                {group.items.map((session) => (
                  <SessionItem
                    key={session.id}
                    session={session}
                    isActive={activeSessionId === session.id}
                    onSelect={() => onSelectSession(session.id)}
                    onDelete={() => onDeleteSession(session.id)}
                  />
                ))}
              </div>
            ))
          )}

          {sessions.length > 0 && (
            <div className="px-3 py-4 text-center">
              <p className="text-muted-foreground/50 text-xs">
                You have reached the end of your chat history.
              </p>
            </div>
          )}
        </div>
      </aside>
    </>
  )
}
