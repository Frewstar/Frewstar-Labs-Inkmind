"use server";

import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText } from "ai";
import { createClient } from "@/utils/supabase/server";

const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const EXTRACTION_PROMPT = `<instruction>
Analyze the provided portfolio images from this tattoo studio.
Extract the 'Visual DNA' by identifying:
1. Shading technique (e.g., stippling, smooth grey-wash, solid blackwork).
2. Line style (e.g., bold traditional, fine-line, varying taper).
3. Composition habits (e.g., high-contrast, minimalist, crowded ornamental).
Output a high-density 'Style Guide' paragraph that can be used to instruct a generative AI model.
</instruction>`;

/**
 * Fetches the studio's latest portfolio images, sends them to Gemini vision,
 * and returns a high-density Style Guide paragraph (Visual DNA) for Ross.
 */
export async function extractStudioDNA(
  studioId: string
): Promise<{ dna?: string; error?: string }> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    return { error: "GEMINI_API_KEY is not configured." };
  }

  const supabase = await createClient();
  const { data: portfolio } = await supabase
    .from("studio_portfolio")
    .select("image_url")
    .eq("studio_id", studioId)
    .order("created_at", { ascending: false })
    .limit(3);

  if (!portfolio?.length) {
    return { error: "Upload some work first!" };
  }

  try {
    const imageParts: { type: "image"; image: string; mediaType: string }[] = [];

    for (const item of portfolio as { image_url: string }[]) {
      const resp = await fetch(item.image_url);
      if (!resp.ok) continue;
      const buffer = await resp.arrayBuffer();
      const base64 = Buffer.from(buffer).toString("base64");
      const contentType = resp.headers.get("content-type")?.split(";")[0]?.trim() || "image/webp";
      const mediaType = contentType === "image/jpeg" ? "image/jpeg" : contentType === "image/png" ? "image/png" : "image/webp";
      imageParts.push({
        type: "image",
        image: base64,
        mediaType,
      });
    }

    if (imageParts.length === 0) {
      return { error: "Could not load portfolio images." };
    }

    const { text } = await generateText({
      model: google("gemini-2.5-flash"),
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: "Act as a master tattoo critic. Extract the technical DNA of this artist's style.\n\n" + EXTRACTION_PROMPT },
            ...imageParts,
          ],
        },
      ],
    });

    return { dna: text?.trim() ?? "" };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Style DNA extraction failed.";
    console.error("[extractStudioDNA] error:", err);
    return { error: message };
  }
}
