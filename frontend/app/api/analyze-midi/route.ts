import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL!;
const API_KEY = process.env.BACKEND_API_KEY!;
const TIMEOUT_MS = 30_000; // 30s

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const resp = await fetch(`${BACKEND_URL}/analyze-midi`, {
      method: "POST",
      headers: { "X-API-Key": API_KEY },
      body: formData,
      signal: controller.signal,
    });

    if (!resp.ok) {
      return new NextResponse(await resp.text(), { status: resp.status });
    }

    return NextResponse.json(await resp.json());
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      return NextResponse.json({ error: "Request timed out analyzing MIDI." }, { status: 504 });
    }
    return NextResponse.json({ error: "Failed to analyze MIDI." }, { status: 500 });
  } finally {
    clearTimeout(timer);
  }
}
