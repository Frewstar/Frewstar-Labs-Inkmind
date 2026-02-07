import { generateText } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { NextResponse } from "next/server";

const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const ROSS_SYSTEM = `You are Ross, a Master Tattoo Artist specializing in Fine-Line and Traditional styles.
Your mission is to take a raw user idea and transform it into a "Technical Tattoo Specification" for an image generator.

CRITICAL RULES:
- Never include conversational filler. Output ONLY the refined prompt.
- Longevity: If an idea is too detailed, add "simplified for skin longevity" or "increased negative space".
- Style: Default to "Fine-line geometric" or "Bold Neo-traditional" unless specified.
- Technicals: Always include terms like '3RL needle precision', 'whip-shading', and 'anatomic flow'.`;

const ROSS_ANY_IMAGE_SYSTEM = `Role: Ross, Technical Tattoo Architect.
Mission: Convert ANY user image into a skin-safe tattoo blueprint.

Protocol for Image Analysis:
1. Identify the Subject: (e.g., Portrait, Animal, Geometry, Botanical).
2. Apply Style Guardrails:
   - If GEOMETRIC: Mandate "Mathematical Symmetry" and "Parallel Gaps."
   - If ORGANIC (Animals/Flowers): Mandate "Anatomic Flow" and "Whip-shading."
   - If TEXT/SCRIPT: Mandate "Kerning for Ink Spread" (extra space between letters).
3. The "Ink Physics" Rule: Always add "increased negative space" and "defined borders" to ensure the design doesn't blur into a dark spot over 10 years.
4. Needle Spec: Default to "3RL fine-line" for luxury aesthetics unless the user asks for "Traditional Bold."

Output: Provide ONLY the refined prompt. No conversation.`;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const prompt = typeof body?.prompt === "string" ? body.prompt.trim() : "";
    const imageUrl = typeof body?.imageUrl === "string" ? body.imageUrl.trim() : undefined;

    const hasImage = !!imageUrl;
    const hasPrompt = !!prompt;

    if (!hasPrompt && !hasImage) {
      return NextResponse.json(
        { error: "Please provide a tattoo idea, description, or image." },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (!apiKey) {
      return NextResponse.json(
        { error: "Ross is not configured. Add GEMINI_API_KEY to .env.local." },
        { status: 500 }
      );
    }

    if (hasImage) {
      let imagePart: { type: "image"; image: URL | string; mediaType?: string };
      if (imageUrl.startsWith("data:")) {
        const base64Match = /^data:([^;]+);base64,(.+)$/.exec(imageUrl);
        const base64 = base64Match ? base64Match[2] : imageUrl;
        const mime = base64Match?.[1] ?? "image/png";
        imagePart = { type: "image", image: base64, mediaType: mime };
      } else if (imageUrl.startsWith("http")) {
        imagePart = { type: "image", image: new URL(imageUrl) };
      } else {
        return NextResponse.json({ error: "Invalid image URL format." }, { status: 400 });
      }

      const { text } = await generateText({
        model: google("gemini-2.5-flash"),
        system: ROSS_ANY_IMAGE_SYSTEM,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: hasPrompt
                  ? `Convert this image into a skin-safe tattoo specification. User notes: "${prompt}"`
                  : "Convert this image into a skin-safe tattoo blueprint.",
              },
              imagePart,
            ],
          },
        ],
      });

      return NextResponse.json({ refinedPrompt: text?.trim() ?? prompt || "Tattoo specification" });
    }

    const { text } = await generateText({
      model: google("gemini-2.5-flash"),
      system: ROSS_SYSTEM,
      prompt: `Refine this tattoo idea into a professional specification: "${prompt}"`,
    });

    return NextResponse.json({ refinedPrompt: text?.trim() ?? prompt });
  } catch (err) {
    console.error("[InkMind] /api/ai/ross-refine error:", err);
    return NextResponse.json(
      { error: "Failed to refine prompt. Please try again." },
      { status: 500 }
    );
  }
}
