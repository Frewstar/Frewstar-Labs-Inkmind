import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getAccessToken } from "@/lib/google-auth";
import { createClient } from "@/utils/supabase/server";
import prisma from "@/lib/db";
import { getStyleById } from "@/lib/tattoo-styles";
import { saveGeneratedImageToLocal } from "@/lib/local-storage";

const DEFAULT_STUDIO_SLUG = "default";

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
  /** If provided, save designs to this studio (by slug) instead of default. */
  studioSlug?: string;
  /** If provided, fetch this design's image_url and use it as the AI reference (when no referenceImage/referenceImageUrl). */
  parent_id?: string;
  referenceImage?: string; // base64 (with or without data URL prefix)
  referenceImageUrl?: string; // Supabase storage or other public URL
  reference_image_url?: string; // alias for referenceImageUrl (e.g. Replicate-style clients)
  /** Img2Img strength 0.1–1.0: lower = stay closer to reference, higher = more freedom. Default 0.5. */
  referenceStrength?: number;
  /** Alias for referenceStrength (e.g. prompt_strength / strength from other providers). */
  strength?: number;
}

const QUOTA_EXCEEDED_MESSAGE =
  "You have used your 5 free daily designs. Come back tomorrow or upgrade!";

export async function POST(req: NextRequest) {
  try {
    let authUser: { id: string; email?: string | null } | null = null;
    let prismaUser: { id: string; isAdmin: boolean; dailyGenerations: number; role: string | null } | null = null;
    let isQuotaExempt = false;
    let isGuest = false;

    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      authUser = user ?? null;
    } catch {
      authUser = null;
    }

    if (authUser?.id) {
      const profile = await prisma.profiles.findUnique({
        where: { id: authUser.id },
        select: { id: true, is_admin: true, daily_generations: true, role: true },
      });
      if (profile) {
        prismaUser = {
          id: profile.id,
          isAdmin: profile.is_admin,
          dailyGenerations: profile.daily_generations,
          role: profile.role,
        };
        isQuotaExempt =
          profile.is_admin ||
          profile.role === "PRO" ||
          profile.role === "SUPER_ADMIN";
      }
    } else {
      isGuest = true;
    }

    if (!isGuest && !prismaUser) {
      return NextResponse.json(
        { error: "Forbidden", message: "No account found. Sign in or create an account." },
        { status: 403 }
      );
    }

    if (!isGuest && prismaUser && !isQuotaExempt && prismaUser.dailyGenerations <= 0) {
      return NextResponse.json(
        { error: "Quota exceeded", message: QUOTA_EXCEEDED_MESSAGE },
        { status: 403 }
      );
    }

    const body: GenerateRequest = await req.json();
    const {
      prompt,
      style,
      placement,
      count = 4,
      isPaid = false,
      studioSlug: requestedStudioSlug,
      parent_id: parentId,
      referenceImage,
      referenceImageUrl,
      reference_image_url,
      referenceStrength: rawStrength,
      strength: strengthAlias,
    } = body;

    // Resolve reference URL: explicit URL, or from parent_id (fetch parent design's image_url)
    let referenceUrl = referenceImageUrl ?? reference_image_url;
    if (parentId && !referenceUrl && !referenceImage) {
      const parentDesign = await prisma.designs.findUnique({
        where: { id: parentId },
        select: { image_url: true },
      });
      if (parentDesign?.image_url) {
        referenceUrl = parentDesign.image_url;
      }
    }

    // Strength: default 0.5, range 0.1–1.0
    const rawStrengthValue = rawStrength ?? strengthAlias;
    const referenceStrength =
      rawStrengthValue != null
        ? Math.min(1, Math.max(0.1, Number(rawStrengthValue)))
        : 0.5;

    let referenceImageData = referenceImage;
    if (referenceUrl && !referenceImageData) {
      try {
        const imageRes = await fetch(referenceUrl);
        if (!imageRes.ok) throw new Error("Failed to fetch reference image");
        const buf = await imageRes.arrayBuffer();
        const base64 = Buffer.from(buf).toString("base64");
        const contentType = imageRes.headers.get("content-type") || "image/png";
        referenceImageData = `data:${contentType};base64,${base64}`;
      } catch (e) {
        console.error("[InkMind] Failed to fetch reference image URL:", e);
        return NextResponse.json(
          { error: "Failed to load reference image from URL" },
          { status: 400 }
        );
      }
    }

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

    const fullPrompt = buildTattooPrompt(prompt, style, placement, !!referenceImageData);

    const modelLabel = isPaid ? `Paid tier (${PAID_MODEL_ID})` : `Free tier (${FREE_MODEL_ID})`;
    console.log(`[InkMind] Generating ${count} images using ${modelLabel}`);

    let token: string | undefined;
    if (isPaid) {
      token = await getAccessToken();
    }

    const images: string[] = [];
    for (let i = 0; i < count; i++) {
      const imageData = await generateSingleImage(fullPrompt, { isPaid, token, referenceImage: referenceImageData });
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

    if (!isGuest && prismaUser && !isQuotaExempt) {
      await prisma.profiles.update({
        where: { id: prismaUser.id },
        data: { daily_generations: { decrement: 1 } },
      });
    }

    const useLocalStorage = process.env.USE_LOCAL_STORAGE === "true";

    let designId: string | null = null;
    let designsToReturn: string[] = images;

    if (useLocalStorage) {
      // Store images in public/uploads/generated for testing without Supabase
      const urls: string[] = [];
      for (let i = 0; i < images.length; i++) {
        try {
          const url = await saveGeneratedImageToLocal(images[i]);
          urls.push(url);
        } catch (err) {
          console.error("[InkMind] Local save failed for image", i + 1, err);
          urls.push(images[i]); // fallback to base64 so client still gets an image
        }
      }
      designsToReturn = urls;
      console.log(`[InkMind] Saved ${urls.length} images to local folder (USE_LOCAL_STORAGE=true)`);
    } else if (authUser?.id) {
      try {
        const supabase = await createClient();
        const targetStudio = await resolveStudioForSave(requestedStudioSlug);
        const profileId = authUser.id;

        const promptForDb = [prompt, style, placement].filter(Boolean).join(" — ") || fullPrompt;
        const uploadedUrls: string[] = [];

        for (let i = 0; i < images.length; i++) {
          const imageUrl = await uploadGeneratedImage(supabase, profileId, images[i], targetStudio.id);
          if (!imageUrl) {
            uploadedUrls.push(images[i]); // fallback to base64 if upload failed
            continue;
          }
          uploadedUrls.push(imageUrl);

          const design = await prisma.designs.create({
            data: {
              profile_id: profileId,
              studio_id: targetStudio.id,
              image_url: imageUrl,
              prompt: promptForDb,
              reference_image_url: referenceUrl ?? null,
              parent_id: parentId ?? null,
              status: "draft",
            },
            select: { id: true },
          });
          if (i === 0) designId = design.id;
        }
        // Return URLs so the client can persist last generation in localStorage without quota issues
        designsToReturn = uploadedUrls;
      } catch (err) {
        console.error("[InkMind] Failed to save design(s) to DB:", err);
      }
    }

    console.log(`[InkMind] Successfully generated ${images.length}/${count} images`);
    return NextResponse.json({
      designs: designsToReturn,
      ...(designId != null && { designId }),
      ...(referenceUrl && { referenceImageUrl: referenceUrl }),
    });
  } catch (error) {
    console.error("[InkMind] Image generation error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Generation failed" },
      { status: 500 }
    );
  }
}

