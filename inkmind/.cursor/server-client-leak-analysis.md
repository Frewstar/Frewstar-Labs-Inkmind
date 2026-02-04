# Server / Client Leak Analysis

## Source of `next/headers` error

**Only file that uses `next/headers`:**
- `@/utils/supabase/server.ts` — line 2: `import { cookies } from "next/headers"`

That module is **server-only**. Any Client Component (`"use client"`) that imports it (directly or indirectly) will trigger the build error.

---

## Component tree from `app/page.tsx` and `components/HomeContent.tsx`

### `app/page.tsx` (Server Component — no `"use client"`)
- Imports: `HomeContent`, `DesignGallery`
- Renders: `<HomeContent designGallerySlot={<DesignGallery />} />`
- **DesignGallery** is only imported here and is rendered as a **slot** (prop), not imported by HomeContent.

### `components/HomeContent.tsx` (Client Component — `"use client"`)
- Imports: `DesignStudio`, `InstagramPortfolio`, `BookingModal`, `@/lib/branding`
- Does **not** import `DesignGallery` or `@/utils/supabase/server`
- Receives `designGallerySlot` as prop and renders `{designGallerySlot}`

### Conclusion for this tree
- **No client component in this tree imports `@/utils/supabase/server` or any utility that uses `next/headers`.**
- **No client component imports `DesignGallery`.** DesignGallery is only imported in `app/page.tsx` (server) and passed as pre-rendered content via `designGallerySlot`.

---

## All files that import `@/utils/supabase/server`

| File | Type | Safe? |
|------|------|--------|
| `app/login/actions.ts` | Server Action | Yes |
| `app/api/generate/route.ts` | API Route Handler | Yes |
| `app/admin/actions.ts` | Server Action | Yes |
| `app/admin/page.tsx` | Server Component | Yes |
| `app/admin/layout.tsx` | Server Component | Yes |
| `app/api/designs/route.ts` | API Route Handler | Yes |
| `app/api/designs/[id]/route.ts` | API Route Handler | Yes |
| `app/auth/callback/route.ts` | API Route Handler | Yes |
| `components/DesignGalleryServer.tsx` | Server Component (async, no `"use client"`) | Yes |

None of these are Client Components, so they are valid users of the server module.

---

## Client components checked (no server imports)

- `components/HomeContent.tsx` — no server, no DesignGallery
- `components/DesignStudio.tsx` — imports `@/utils/supabase/client` (browser client), not server
- `components/DesignGalleryCard.tsx` — only `next/link`
- `components/InstagramPortfolio.tsx` — no server
- `components/BookingModal.tsx` — no server
- `components/ThemeSwitcher.tsx` — no server
- `components/BodyThemeInjector.tsx` — no server
- `components/ConversationalWizard.tsx` — no server
- `components/ImageLightbox.tsx` — no server
- `app/login/LoginForm.tsx` — no server (uses actions only)
- `app/admin/AdminDesignRow.tsx` — no server (uses actions only)
- `components/GrokChat.tsx` — not fully scanned but not in page/HomeContent tree

---

## If you still see the `next/headers` error

1. **Clear Next.js cache and rebuild**
   - Delete the `.next` folder and run `npm run build` (or `next build`) again.
2. **Confirm slot pattern**
   - Ensure `app/page.tsx` imports and renders `DesignGallery` only there and passes it as `designGallerySlot` to `HomeContent`, and that `HomeContent` does not import `DesignGallery` or any server util.
3. **Search for stray imports**
   - Search the repo for `from "@/utils/supabase/server"` or `from \"@/utils/supabase/server\"` and ensure every hit is in a server-only file (e.g. `actions.ts`, route handlers, server components without `"use client"`).

---

## Summary

- **No specific files in the analyzed tree are causing a server → client leak.**  
- The only `next/headers` usage is in `@/utils/supabase/server.ts`.  
- DesignGallery (which uses that server util) is only used from the server in `app/page.tsx` and passed as a slot; no client component imports it or the server util.

If the error persists after a clean build, the cause is likely outside this tree (e.g. another page or layout) or a caching issue.
