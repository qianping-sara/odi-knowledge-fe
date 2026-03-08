import { NextRequest } from "next/server"

const BACKEND = "https://odi-knowledge-backend.vercel.app"

export async function POST(req: NextRequest) {
  const body = await req.text()

  const res = await fetch(`${BACKEND}/api/v1/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    cache: "no-store",
  })

  if (!res.ok || !res.body) {
    return new Response(JSON.stringify({ error: "Backend error" }), {
      status: res.status,
      headers: { "Content-Type": "application/json" },
    })
  }

  // Stream the SSE response directly back to the client
  return new Response(res.body, {
    status: 200,
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "X-Accel-Buffering": "no",
    },
  })
}