const ARTIST_SYSTEM_INSTRUCTION = `You are a World Class Tattoo Artist. Your output must be ink-on-skin logic only: designs that can actually be tattooed. No impossible gradients, no 3D renders, no digital-art-only effects. Think like a tattooist: clean linework, achievable shading, and compositions that sit well on skin.`;

/** Strength 0.1–1.0: lower = stay very close to reference, higher = more freedom. */
function getReferenceInstruction(strength: number): string {
  if (strength <= 0.3) {
    return "\nREFERENCE (STRICT): A reference image is provided. Make only very subtle changes. Keep the composition, linework, and almost all details identical. Only apply the specific modifications requested in the prompt (e.g. add shading, thicken lines). Do not redraw or reimagine the design.";
  }
  if (strength <= 0.6) {
    return "\nREFERENCE: A reference image is provided. Use it as a strong base. Modify it according to the user's instructions while keeping the same general composition and subject. Translate into the chosen tattoo style where requested.";
  }
  if (strength <= 0.9) {
    return "\nREFERENCE (LOOSE): A reference image is provided as inspiration only. You may change composition, style, and details more freely. Follow the user's instructions and the chosen tattoo style.";
  }
  return "\nREFERENCE (MAX): A reference image is provided for inspiration only. You have maximum freedom to reinterpret the design. Follow the user's instructions and the chosen tattoo style; the output may differ significantly from the reference.";
}

