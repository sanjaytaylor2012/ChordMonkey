import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL!;
const API_KEY = process.env.BACKEND_API_KEY!;
const TIMEOUT_MS = 60_000; // 60s — transcription runs an ML model

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const resp = await fetch(`${BACKEND_URL}/transcribe-to-midi`, {
      method: "POST",
      headers: { "X-API-Key": API_KEY },
      body: formData,
      signal: controller.signal,
    });

    if (!resp.ok) {
      return new NextResponse(await resp.text(), { status: resp.status });
    }

    const blob = await resp.blob();
    return new NextResponse(blob, {
      headers: {
        "Content-Type": "audio/midi",
        "Content-Disposition": 'attachment; filename="output.mid"',
      },
    });
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      return NextResponse.json({ error: "Request timed out. Please try a shorter recording." }, { status: 504 });
    }
    return NextResponse.json({ error: "Failed to transcribe audio." }, { status: 500 });
  } finally {
    clearTimeout(timer);
  }
}
