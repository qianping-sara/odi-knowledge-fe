import { NextRequest, NextResponse } from "next/server"

const BACKEND = "https://odi-knowledge-backend.vercel.app"

export async function GET(req: NextRequest) {
  const search = req.nextUrl.searchParams.toString()
  const url = `${BACKEND}/api/v1/sessions${search ? `?${search}` : ""}`
  console.log("[v0] proxy GET sessions →", url)
  const res = await fetch(url, { cache: "no-store" })
  const json = await res.json()
  console.log("[v0] proxy GET sessions status:", res.status, "data length:", Array.isArray(json.data) ? json.data.length : typeof json.data)
  return NextResponse.json(json, { status: res.status })
}

export async function POST(req: NextRequest) {
  const body = await req.text()
  console.log("[v0] proxy POST sessions body:", body)
  const res = await fetch(`${BACKEND}/api/v1/sessions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  })
  const json = await res.json()
  console.log("[v0] proxy POST sessions status:", res.status, "response:", JSON.stringify(json).slice(0, 200))
  return NextResponse.json(json, { status: res.status })
}

export async function DELETE(req: NextRequest) {
  const body = await req.text()
  const res = await fetch(`${BACKEND}/api/v1/sessions`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body,
  })
  const json = await res.json().catch(() => ({}))
  return NextResponse.json(json, { status: res.status })
}
