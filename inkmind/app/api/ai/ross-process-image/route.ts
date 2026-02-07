import { generateObject } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { NextResponse } from "next/server";
import { z } from "zod";

const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const ROSS_VISION_SCHEMA = z.object({
  refinedPrompt: z.string().describe("The complete tattoo specification prompt for the image generator."),
  reasoning: z.string().describe("One sentence explaining the technical 'why' behind the changes (e.g. why negative space or needle choice)."),
  style: z.string().describe("Style label, e.g. Fine-Line Geometric, Bold Neo-traditional."),
  needle: z.string().describe("Needle spec, e.g. 3RL Precision, 7RL Bold."),
});

const ROSS_VISION_SYSTEM = `You are Ross, a Master Tattoo Artist. Your job is to analyze any image a client uploads and rewrite it as a 'Technical Tattoo Blueprint'.

ANALYSIS PROTOCOL:
1. SUBJECT: Identify if it's Geometric, Organic, Portrait, or Script.
2. CONTRAST: High-contrast is required for skin. Mandate 'saturated blacks' and 'clear highlights'.
3. LONGEVITY: If lines are too close, mandate 'increased negative space' (2mm minimum) to prevent ink migration.
4. ANATOMY: Suggest an 'anatomic flow' (e.g., 'tapered ends for limb placement').
5. NEEDLE: Specify '3RL' for fine detail or '7RL' for bold traditional.

Return refinedPrompt (the full spec for the image generator), reasoning (why you made these changes), style, and needle.`;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const imageUrl = typeof body?.imageUrl === "string" ? body.imageUrl.trim() : "";
    const userNote = typeof body?.userNote === "string" ? body.userNote.trim() : "";

    if (!imageUrl) {
      return NextResponse.json(
        { error: "Image URL is required." },
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

    const { object } = await generateObject({
      model: google("gemini-2.5-flash"),
      schema: ROSS_VISION_SCHEMA,
      system: ROSS_VISION_SYSTEM,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: userNote
                ? `Refine this image for a tattoo. User note: ${userNote}`
                : "Refine this image for a tattoo.",
            },
            imagePart,
          ],
        },
      ],
    });

    return NextResponse.json({
      refinedPrompt: object.refinedPrompt?.trim() ?? "",
      evaluation: {
        reasoning: object.reasoning ?? null,
        style: object.style ?? null,
        needle: object.needle ?? null,
      },
    });
  } catch (err) {
    console.error("[InkMind] /api/ai/ross-process-image error:", err);
    return NextResponse.json(
      { error: "Failed to process image. Please try again." },
      { status: 500 }
    );
  }
}
