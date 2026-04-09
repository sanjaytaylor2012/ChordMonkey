import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL!;
const API_KEY = process.env.BACKEND_API_KEY!;
const TIMEOUT_MS = 15_000; // 15s — lightweight, should be fast

export async function POST(req: NextRequest) {
  const body = await req.json();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const resp = await fetch(`${BACKEND_URL}/recommendations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": API_KEY,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!resp.ok) {
      return new NextResponse(await resp.text(), { status: resp.status });
    }

    return NextResponse.json(await resp.json());
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      return NextResponse.json({ error: "Request timed out fetching recommendations." }, { status: 504 });
    }
    return NextResponse.json({ error: "Failed to fetch recommendations." }, { status: 500 });
  } finally {
    clearTimeout(timer);
  }
}
