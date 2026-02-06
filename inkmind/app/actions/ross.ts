"use server";

import { randomUUID } from "crypto";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateObject } from "ai";
import { z } from "zod";
import { createClient } from "@/utils/supabase/server";

const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const ROSS_OUTPUT_SCHEMA = z.object({
  improvedPrompt: z
    .string()
    .describe(
      "A technically superior version of the user's tattoo idea, optimized for Imagen 3: clear subject, style, composition, and detail level."
    ),
  suggestions: z
    .array(z.string())
    .length(3)
    .describe(
      "Exactly 3 short style enhancers (e.g. 'Add whip shading', 'Use bold outlines', 'Consider negative space'). Each one sentence or phrase."
    ),
  longevityAlert: z
    .string()
    .nullable()
    .describe(
      "If the placement or detail level will blur or age poorly over time, one concise warning sentence. Otherwise null."
    ),
});

export type RossResponse = z.infer<typeof ROSS_OUTPUT_SCHEMA>;

/** Fixed instructions so the model returns the expected structured JSON (improvedPrompt, suggestions, longevityAlert). */
const ROSS_OUTPUT_INSTRUCTIONS = `
<response_format>
Respond only with the structured fields:
- improvedPrompt: Rewrite the client's idea into a prompt optimized for Imagen 3 (clear subject, style, composition, detail level).
- suggestions: Exactly 3 short style enhancers (e.g. whip shading, bold outlines, negative space).
- longevityAlert: If the tattoo placement or detail level will blur or age poorly over time, explicitly mention anatomical risks based on our studio's specialties (e.g., "Finger tattoos blur quickly due to high movement and rapid cell turnover. Consider a simplified design or alternative placement."); otherwise null.

Be concise and professional. Output only the structured fields.
</response_format>`;

const ROSS_DEFAULT_SYSTEM = `<ai_persona>
You are Ross, an elite professional tattoo consultant with years of experience. You focus on technical feasibility, aesthetic flow, and how designs age on skin.
</ai_persona>
${ROSS_OUTPUT_INSTRUCTIONS}`;

/**
 * Build the dynamic system prompt from studio-specific values (template literal with XML tags).
 * When studio is null, returns the default Ross persona.
 */
function buildDynamicSystemPrompt(studio: {
  name: string;
  ai_name: string | null;
  artist_voice_tone: string | null;
  ai_personality_prompt: string | null;
  studio_specialties: string[];
} | null): string {
  if (!studio) return ROSS_DEFAULT_SYSTEM;

  const studioName = studio.name?.trim() || "this studio";
  const aiName = studio.ai_name?.trim() || "Ross";
  const voiceTone = studio.artist_voice_tone?.trim() || "Professional";
  const personality = studio.ai_personality_prompt?.trim() || "You focus on technical tattoo longevity and aesthetic flow.";
  const specialties =
    Array.isArray(studio.studio_specialties) && studio.studio_specialties.length > 0
      ? studio.studio_specialties.filter((s): s is string => typeof s === "string").join(", ")
      : "General Tattooing";

  return `<studio_context>
  You are the Lead Design Consultant for ${studioName}.
  Your name is ${aiName}.
  Voice Tone: ${voiceTone}.
  Personality: ${personality}
  Studio Specialties: ${specialties}.
</studio_context>

<artist_rules>
  - Speak as an expert artist from this specific studio.
  - When advising the client, ensure your suggestions align with our technical standards and aesthetic choices.
  - If the user's idea contradicts our specialties, gently steer them back (e.g., "While we specialize in ${specialties}, we can adapt this idea to fit our signature look.").
  - Ensure all advice is technically sound for a real tattoo, including explicit mentions of anatomical placement risks for longevityAlert based on our specialties.
</artist_rules>
${ROSS_OUTPUT_INSTRUCTIONS}`;
}

/** Optional overrides for Ross prompt (e.g. preview in StyleSettings without saving). */
export type RossStudioOverrides = {
  name: string;
  ai_name?: string | null;
  artist_voice_tone?: string | null;
  ai_personality_prompt?: string | null;
  studio_specialties?: string[];
};

/**
 * Ross (Artist Twin): professional tattoo consultant. Uses a dynamic system prompt:
 * accepts studioId, fetches ai_name, ai_personality_prompt, and studio_specialties from the studios table via Supabase,
 * or uses overrideStudio when provided (for real-time preview with unsaved form values).
 */
