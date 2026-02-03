import { NextRequest, NextResponse } from "next/server";

const XAI_API_URL = "https://api.x.ai/v1/chat/completions";
const DEFAULT_MODEL = "grok-4-latest";

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface ChatRequest {
  messages: ChatMessage[];
  model?: string;
  stream?: boolean;
  temperature?: number;
}

export async function POST(req: NextRequest) {
  const key = process.env.XAI_API_KEY?.trim();
  if (!key) {
    return NextResponse.json(
      {
        error: "Grok is not configured",
        details: "Add XAI_API_KEY to .env.local (in the inkmind folder), then restart the dev server (stop and run npm run dev again). Or use Gemini for image generation.",
      },
      { status: 500 }
    );
  }

  try {
    const body: ChatRequest = await req.json();
    const { messages, model = DEFAULT_MODEL, stream = false, temperature = 0 } = body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "messages must be a non-empty array" },
        { status: 400 }
      );
    }

    const response = await fetch(XAI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model,
        messages,
        stream,
        temperature,
      }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const msg = (data as { error?: { message?: string } })?.error?.message ?? `HTTP ${response.status}`;
      return NextResponse.json(
        { error: msg },
        { status: response.status >= 500 ? 500 : response.status }
      );
    }

    const content = (data as { choices?: Array<{ message?: { content?: string } }> })?.choices?.[0]?.message?.content ?? "";
    return NextResponse.json({ content, model });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Chat request failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