function buildTattooPrompt(
  userPrompt: string,
  style: string,
  placement: string,
  hasReferenceImage?: boolean,
  referenceStrength: number = 0.5
): string {
  const stylePreset = getStyleById(style);
  const styleLabel = stylePreset?.label ?? style;
  const styleKeywords = stylePreset?.keywords ?? "";

  const subjectLine = styleKeywords
    ? `A ${styleLabel.toLowerCase()} tattoo of ${userPrompt}, ${styleKeywords}.`
    : `A ${styleLabel.toLowerCase()} tattoo of ${userPrompt}.`;

  const referenceInstruction = hasReferenceImage
    ? getReferenceInstruction(referenceStrength)
    : "";

  return `Create a professional tattoo design on a clean white background, ready to show a client.

STYLE / SUBJECT: ${subjectLine}
PLACEMENT: ${placement}

ARTIST DIRECTION:
- High contrast black ink with subtle gold (#E8B45A) accent details where appropriate
- Clean, centered composition on pure white background
- No skin texture, no background elements, just the design itself
- Tattoo-ready quality — what the client would actually see as a design sketch
- Ink-on-skin logic only: no impossible gradients, no 3D renders

SHADING REQUIREMENTS (STRICT):
- Use professional whip-shading, soft gradients, and stippling where the style allows
- Avoid flat black areas unless the style calls for it (e.g. blackwork)
- Achievable light-to-shadow transitions that work as real tattoos
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

/** Resolve studio for saving: use requested slug if provided and exists, else default. */
async function resolveStudioForSave(requestedSlug?: string | null): Promise<{ id: string }> {
  const slug = (requestedSlug ?? "").trim() || DEFAULT_STUDIO_SLUG;
  let studio = await prisma.studios.findUnique({
    where: { slug },
    select: { id: true },
  });
  if (!studio && slug === DEFAULT_STUDIO_SLUG) {
    studio = await prisma.studios.create({
      data: { slug: DEFAULT_STUDIO_SLUG, name: "InkMind Default" },
      select: { id: true },
    });
  }
  if (!studio) {
    const fallback = await prisma.studios.findUnique({
      where: { slug: DEFAULT_STUDIO_SLUG },
      select: { id: true },
    });
    if (fallback) return fallback;
    return prisma.studios.create({
      data: { slug: DEFAULT_STUDIO_SLUG, name: "InkMind Default" },
      select: { id: true },
    });
  }
  return studio;
}

/** Upload a base64 data-URL image to Supabase storage; returns public URL or null. Tags with studio_id for scoped storage. */
async function uploadGeneratedImage(
  supabase: Awaited<ReturnType<typeof createClient>>,
  profileId: string,
  dataUrl: string,
  studioId: string
): Promise<string | null> {
  const { data, mimeType } = parseReferenceImage(dataUrl);
  const ext = mimeType === "image/png" ? "png" : mimeType === "image/jpeg" ? "jpg" : "png";
  const path = `${profileId}/${randomUUID()}.${ext}`;
  const buf = Buffer.from(data, "base64");

  const { error } = await supabase.storage.from("generated-designs").upload(path, buf, {
    contentType: mimeType,
    cacheControl: "3600",
    upsert: false,
    metadata: { studio_id: studioId },
  });

  if (error) {
    console.error("[InkMind] Upload generated image failed:", error.message);
    return null;
  }

  const { data: urlData } = supabase.storage.from("generated-designs").getPublicUrl(path);
  return urlData.publicUrl;
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

  let systemText = ARTIST_SYSTEM_INSTRUCTION;
  if (referenceImage) {
    systemText += "\n\nIf a reference image is provided, maintain its core subject matter but translate it into the chosen tattoo style.";
  }

  const requestBody: Record<string, unknown> = {
    contents: [{ role: "user", parts }],
    systemInstruction: { parts: [{ text: systemText }] },
    generationConfig: isPaid
      ? { responseModalities: ["IMAGE"], imageConfig: { aspectRatio: "1:1", imageSize: "2K" } }
      : { responseModalities: ["IMAGE"] },
  };

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
