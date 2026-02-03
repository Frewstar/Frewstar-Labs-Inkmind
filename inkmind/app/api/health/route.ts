import { NextResponse } from "next/server";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const MODEL_ID = "gemini-2.5-flash";

/** Health check: verify Gemini API connectivity without running image generation. */
export async function POST() {
  if (!GEMINI_API_KEY) {
    return NextResponse.json(
      { output: null, error: "GEMINI_API_KEY not configured" },
      { status: 500 }
    );
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_ID}:generateContent?key=${GEMINI_API_KEY}`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "x-goog-user-project": "inkmind-486221",
  };

  try {
    const res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: "Reply with exactly: Success" }] }],
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      const msg = data?.error?.message ?? `HTTP ${res.status}`;
      return NextResponse.json(
        { output: null, error: msg },
        { status: res.status >= 500 ? 500 : 400 }
      );
    }

    const text =
      data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? "";
    const output = text || "Success";

    return NextResponse.json({ output });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Connection failed";
    return NextResponse.json(
      { output: null, error: msg },
      { status: 500 }
    );
  }
}
