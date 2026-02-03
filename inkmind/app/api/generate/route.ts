import { NextRequest, NextResponse } from "next/server";
import { getAccessToken } from "@/lib/google-auth";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GCP_PROJECT_ID = process.env.GCP_PROJECT_ID?.trim().replace(/^["']|["']$/g, "");
// Vertex AI location: "global" (default) or a region e.g. "us-central1"
// https://cloud.google.com/vertex-ai/generative-ai/docs/learn/locations
const VERTEX_LOCATION = (process.env.VERTEX_LOCATION || "global").trim().replace(/^["']|["']$/g, "");

// Free tier: Gemini 2.5 Flash (image) — uses GEMINI_API_KEY
const FREE_MODEL_ID = "gemini-2.5-flash-image";
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${FREE_MODEL_ID}:generateContent`;

// Paid tier: Vertex AI generateContent (Bearer token, no ?key=)
// Doc: https://cloud.google.com/vertex-ai/generative-ai/docs/reference/rest/v1/projects.locations.publishers.models/generateContent
// Requires: Vertex AI API enabled, billing on project, service account with roles/aiplatform.user
const PAID_MODEL_ID = "gemini-3-pro-image-preview";
const getPaidTierEndpoint = () =>
  `https://aiplatform.googleapis.com/v1/projects/${GCP_PROJECT_ID}/locations/${VERTEX_LOCATION}/publishers/google/models/${PAID_MODEL_ID}:generateContent`;

interface GenerateRequest {
  prompt: string;
  style: string;
  placement: string;
  count?: number;
  isPaid?: boolean;
  referenceImage?: string; // base64 (with or without data URL prefix)
}

export async function POST(req: NextRequest) {
  try {
    const body: GenerateRequest = await req.json();
    const { prompt, style, placement, count = 4, isPaid = false, referenceImage } = body;

    if (!prompt || !style || !placement) {
      return NextResponse.json(
        { error: "Missing required fields: prompt, style, placement" },
        { status: 400 }
      );
    }

    if (isPaid) {
      if (!GCP_PROJECT_ID) {
        return NextResponse.json(
          { error: "GCP_PROJECT_ID not configured. Required for Paid tier." },
          { status: 500 }
        );
      }
    } else {
      if (!GEMINI_API_KEY) {
        return NextResponse.json(
          { error: "GEMINI_API_KEY not configured in environment" },
          { status: 500 }
        );
      }
    }

    const fullPrompt = buildTattooPrompt(prompt, style, placement, !!referenceImage);

    const modelLabel = isPaid ? `Paid tier (${PAID_MODEL_ID})` : `Free tier (${FREE_MODEL_ID})`;
    console.log(`[InkMind] Generating ${count} images using ${modelLabel}`);

    let token: string | undefined;
    if (isPaid) {
      token = await getAccessToken();
    }

    const images: string[] = [];
    for (let i = 0; i < count; i++) {
      const imageData = await generateSingleImage(fullPrompt, { isPaid, token, referenceImage });
      if (imageData) {
        images.push(imageData);
      } else {
        console.warn(`[InkMind] Failed to generate image ${i + 1}/${count}`);
      }
    }

    if (images.length === 0) {
      return NextResponse.json(
        { error: "Failed to generate any images. Check console logs for details." },
        { status: 500 }
      );
    }

    console.log(`[InkMind] Successfully generated ${images.length}/${count} images`);
    return NextResponse.json({ designs: images });
  } catch (error) {
    console.error("[InkMind] Image generation error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Generation failed" },
      { status: 500 }
    );
  }
}

function buildTattooPrompt(userPrompt: string, style: string, placement: string, hasReferenceImage?: boolean): string {
  const styleMap: Record<string, string> = {
    "fine-line": "Fine-line blackwork",
    "geometric": "Geometric blackwork",
    "blackwork": "Bold blackwork",
    "watercolor": "Watercolor with black outlines",
    "traditional": "Traditional American style",
    "minimalist": "Minimalist fine-line",
  };

  const styleName = styleMap[style] || style;

  const referenceInstruction = hasReferenceImage
    ? "\nREFERENCE: A reference image is provided. Maintain its core subject matter but translate it into the chosen tattoo style."
    : "";

  return `Create a professional tattoo design on a clean white background, ready to show a client.

STYLE: ${styleName}
SUBJECT: ${userPrompt}
PLACEMENT: ${placement}

ARTIST DIRECTION:
- Inspired by Mars's signature style: minimal architectural aesthetic with bold linework
- High contrast black ink with subtle gold (#E8B45A) accent details where appropriate
- Clean, centered composition on pure white background
- No skin texture, no background elements, just the design itself
- Tattoo-ready quality — what the client would actually see as a design sketch

SHADING REQUIREMENTS (STRICT):
- Use professional whip-shading, soft gradients, and stippling
- Avoid flat black areas
- Ensure 3D depth and realistic light-to-shadow transitions
${referenceInstruction}

TECHNICAL REQUIREMENTS:
- Crisp linework that would translate well to skin
- Appropriate detail level for the specified placement
- Composition optimized for ${placement.toLowerCase()} anatomy
- Looks like a professional tattoo artist's final design sketch, not generic art
- Isolated on white background, centered, no shadows or gradients on the background`;
}

/** Strip data URL prefix from base64 string if present; return raw base64 and mime type */
function parseReferenceImage(ref: string): { data: string; mimeType: string } {
  const dataUrlMatch = ref.match(/^data:([^;]+);base64,(.+)$/);
  if (dataUrlMatch) {
    return { data: dataUrlMatch[2], mimeType: dataUrlMatch[1] || "image/png" };
  }
  return { data: ref, mimeType: "image/png" };
}

async function generateSingleImage(
  prompt: string,
  options: { isPaid?: boolean; token?: string; referenceImage?: string } = {}
): Promise<string | null> {
  const { isPaid = false, token, referenceImage } = options;

  const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [];

  if (referenceImage) {
    const { data, mimeType } = parseReferenceImage(referenceImage);
    parts.push({ inlineData: { data, mimeType } });
  }
  parts.push({ text: prompt });

  const requestBody: Record<string, unknown> = {
    contents: [{ role: "user", parts }],
    generationConfig: isPaid
      ? { responseModalities: ["IMAGE"], imageConfig: { aspectRatio: "1:1", imageSize: "2K" } }
      : { responseModalities: ["IMAGE"] },
  };

  if (referenceImage) {
    requestBody.systemInstruction = {
      parts: [{
        text: "If a reference image is provided, maintain its core subject matter but translate it into the chosen tattoo style.",
      }],
    };
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  let url: string;
  if (isPaid && token) {
    url = getPaidTierEndpoint();
    headers["Authorization"] = `Bearer ${token}`;
  } else {
    url = `${GEMINI_ENDPOINT}?key=${GEMINI_API_KEY}`;
  }

  try {
    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(requestBody),
    });

    const responseText = await response.text();

    if (!response.ok) {
      console.error(`[InkMind] Gemini API error (${response.status}):`, responseText);

      try {
        const errorData = JSON.parse(responseText);
        const errorMsg = errorData?.error?.message || errorData?.error?.status || "Unknown error";
        console.error(`[InkMind] Error details:`, errorMsg);
      } catch {
        console.error(`[InkMind] Raw error:`, responseText.slice(0, 500));
      }

      return null;
    }

    const data = JSON.parse(responseText);

    // Extract base64 image from response
    const candidate = data.candidates?.[0];
    const parts = candidate?.content?.parts || [];
    const imagePart = parts.find((p: any) => p.inlineData?.data);

    if (!imagePart?.inlineData?.data) {
      console.error("[InkMind] No image data in response");
      console.error("[InkMind] Response structure:", JSON.stringify(data, null, 2));
      return null;
    }

    const mimeType = imagePart.inlineData.mimeType || "image/png";
    return `data:${mimeType};base64,${imagePart.inlineData.data}`;
  } catch (error) {
    console.error("[InkMind] Failed to generate image:", error);
    return null;
  }
}
