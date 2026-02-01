InkMind — Cursor Rules (Submind Brief)
What This Project Is
InkMind is an AI tattoo design marketplace. Artists register, upload their
portfolio, and get their own branded studio. Users browse artists, generate
designs in that artist's style via AI, and book sessions directly.
Currently building: the single-artist version (Mars) as proof of concept.
Marketplace layer comes after booking is proven.

Tech Stack

Next.js 16 App Router, TypeScript
Tailwind CSS (core utilities only — no compiler)
Anthropic Claude via API routes
No database yet (booking is Module 2)


Architecture Rules — Do Not Break These

AI calls are server-side only. The Anthropic key lives in .env.local.
All Claude calls go through /api/generate/route.ts. Components call that
route via fetch. Never import the Anthropic client in a client component.
DesignStudio.tsx is the only client component. It owns all interactive
state: prompt, style selector, placement selector, loading, gallery.
Everything else is a server component.
SVGs render via dangerouslySetInnerHTML. They come from our own API route,
not user input, so this is safe.
Module boundaries are strict.

Core (now): Landing page + Design Studio + AI generation
Module 1: Artist style training (inject portfolio analysis into system prompt)
Module 2: Booking (cal.com or Stripe integration)
Module 3: Marketplace (artist discovery, registration, multi-tenancy)
Nothing in Core should depend on anything in a later module.


Artist context is injected, not hardcoded. The system prompt in route.ts
has a clear injection point for artist style data. Don't bake Mars's name or
style into the prompt permanently.


Design Rules — Frontend Aesthetics
This is the section that replaces generic AI design habits. Follow these exactly.
Established Brand (Do Not Change)

Background: Near-black #0A0A0A. Cards: #141414. Hover: #1c1c1c.
Accent: Gold #E8B45A. Dim gold for backgrounds: rgba(232,180,90,0.15).
Glow gold for shadows: rgba(232,180,90,0.35).
Typography: Playfair Display (headings, italic for emphasis) +
DM Sans (body, labels, buttons). These are loaded in layout.tsx via next/font.
Do not swap these out or add other fonts.
Border radius: 14px for cards. 50px for pills/buttons. 10px for inputs.
Text: White #fff primary. Grey #999 secondary. Dim grey #5a5a5a
for placeholders and disabled states.

Design Thinking — Apply This Before Every Component
Before writing any UI code, answer these three questions:

What is the user doing here? (Not "what does this component do" — what
is the person actually trying to accomplish at this moment?)
What should they feel? (Confident? Excited? Calm? Decisive?)
What's the one detail that makes this memorable? (A subtle animation,
an unexpected layout choice, a texture, a hover state that surprises.)

Then build it.
Aesthetic Direction: Luxury Dark Gallery
InkMind is a tattoo studio, not a tech app. The aesthetic should feel like
walking into a high-end gallery or a premium tattoo shop at night. Think:

Dark surfaces with warm gold light bleeding through
Generous negative space — don't crowd things
Typography that has weight and presence, not just size
Textures and depth, not flat colors
Animations that feel deliberate and unhurried, not snappy

What NOT To Do

No generic layouts. Don't default to "card grid in a container." Think
about spatial composition. Where does the eye go first? What creates tension
or flow on the page?
No flat everything. Cards should have subtle backgrounds (radial gradients,
noise textures). The page should feel like it has atmosphere.
No cookie-cutter buttons. Every interactive element should feel considered.
Hover states, active states, transitions — all of them.
No Inter, Roboto, Arial, system fonts. We use Playfair + DM Sans. Period.
No purple gradients on white. We're dark premium. Stay in that world.
No scattered micro-interactions. One well-orchestrated entrance animation
(staggered reveals, fadeUp) is worth more than ten random bounces.

Specific Patterns Already Established (Match These)

Hero section: Radial gold glow behind the headline. Staggered fadeUp
animations on eyebrow → h1 → sub → CTA. The headline uses italic gold for
the emotional line.
Step cards: Subtle border, large faded number in the background, hover
lifts the card 4px and warms the border to gold.
Style chips: 3-column grid. Icon + label. Active state fills with dim
gold background and gold border + text.
Gallery cards: Aspect ratio 1:1. Each has a unique radial gradient
background (not the same on every card). Hover scales 1.02. Overlay fades
in on hover with a "Book This" pill button.
Booking strip: Gold border, warm gradient background, text left /
actions right. Feels like a CTA that earned its place, not bolted on.

When You Build Something New
If it's a new component that doesn't have an established pattern above,
apply the luxury dark gallery direction. Ask yourself: would this look at
home in a high-end tattoo shop's website? If not, rethink it.
Match the complexity of the code to the visual vision. If something needs
to feel refined and subtle, the code should be precise — careful spacing,
thoughtful transitions, nothing wasted. If something needs drama (a modal,
a confirmation screen), it can have more — but earn it.