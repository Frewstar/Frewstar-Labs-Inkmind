# InkMind — From Code to Live Web App

## The short version

Next.js + Vercel. Same setup as Kinetic. The API route keeps your Anthropic key
on the server, Vercel handles everything else. Total time: ~15 minutes once the
code is in place.

---

## Step 1 — Scaffold the project (terminal)

```bash
npx create-next-app@latest inkmind
cd inkmind
npm install anthropic
```

Prompts: TypeScript ✓ | App Router ✓ | Tailwind ✓ | everything else default.

---

## Step 2 — Drop in the files we already built

```
inkmind/
├── app/
│   ├── globals.css              ← replace entirely (globals.css)
│   ├── layout.tsx               ← replace entirely (layout.tsx)
│   ├── page.tsx                 ← replace entirely (page.tsx)
│   └── api/
│       └── generate/
│           └── route.ts         ← create this (below)
├── components/
│   └── DesignStudio.tsx         ← create this folder + file (DesignStudio.tsx)
└── lib/
    └── anthropic.ts             ← create this folder + file (below)
```

---

## Step 3 — Create the two remaining files in Cursor

### lib/anthropic.ts

```typescript
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export default client;
```

### app/api/generate/route.ts

```typescript
import { NextResponse } from "next/server";
import anthropic from "@/lib/anthropic";

interface GenerateRequest {
  prompt: string;
  style: string;
  placement: string;
  count?: number;
}

export async function POST(req: Request) {
  const body: GenerateRequest = await req.json();
  const { prompt, style, placement } = body;
  const count = body.count ?? 4;

  if (!prompt || !style || !placement) {
    return NextResponse.json(
      { error: "Missing required fields: prompt, style, placement" },
      { status: 400 }
    );
  }

  const systemPrompt = `You are an expert tattoo designer. Generate detailed SVG tattoo design sketches.

Rules:
- Output ONLY valid SVG markup. No explanations, no markdown, no code fences.
- Each SVG must be self-contained with viewBox="0 0 400 400".
- Use stroke-based drawing to mimic ink on skin. Vary stroke-width for organic feel.
- Style must match the requested tattoo style exactly.
- Placement informs composition (forearm = narrow vertical, chest = wider, etc).
- Colours: black (#1a1a1a) and dark grey (#333) for strokes only.
  Gold accents (#E8B45A at 40-60% opacity) can highlight focal points.
- These are presentation-ready. Make them genuinely beautiful.`;

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

Vary the composition, detail level, and layout between designs.`,
      },
    ],
  });

  const text =
    message.content[0].type === "text" ? message.content[0].text : "";

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

## Step 4 — Test locally

```bash
# Create .env.local in the project root with:
# ANTHROPIC_API_KEY=sk-ant-...

npm run dev
```

Open `http://localhost:3000`. The page loads with placeholder sketches.
Type a prompt → hit Generate → real AI-produced SVGs appear in the gallery.

---

## Step 5 — Deploy to Vercel

```bash
npm install -g vercel   # if you haven't already
vercel login            # sign in (or skip if already logged in)
vercel                  # run from inside the inkmind folder
```

Vercel asks three questions. Answer all with defaults (Yes / Yes / Yes).
It builds and gives you a URL like `https://inkmind-xxxxx.vercel.app`.

---

## Step 6 — Add the API key on Vercel (critical)

The key does NOT go in the code. It goes in Vercel's environment:

1. Go to your project on vercel.com
2. Settings → Environment Variables
3. Add:
   - Name:  `ANTHROPIC_API_KEY`
   - Value: `sk-ant-...` (paste your key)
   - Environment: Production + Preview + Development (tick all three)
4. Click Add

Then redeploy:

```bash
vercel --prod
```

That's it. The app is live, the AI route is working, your key is safe on the
server side. Nobody can see it from the client.

---

## Step 7 — Point a real domain at it (optional but worth doing)

If you want `inkmind.ai` or whatever instead of the Vercel subdomain:

1. Buy the domain (Namecheap, Cloudflare, wherever)
2. On Vercel: Settings → Domains → Add Domain
3. Follow the DNS instructions (usually just a CNAME record)
4. Done in ~5 minutes once DNS propagates

---

## What's live vs what comes next

### Live now ✓
- Full landing page (hero, how it works, why InkMind, footer)
- Interactive design studio (prompt, style, placement selectors)
- AI generation via Claude → SVG designs appear in gallery
- Responsive (works on mobile)
- Booking strip UI (buttons are there, booking logic is Module 2)

### Module 2 — Booking (next build)
- Calendar integration (cal.com or similar — drop-in, no backend needed)
- Deposit payment (Stripe)
- "Book This" button on each design card becomes functional
- This is where Mars starts getting bookings

### Module 1 — Artist style training (after booking works)
- Upload Mars's portfolio
- Inject style analysis into the system prompt
- Designs start looking like his actual work
- Only touches route.ts — nothing else changes
```
