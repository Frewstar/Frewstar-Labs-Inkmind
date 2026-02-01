import { NextResponse } from "next/server";
import anthropic from "@/lib/anthropic";

const SVG_NS = "http://www.w3.org/2000/svg";
const DEFAULT_VIEWBOX = "0 0 400 400";
const DESIGN_DELIMITER = "===DESIGN===";

/** Strip markdown code fences (```svg, ```xml, ```html, ```) and extract raw SVG. */
function stripMarkdownAndExtractSvg(chunk: string): string | null {
  let s = chunk.trim();
  // Remove leading fence: ```svg, ```xml, ```html, or plain ```
  s = s.replace(/^\s*```(?:svg|xml|html)?\s*\n?/i, "").trim();
  // Remove trailing fence
  s = s.replace(/\n?```\s*$/i, "").trim();
  // Find first <svg ... > and matching </svg>
  const open = s.indexOf("<svg");
  if (open === -1) return null;
  const close = s.indexOf("</svg>", open);
  if (close === -1) return null;
  return s.slice(open, close + "</svg>".length);
}

/** Fix AI hallucinations: strip markdown link syntax from xmlns (e.g. [url](url) -> url). */
function sanitizeXmlns(svg: string): string {
  return svg.replace(
    /xmlns\s*=\s*["']\[[^\]]*\][^"']*["']/gi,
    `xmlns="${SVG_NS}"`
  );
}

/** Ensure SVG has xmlns, viewBox, and tattoo-sketch class so it renders correctly. */
function normalizeSvg(svg: string): string {
  let out = sanitizeXmlns(svg);
  if (!/xmlns\s*=\s*["']http:\/\/www\.w3\.org\/2000\/svg["']/i.test(out)) {
    out = out.replace(/<svg(?=\s|>)/, `<svg xmlns="${SVG_NS}"`);
  }
  if (!/viewBox\s*=/i.test(out)) {
    out = out.replace(/<svg(?=\s|>)/, `<svg viewBox="${DEFAULT_VIEWBOX}"`);
  }
  // Add tattoo-sketch class for gallery sizing (matches placeholder SVGs)
  if (!/class\s*=\s*["'][^"']*tattoo-sketch/i.test(out)) {
    const classMatch = out.match(/<svg[^>]*class\s*=\s*["']([^"']*)["']/i);
    if (classMatch) {
      out = out.replace(
        /class\s*=\s*["'][^"']*["']/i,
        `class="${classMatch[1]} tattoo-sketch"`
      );
    } else {
      out = out.replace(/<svg(?=\s|>)/, `<svg class="tattoo-sketch"`);
    }
  }
  return out;
}

/** Extract all <svg>...</svg> blocks from text (fallback when delimiter split fails). */
function extractAllSvgs(text: string): string[] {
  const results: string[] = [];
  let pos = 0;
  while (pos < text.length) {
    const open = text.indexOf("<svg", pos);
    if (open === -1) break;
    const close = text.indexOf("</svg>", open);
    if (close === -1) break;
    results.push(text.slice(open, close + 6));
    pos = close + 6;
  }
  return results;
}

export async function POST(req: Request) {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: "API key is missing. Set ANTHROPIC_API_KEY in your environment." },
        { status: 500 }
      );
    }

    const { prompt, style, placement } = await req.json();

    if (!prompt || !style || !placement) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const systemPrompt = `You are an expert tattoo designer. Your job is to generate
detailed SVG tattoo design sketches.

Rules:
- Output ONLY valid SVG markup. No explanations, no markdown, no code fences (no \`\`\`).
- Each SVG MUST include xmlns='http://www.w3.org/2000/svg' and viewBox="0 0 400 400".
- Use stroke-based drawing (no fill) to mimic ink on skin.
- Line work: use curves and varying stroke-widths.
- Style: ${style}. Placement: ${placement}.
- Colors: Black (#1a1a1a) and dark grey (#333).
- Gold accents: Use #E8B45A at 50% opacity for focal points.`;

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 4000,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: `Generate 4 different tattoo designs for: ${prompt}. 
          Return them as SVGs separated by the delimiter: ===DESIGN===`,
        },
      ],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";
    const rawChunks = text
      .split(DESIGN_DELIMITER)
      .map((s) => s.trim())
      .filter(Boolean);

    const designs: string[] = [];
    for (const chunk of rawChunks) {
      const extracted = stripMarkdownAndExtractSvg(chunk);
      if (extracted) designs.push(normalizeSvg(extracted));
      if (designs.length >= 4) break;
    }

    // Fallback: if delimiter split yielded nothing useful, extract all SVGs from full text
    if (designs.length === 0) {
      const allSvgs = extractAllSvgs(text);
      for (const raw of allSvgs.slice(0, 4)) {
        designs.push(normalizeSvg(raw));
      }
    }

    return NextResponse.json({ designs: designs.length ? designs : [] });
  } catch (error) {
    console.error("AI Generation Error:", error);
    return NextResponse.json(
      { error: "Failed to generate designs" },
      { status: 500 }
    );
  }
}