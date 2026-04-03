import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL!;
const API_KEY = process.env.BACKEND_API_KEY!;

export async function POST(req: NextRequest) {
  const formData = await req.formData();

  const resp = await fetch(`${BACKEND_URL}/analyze-midi`, {
    method: "POST",
    headers: { "X-API-Key": API_KEY },
    body: formData,
  });

  if (!resp.ok) {
    return new NextResponse(await resp.text(), { status: resp.status });
  }

  return NextResponse.json(await resp.json());
}
