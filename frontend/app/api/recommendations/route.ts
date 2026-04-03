import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL!;
const API_KEY = process.env.BACKEND_API_KEY!;

export async function POST(req: NextRequest) {
  const body = await req.json();

  const resp = await fetch(`${BACKEND_URL}/recommendations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": API_KEY,
    },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    return new NextResponse(await resp.text(), { status: resp.status });
  }

  return NextResponse.json(await resp.json());
}
