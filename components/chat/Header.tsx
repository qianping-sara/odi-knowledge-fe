"use client"

import { PanelLeftOpen, PanelLeftClose, Plus, Trash2, Sun, Moon, ChevronDown } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { useTheme } from "@/lib/theme-context"

interface HeaderProps {
  sidebarOpen: boolean
  onToggleSidebar: () => void
  onNewSession: () => void
  onDeleteAllSessions: () => void
}

export default function Header({
  sidebarOpen,
  onToggleSidebar,
  onNewSession,
  onDeleteAllSessions,
}: HeaderProps) {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === "dark"

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 flex items-center h-14 px-4 border-b border-border"
      style={{
        background: "var(--header-bg)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
      }}
    >
      {/* Logo + Brand */}
      <div className="flex items-center gap-3 flex-1">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold flex-shrink-0 shadow-sm"
          style={{ background: "linear-gradient(135deg, #f97316 55%, #fb923c 100%)" }}
        >
          <span className="text-[11px] font-black tracking-tight leading-none">ODI</span>
        </div>
        <div className="leading-tight">
          <div
            className="text-[9px] tracking-[0.22em] uppercase font-bold text-primary dark:text-orange-500"
            style={!isDark ? { color: "var(--primary)" } : undefined}
          >
            Ascentium
          </div>
          <div className="text-sm font-semibold text-foreground leading-none">
            ODI China Knowledge AI
          </div>
        </div>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-0.5">
        {/* Toggle sidebar */}
        <button
          onClick={onToggleSidebar}
          className="w-9 h-9 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-black/[0.06] dark:hover:bg-white/[0.06] transition-colors"
          aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
        >
          {sidebarOpen ? (
            <PanelLeftClose className="w-[18px] h-[18px]" />
          ) : (
            <PanelLeftOpen className="w-[18px] h-[18px]" />
          )}
        </button>

        {/* New session — + icon */}
        <button
          onClick={onNewSession}
          className="w-9 h-9 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-black/[0.06] dark:hover:bg-white/[0.06] transition-colors"
          aria-label="New conversation"
        >
          <Plus className="w-[18px] h-[18px]" />
        </button>

        {/* User avatar + dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold border transition-colors ml-1"
              style={{
                background: isDark ? "rgba(249,115,22,0.15)" : "rgba(var(--primary-rgb, 249 115 22) / 0.1)",
                borderColor: isDark ? "rgba(249,115,22,0.4)" : "color-mix(in srgb, var(--primary) 30%, transparent)",
                color: isDark ? "#f97316" : "var(--primary)",
              }}
              aria-label="User menu"
            >
              <span className="text-[11px] font-bold">U</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-52"
          >
            <DropdownMenuItem
              onClick={toggleTheme}
              className="cursor-pointer dark:focus:bg-orange-500/15 dark:focus:text-foreground"
            >
              {isDark ? (
                <><Sun className="w-4 h-4 mr-2" />Light Mode</>
              ) : (
                <><Moon className="w-4 h-4 mr-2" />Dark Mode</>
              )}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={onDeleteAllSessions}
              className="text-orange-500 focus:text-orange-500 focus:bg-orange-500/10 cursor-pointer"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete all sessions
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
