# InkMind — Cursor Setup Guide

## 1. Create the project

```bash
npx create-next-app@latest inkmind
cd inkmind
npm install anthropic
```

When prompted: TypeScript ✓, App Router ✓, Tailwind ✓. Everything else default.

---

## 2. Environment

Create `.env.local` in the project root:

```
ANTHROPIC_API_KEY=sk-ant-...
```

---

## 3. File structure to create

```
inkmind/
├── .cursor/
│   └── rules.md              ← paste the rules block below
├── app/
│   ├── layout.tsx            ← already exists from scaffold
│   ├── page.tsx              ← replace with InkMind landing (convert the HTML we built)
│   └── api/
│       └── generate/
│           └── route.ts      ← the AI endpoint (code below)
├── components/
│   └── DesignStudio.tsx      ← the interactive prompt + gallery (extracted from the HTML)
├── lib/
│   └── anthropic.ts          ← shared client (code below)
└── .env.local
```

---

## 4. .cursor/rules.md

```markdown
# InkMind — Cursor Rules

## What this app is
InkMind is an AI tattoo design studio. Clients describe a tattoo, pick a style,
and the app generates design sketches in the artist's style. They can then book
a session directly.

## Tech stack
- Next.js 16, App Router, TypeScript
- Anthropic Claude for AI generation (via server API route)
- Tailwind CSS
- No database yet — bookings are a future module

## Architecture rules
- AI calls NEVER happen on the client. All Claude calls go through `/api/generate`.
- The API route is the only place `ANTHROPIC_API_KEY` is used.
- Components are client components ('use client') — they call the API via fetch.
- The design gallery receives generated SVGs as strings and renders them directly.

## Branding
- Background: #0A0A0A (near black)
- Cards: #141414
- Gold accent: #E8B45A
- Text: #FFFFFF, grey: #999999
- Fonts: Playfair Display (headings), DM Sans (body)
- Aesthetic: dark, premium, gallery-like. Ink and art, not tech.

## Module boundaries (don't cross these)
- Core: Generic AI tattoo designer — THIS is what we're building now
- Module 1 (later): Artist style training (portfolio upload → fine-tuned model)
- Module 2 (later): Booking page (calendar + deposits)
- Module 3 (later): Model marketplace
- Each module adds independent value. Nothing depends on the thing after it.
```

---

## 5. lib/anthropic.ts

```typescript
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export default client;
```

---

## 6. app/api/generate/route.ts

This is the core AI endpoint. It receives the user's prompt, style, and placement,
then asks Claude to produce SVG tattoo sketches.

```typescript
import { NextResponse } from "next/server";
import anthropic from "@/lib/anthropic";

interface GenerateRequest {
  prompt: string;
  style: string;       // e.g. "fine-line", "geometric", "blackwork"
  placement: string;   // e.g. "forearm", "chest"
  count?: number;      // how many designs (default 4)
}

export async response POST(req: Request) {
  // --- Input validation ---
  const body: GenerateRequest = await req.json();
  const { prompt, style, placement } = body;
  const count = body.count ?? 4;

  if (!prompt || !style || !placement) {
    return NextResponse.json(
      { error: "Missing required fields: prompt, style, placement" },
      { status: 400 }
    );
  }

  // --- Build the system prompt ---
  // This is where the "submind" personality lives.
  // Later, when we add artist-specific training (Module 1), we inject
  // the artist's portfolio description and style notes here.
  const systemPrompt = `You are an expert tattoo designer. Your job is to generate
detailed SVG tattoo design sketches based on a client's description.

