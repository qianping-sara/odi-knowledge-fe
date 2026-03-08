import { NextRequest } from "next/server"

const BACKEND = "https://odi-knowledge-backend.vercel.app"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const file = searchParams.get("file")
  if (!file) {
    return Response.json(
      { code: 400, message: "Missing required parameter: file" },
      { status: 400 }
    )
  }

  const res = await fetch(
    `${BACKEND}/api/v1/knowledge/source?file=${encodeURIComponent(file)}`,
    { cache: "no-store" }
  )
  const data = await res.json()

  if (!res.ok) {
    return Response.json(data, { status: res.status })
  }
  return Response.json(data)
}
