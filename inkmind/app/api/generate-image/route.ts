import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? "");

/** Use 'gemini-2.5-flash-image' for speed or 'gemini-3-pro-image-preview' for studio quality */
const IMAGE_MODEL = "gemini-2.5-flash-image";

function toBase64(data: Uint8Array | string): string {
  if (typeof data === "string") return data;
  return Buffer.from(data).toString("base64");
}

export async function POST(req: Request) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY is not set in your environment." },
        { status: 500 }
      );
    }

    const { prompt } = await req.json();

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid prompt" },
        { status: 400 }
      );
    }

    const model = genAI.getGenerativeModel({ model: IMAGE_MODEL });
    const result = await model.generateContent(prompt);
    const response = result.response;

    const imagePart = response.candidates?.[0]?.content?.parts?.find(
      (part: { inlineData?: { data: Uint8Array | string; mimeType?: string } }) =>
        part.inlineData != null
    );

    if (!imagePart?.inlineData?.data) {
      return NextResponse.json(
        { error: "No image in model response" },
        { status: 500 }
      );
    }

    const raw = imagePart.inlineData.data;
    const mimeType = imagePart.inlineData.mimeType ?? "image/png";
    const base64 = toBase64(raw);
    const imageUrl = `data:${mimeType};base64,${base64}`;

    return NextResponse.json({ imageUrl });
  } catch (error) {
    console.error("Gemini image generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate image" },
      { status: 500 }
    );
  }
}
