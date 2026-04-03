import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL!;
const API_KEY = process.env.BACKEND_API_KEY!;

export async function POST(req: NextRequest) {
  const formData = await req.formData();

  const resp = await fetch(`${BACKEND_URL}/transcribe-to-midi`, {
    method: "POST",
    headers: { "X-API-Key": API_KEY },
    body: formData,
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
}
