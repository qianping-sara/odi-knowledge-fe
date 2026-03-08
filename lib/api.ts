import type { Session, SSEEvent } from "./types"

// All requests go to Next.js proxy routes — never directly to the external backend
const API = "/api"

// ── Sessions ──────────────────────────────────────────────────────────────────

export async function fetchSessions(): Promise<Session[]> {
  console.log("[v0] fetchSessions called, url:", `${API}/sessions`)
  const res = await fetch(
    `${API}/sessions?page=1&page_size=100&orderby=updated_at&desc=true`,
    { cache: "no-store" }
  )
  if (!res.ok) throw new Error(`fetchSessions failed: ${res.status}`)
  const json = await res.json()
  console.log("[v0] fetchSessions response:", JSON.stringify(json).slice(0, 200))
  const raw = json.data
  if (Array.isArray(raw)) return raw
  if (raw && Array.isArray(raw.records)) return raw.records
  return []
}

export async function createSession(name?: string): Promise<Session> {
  console.log("[v0] createSession called")
  const res = await fetch(`${API}/sessions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(name ? { name } : {}),
  })
  if (!res.ok) throw new Error(`createSession failed: ${res.status}`)
  const json = await res.json()
  console.log("[v0] createSession response:", JSON.stringify(json).slice(0, 200))
  // API returns { code: 0|200, data: Session }
  return json.data
}

export async function deleteSession(ids: string[]): Promise<void> {
  const res = await fetch(`${API}/sessions`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ids }),
  })
  if (!res.ok) throw new Error(`deleteSession failed: ${res.status}`)
}

export async function fetchSession(sessionId: string): Promise<Session> {
  const res = await fetch(`${API}/sessions/${sessionId}`, { cache: "no-store" })
  if (!res.ok) throw new Error(`fetchSession failed: ${res.status}`)
  const json = await res.json()
  return json.data
}

// ── Streaming completions ─────────────────────────────────────────────────────

export async function* sendMessageStream(
  sessionId: string,
  question: string
): AsyncGenerator<SSEEvent> {
  console.log("[v0] sendMessageStream called, session:", sessionId)
  const res = await fetch(`${API}/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ session_id: sessionId, question, stream: true }),
  })

  if (!res.ok) throw new Error(`sendMessageStream failed: ${res.status}`)
  if (!res.body) throw new Error("No response body from completions")

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ""

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split("\n")
    buffer = lines.pop() ?? ""

    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed || !trimmed.startsWith("data:")) continue

      const jsonStr = trimmed.slice(5).trim()
      if (!jsonStr || jsonStr === "[DONE]") continue

      try {
        const parsed = JSON.parse(jsonStr)
        // End signal: { code: 0, data: true }
        if (parsed?.data === true) return
        // Extract inner event from outer { code, data } wrapper
        const event = parsed?.data ?? parsed
        if (!event || typeof event !== "object") continue
        if (event.type) {
          yield event as SSEEvent
        }
      } catch {
        // ignore malformed chunks
      }
    }
  }
}