export async function getRossAdvice(
  userInput: string,
  studioId?: string | null,
  overrideStudio?: RossStudioOverrides | null
): Promise<{ data?: RossResponse; error?: string }> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    return {
      error:
        "Ross is not configured. Add GEMINI_API_KEY to .env.local (in the inkmind folder), then restart the dev server.",
    };
  }

  if (!userInput || typeof userInput !== "string") {
    return { error: "Please provide a tattoo idea or description." };
  }

  try {
    let studio: Parameters<typeof buildDynamicSystemPrompt>[0] = null;
    if (overrideStudio) {
      studio = {
        name: overrideStudio.name,
        ai_name: overrideStudio.ai_name ?? null,
        artist_voice_tone: overrideStudio.artist_voice_tone ?? null,
        ai_personality_prompt: overrideStudio.ai_personality_prompt ?? null,
        studio_specialties: Array.isArray(overrideStudio.studio_specialties)
          ? overrideStudio.studio_specialties
          : [],
      };
    } else if (studioId) {
      const supabase = await createClient();
      const { data: row } = await supabase
        .from("studios")
        .select("name, ai_name, ai_personality_prompt, artist_voice_tone, studio_specialties")
        .eq("id", studioId)
        .single();
      studio = row ?? null;
    }

    const system = buildDynamicSystemPrompt(studio);

    const { object } = await generateObject({
      model: google("gemini-2.5-flash"),
      schema: ROSS_OUTPUT_SCHEMA,
      system,
      prompt: `Client's tattoo idea or description:\n\n${userInput.trim()}`,
    });

    return { data: object };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Ross advice request failed";
    console.error("Ross (getRossAdvice) error:", err);
    return { error: message };
  }
}

// ─── Ross Image Review (visual reasoning) ─────────────────────────────────────

const ROSS_IMAGE_REVIEW_SCHEMA = z.object({
  shadingFix: z
    .string()
    .describe("One concise suggestion to improve shading (e.g. add whip shading, soften gradients)."),
  lineFix: z
    .string()
    .describe("One concise suggestion to improve linework (e.g. bolder outlines, cleaner curves)."),
  colorFix: z
    .string()
    .describe("One concise suggestion to improve color or contrast (or 'Keep as is' for black-and-gray)."),
});

export type RossImageReviewResponse = z.infer<typeof ROSS_IMAGE_REVIEW_SCHEMA>;

const ROSS_IMAGE_REVIEW_SYSTEM = `You are Ross, an elite professional tattoo consultant. You are looking at a generated tattoo design image.

Analyze the image and the prompt that was used. Return exactly three short, actionable corrections:
- shadingFix: how to improve shading (whip shading, gradient, contrast, etc.)
- lineFix: how to improve linework (weight, consistency, clarity)
- colorFix: how to improve color/contrast, or "Keep as is" if it's black-and-gray and fine.

Be specific and brief. Each field should be one sentence the artist can use to refine the design.`;

/**
 * Ross image review: analyze a generated tattoo image and return shading/line/color fix suggestions.
 * Uses Gemini 2.5 Flash with vision.
 */
export async function getRossImageReview(
  imageUrl: string,
  prompt: string
): Promise<{ data?: RossImageReviewResponse; error?: string }> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    return {
      error:
        "Ross is not configured. Add GEMINI_API_KEY to .env.local (in the inkmind folder), then restart the dev server.",
    };
  }

  if (!imageUrl || typeof imageUrl !== "string") {
    return { error: "Image URL is required." };
  }

  try {
    // Support data URLs (base64) or http(s) URLs. SDK accepts URL or base64 string.
    let imagePart: { type: "image"; image: URL | string; mediaType?: string };
    if (imageUrl.startsWith("data:")) {
      const base64Match = /^data:([^;]+);base64,(.+)$/.exec(imageUrl);
      const base64 = base64Match ? base64Match[2] : imageUrl;
      const mime = base64Match?.[1] ?? "image/png";
      imagePart = { type: "image", image: base64, mediaType: mime };
    } else if (imageUrl.startsWith("http")) {
      imagePart = { type: "image", image: new URL(imageUrl) };
    } else {
      imagePart = { type: "image", image: imageUrl };
    }

    const { object } = await generateObject({
      model: google("gemini-2.5-flash"),
      schema: ROSS_IMAGE_REVIEW_SCHEMA,
      system: ROSS_IMAGE_REVIEW_SYSTEM,
      messages: [
        {
          role: "user" as const,
          content: [
            { type: "text" as const, text: `Original prompt for this design:\n${prompt || "No prompt."}\n\nAnalyze the image and return shadingFix, lineFix, and colorFix.` },
            imagePart,
          ],
        },
      ],
    });

    return { data: object };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Ross image review failed";
    console.error("Ross (getRossImageReview) error:", err);
    return { error: message };
  }
}