Rules:
- Output ONLY valid SVG markup. No explanations, no markdown, no code fences.
- Each SVG must be self-contained with viewBox="0 0 400 400".
- Use stroke-based drawing (no fill on main elements) to mimic ink on skin.
- Line work should feel hand-drawn: vary stroke-width slightly, use curves not straight lines.
- Style must match the requested tattoo style exactly.
- Placement context informs scale and composition (e.g. forearm = narrow vertical composition).
- Colours: use only black (#1a1a1a) and dark grey (#333) for strokes. No colour fills.
  Gold accents (#E8B45A at 40-60% opacity) can highlight focal points.
- Quality: these are presentation-ready designs. Make them genuinely beautiful.`;

  // --- Call Claude ---
  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4000,
    system: systemPrompt,
    messages: [
      {
        role: "user",
        content: `Generate ${count} different tattoo design sketches as SVGs.

Description: ${prompt}
Style: ${style}
Placement: ${placement}

Return exactly ${count} SVGs, separated by the delimiter: ===DESIGN===

Each SVG should be a complete, standalone design showing a different interpretation
of the brief. Vary the composition, detail level, and layout between designs.`,
      },
    ],
  });

  // --- Parse the response ---
  const text =
    message.content[0].type === "text" ? message.content[0].text : "";

  // Split on delimiter and clean up
  const designs = text
    .split("===DESIGN===")
    .map((s) => s.trim())
    .filter((s) => s.startsWith("<svg"))
    .slice(0, count);

  if (designs.length === 0) {
    return NextResponse.json(
      { error: "AI failed to generate valid designs. Try again." },
      { status: 500 }
    );
  }

  return NextResponse.json({ designs });
}
```

---

## 7. components/DesignStudio.tsx (skeleton)

This is the client-side component that drives the prompt panel and gallery.
It calls the API and renders the returned SVGs.

```typescript
"use client";

import { useState } from "react";

const STYLES = [
  { id: "fine-line", label: "Fine Line", icon: "✦" },
  { id: "geometric", label: "Geometric", icon: "◎" },
  { id: "blackwork", label: "Blackwork", icon: "⟡" },
  { id: "watercolor", label: "Watercolor", icon: "❋" },
  { id: "traditional", label: "Traditional", icon: "⊕" },
  { id: "minimalist", label: "Minimalist", icon: "◇" },
];

const PLACEMENTS = [
  "Forearm", "Upper Arm", "Chest", "Back", "Thigh", "Neck", "Hand",
];

export default function DesignStudio() {
  const [prompt, setPrompt] = useState("");
  const [selectedStyle, setSelectedStyle] = useState("fine-line");
  const [selectedPlacement, setSelectedPlacement] = useState("Forearm");
  const [designs, setDesigns] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: prompt.trim(),
          style: selectedStyle,
          placement: selectedPlacement,
          count: 4,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Generation failed");
      setDesigns(data.designs);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="studio-layout">
      {/* Prompt panel — wire up state here */}
      <div className="prompt-panel">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe your tattoo…"
        />

        {/* Style selector */}
        <div className="style-grid">
          {STYLES.map((s) => (
            <button
              key={s.id}
              className={s.id === selectedStyle ? "active" : ""}
              onClick={() => setSelectedStyle(s.id)}
            >
              <span>{s.icon}</span> {s.label}
            </button>
          ))}
        </div>

        {/* Placement selector */}
        <div className="placement-row">
          {PLACEMENTS.map((p) => (
            <button
              key={p}
              className={p === selectedPlacement ? "active" : ""}
              onClick={() => setSelectedPlacement(p)}
            >
              {p}
            </button>
          ))}
        </div>

        <button onClick={handleGenerate} disabled={loading}>
          {loading ? "Generating…" : "Generate Designs"}
        </button>

        {error && <p className="error">{error}</p>}
      </div>

      {/* Gallery — renders SVGs directly from API response */}
      <div className="gallery-grid">
        {designs.map((svg, i) => (
          <div key={i} className="gallery-card">
            {/* dangerouslySetInnerHTML is fine here — SVGs come from our own API */}
            <div dangerouslySetInnerHTML={{ __html: svg }} />
            <div className="card-overlay">
              <button>Book This</button>
            </div>
          </div>
        ))}

        {/* Show placeholder cards if no designs yet */}
        {designs.length === 0 &&
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="gallery-card placeholder">
              <span>Design {i + 1}</span>
            </div>
          ))}
      </div>
    </div>
  );
}
```

---

## 8. What to do in Cursor

1. Scaffold the project (step 1 above).
2. Create `.env.local` with your Anthropic key.
3. Paste the `.cursor/rules.md` — this tells Cursor exactly what InkMind is
   and how the modules are bounded. It's your "submind brief" for the AI coder.
4. Create `lib/anthropic.ts` (step 5).
5. Create `app/api/generate/route.ts` (step 6) — this is the AI brain.
6. Create `components/DesignStudio.tsx` (step 7) — this is the interactive UI.
7. Convert the landing page HTML into `app/page.tsx` using Next.js conventions
   (swap Google Fonts for next/font, etc). Cursor handles this well if you just
   paste the HTML and ask it to convert.
8. Run `npm run dev` and test: type a prompt, hit Generate, see real SVG designs
   appear in the gallery.

---

## 9. How the submind connects (Module 1 — later)

When you're ready to add artist-specific style training, the ONLY thing that changes
is the system prompt in `route.ts`. You inject Mars's portfolio analysis there:

```
// Future Module 1 addition — nothing else in the app changes:
const artistContext = await getArtistProfile("mars"); 
// Returns: { styleNotes, signatureElements, portfolioSummary }

const systemPrompt = `You are ${artistContext.name}'s AI design assistant...
Known style characteristics: ${artistContext.styleNotes}
Signature elements: ${artistContext.signatureElements}
...`;
```

The frontend doesn't know or care. Same API, same SVGs, just better ones.
That's the modular architecture working.
