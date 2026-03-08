import { NextRequest, NextResponse } from "next/server"

const BACKEND = "https://odi-knowledge-backend.vercel.app"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const res = await fetch(`${BACKEND}/api/v1/sessions/${id}`, { cache: "no-store" })
  const json = await res.json()
  return NextResponse.json(json, { status: res.status })
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await req.text()
  const res = await fetch(`${BACKEND}/api/v1/sessions/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body,
  })
  const json = await res.json().catch(() => ({}))
  return NextResponse.json(json, { status: res.status })
}