const ROSS_STYLE_ANALYSIS_SCHEMA = z.object({
  styleInstructions: z
    .string()
    .describe(
      "A single paragraph of Style Instructions that can be appended to future AI image prompts, summarizing line weight, shading, color palette, and aesthetic."
    ),
});

const ROSS_STYLE_ANALYSIS_PROMPT = `Analyze this tattoo portfolio image. Identify the following technical elements:

Line Weight: (e.g., Bold traditional, 3RL fine-line, varying weights)

Shading Style: (e.g., Whip-shading, smooth gradients, stippling/dotwork)

Color Palette: (e.g., High-contrast black & grey, limited primary palette)

Aesthetic: (e.g., Neo-traditional, illustrative, minimalist)

Output a single paragraph of 'Style Instructions' that can be appended to future AI image prompts.`;

/**
 * Ross Style Analysis: run a portfolio/reference image through Gemini vision to produce
 * a text-based "DNA" (Style Instructions) for the studio. Use when a studio uploads to
 * reference-images or studio portfolio so that prompt can be appended to future AI generations.
 */
export async function getRossStyleAnalysis(
  imageUrl: string
): Promise<{ data?: string; error?: string }> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    return { error: "GEMINI_API_KEY is not configured." };
  }
  if (!imageUrl || typeof imageUrl !== "string") {
    return { error: "Image URL is required." };
  }

  try {
    let imagePart: { type: "image"; image: URL | string; mediaType?: string };
    if (imageUrl.startsWith("data:")) {
      const base64Match = /^data:([^;]+);base64,(.+)$/.exec(imageUrl);
      const base64 = base64Match ? base64Match[2] : imageUrl;
      const mime = base64Match?.[1] ?? "image/png";
      imagePart = { type: "image", image: base64, mediaType: mime };
    } else if (imageUrl.startsWith("http")) {
      imagePart = { type: "image", image: new URL(imageUrl) };
    } else {
      imagePart = { type: "image", image: imageUrl };
    }

    const { object } = await generateObject({
      model: google("gemini-2.5-flash"),
      schema: ROSS_STYLE_ANALYSIS_SCHEMA,
      messages: [
        {
          role: "user" as const,
          content: [
            { type: "text" as const, text: ROSS_STYLE_ANALYSIS_PROMPT },
            imagePart,
          ],
        },
      ],
    });

    return { data: object.styleInstructions };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Style analysis failed";
    console.error("Ross (getRossStyleAnalysis) error:", err);
    return { error: message };
  }
}

/** Persist a Replicate CDN image to Supabase Storage. Uses arrayBuffer → Uint8Array to avoid 0-byte file bugs in serverless. */
export async function persistGeneratedTattoo(
  replicateUrl: string,
  studioId: string
): Promise<{ success: true; url: string } | { success: false; error: string }> {
  try {
    const supabase = await createClient();

    const response = await fetch(replicateUrl);
    if (!response.ok) throw new Error("Could not reach Replicate CDN");

    const arrayBuffer = await response.arrayBuffer();
    const fileBody = new Uint8Array(arrayBuffer);

    const fileName = `${studioId}/${randomUUID()}.webp`;

    const { error: uploadError } = await supabase.storage
      .from("generated-designs")
      .upload(fileName, fileBody, {
        contentType: "image/webp",
        upsert: true,
      });

    if (uploadError) throw uploadError;

    const {
      data: { publicUrl },
    } = supabase.storage.from("generated-designs").getPublicUrl(fileName);

    return { success: true, url: publicUrl };
  } catch (err) {
    console.error("Persistence error:", err);
    return { success: false, error: "Failed to save design permanently" };
  }
}
