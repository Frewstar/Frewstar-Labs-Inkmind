# Fix: Direct Supabase Storage URLs for Images

## Problem
Images were not loading in the gallery due to TWO issues:
1. Components were calling `/api/designs/[id]/image` (proxy route) instead of using direct Supabase Storage URLs
2. **CSS Issue**: `absolute inset-0` positioning collapsed images to 0x0 when parent had no explicit dimensions

## Root Cause
Two server-side components were building proxy API URLs instead of resolving direct Supabase Storage URLs:

1. **`app/api/designs/route.ts`** (GET endpoint, line 51)
2. **`app/(studio)/[slug]/page.tsx`** (Studio admin page, line 82)

Both were using:
```typescript
imageUrl: `/api/designs/${d.id}/image`
```

Instead of resolving the actual storage URL like:
```
http://127.0.0.1:54321/storage/v1/object/public/generated-designs/[user-id]/[filename]
```

## Solution

### Files Changed

#### 1. `app/api/designs/route.ts`
- **Added import**: `import { resolveStorageUrl } from "@/lib/supabase-storage";`
- **Changed image URL resolution** (lines 49-67):
  - Now properly cleans the raw `image_url` from database (removes line breaks, trailing brackets)
  - Uses `resolveStorageUrl()` to get the full Supabase Storage URL
  - Validates that resolved URL is a proper HTTP URL
  - Added debug logging to track resolved URLs

**Before:**
```typescript
const hasImage = !!(d.image_url?.trim());
const imageUrl = hasImage ? `/api/designs/${d.id}/image` : "";
```

**After:**
```typescript
const raw = (d.image_url ?? "")
  .replace(/\r\n?|\n/g, "")
  .trim()
  .replace(/\]+$/, "")
  .trim();
const hasImage = !!raw && !raw.startsWith("blob:");
let imageUrl = "";
if (hasImage) {
  try {
    const resolved = resolveStorageUrl(supabase, raw) ?? "";
    if (resolved.startsWith("http") || resolved.includes("/storage/")) {
      imageUrl = resolved;
      console.log(`[API /designs] Design ${d.id}:`, { raw, resolved: imageUrl });
    }
  } catch {
    imageUrl = "";
  }
}
```

#### 2. `app/(studio)/[slug]/page.tsx`
- **Changed design mapping** (lines 79-90):
  - Now uses same image URL resolution logic as the API route
  - Properly resolves storage URLs for main image, reference image, and final image
  - Added proper error handling

**Before:**
```typescript
const designItems = designs.map((d) => ({
  id: d.id,
  prompt: d.prompt ?? "",
  imageUrl: d.image_url?.trim() ? `/api/designs/${d.id}/image` : null,
  // ...
}));
```

**After:**
```typescript
const designItems = designs.map((d) => {
  const raw = (d.image_url ?? "")
    .replace(/\r\n?|\n/g, "")
    .trim()
    .replace(/\]+$/, "")
    .trim();
  const hasImage = !!raw && !raw.startsWith("blob:");
  let imageUrl: string | null = null;
  if (hasImage) {
    try {
      const resolved = resolveStorageUrl(supabase, raw) ?? "";
      if (resolved.startsWith("http") || resolved.includes("/storage/")) {
        imageUrl = resolved;
      }
    } catch {
      imageUrl = null;
    }
  }
  return {
    id: d.id,
    prompt: d.prompt ?? "",
    imageUrl,
    // ...
  };
});
```

#### 3. `Components/DesignGalleryServer.tsx`
- **Added debug logging** (line 61):
  - Added console.log to help track resolved URLs during development

### Files Verified (Already Correct)

These files were already using direct `imageUrl` props correctly:

- ✅ `Components/DesignGalleryCard.tsx` - Uses `design.imageUrl` directly (lines 179, 206)
- ✅ `Components/TattooDesignImage.tsx` - Passes through `src` prop directly
- ✅ `Components/DesignGalleryClient.tsx` - Passes designs through to card component
- ✅ `Components/HomeContent.tsx` - Uses server component slot pattern

## How It Works Now

### Data Flow
1. **Database** stores image paths like:
   - Full URL: `http://127.0.0.1:54321/storage/v1/object/public/generated-designs/...`
   - Path only: `generated-designs/user-id/file.png`

2. **Server Components** (`DesignGalleryServer`, API route, Studio page):
   - Fetch designs from database
   - Call `resolveStorageUrl(supabase, raw_url)` to:
     - Normalize full URLs to use current `NEXT_PUBLIC_SUPABASE_URL`
     - Convert path-only to full public URLs
   - Pass resolved full URL as `imageUrl` prop

3. **Client Components** (`DesignGalleryCard`):
   - Receive `design.imageUrl` as a full, ready-to-use URL
   - Pass directly to `<img src={design.imageUrl}>` or `<Image src={design.imageUrl}>`

### Storage URL Resolution (`lib/supabase-storage.ts`)

The `resolveStorageUrl()` function handles three cases:

1. **Full Supabase Storage URL**: 
   - Input: `https://xxx.supabase.co/storage/v1/object/public/bucket/path`
   - Output: Normalizes to current env base: `http://127.0.0.1:54321/storage/v1/object/public/bucket/path`

2. **Path-only (bucket/path)**:
   - Input: `generated-designs/user-id/file.png`
   - Output: Builds full URL: `http://127.0.0.1:54321/storage/v1/object/public/generated-designs/user-id/file.png`

3. **Invalid/empty**:
   - Returns `null`

## Testing

### Check Dev Console
With the debug logs added, you should see output like:
```
[DesignGalleryServer] Design abc123: {
  raw: 'http://127.0.0.1:54321/storage/v1/object/public/generated-designs/user-id/file.png',
  resolved: 'http://127.0.0.1:54321/storage/v1/object/public/generated-designs/user-id/file.png'
}
[API /designs] Design abc123: {
  raw: 'generated-designs/user-id/file.png',
  resolved: 'http://127.0.0.1:54321/storage/v1/object/public/generated-designs/user-id/file.png'
}
```

### Check Network Tab
Images should now load directly from:
```
http://127.0.0.1:54321/storage/v1/object/public/generated-designs/...
```

Instead of failing proxy requests to:
```
http://localhost:3000/api/designs/[id]/image (500 error)
```

### Verify in Browser
1. Open `http://localhost:3000` and sign in
2. Navigate to "My Designs" section
3. Check browser DevTools:
   - **Network tab**: Image requests should go directly to `127.0.0.1:54321/storage/...`
   - **Console tab**: Should show debug logs with resolved URLs
4. Images should load successfully

## Local Supabase Configuration

Ensure your `.env.local` has:
```env
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

And Supabase is running:
```bash
npx supabase start
npx supabase status
```

## Notes

- The `/api/designs/[id]/image` proxy route still exists but should no longer be called for gallery images
- It may still be used for other purposes (e.g., authenticated image streaming, data URLs)
- Direct storage URLs work because:
  - Local Supabase storage bucket `generated-designs` is configured as public
  - Client can fetch directly without authentication for public buckets
  - RLS policies protect the `designs` table but not the public storage bucket

### 3. `components/DesignGalleryCard.tsx` - **Fixed CSS Issue**
The critical fix was removing `absolute inset-0` positioning from the `<img>` tag:

**Problem:**
```typescript
<div className="aspect-square relative bg-[var(--bg)]">  // Parent with no explicit height
  <img className="absolute inset-0 w-full h-full" />  // Collapses to 0x0
</div>
```

**Solution:**
```typescript
<div className="relative bg-[var(--bg)]" style={{ width: '100%', paddingTop: '100%' }}>
  <div className="absolute inset-0 flex items-center justify-center">
    <img 
      src={design.imageUrl} 
      className="w-full h-full object-contain"  // No absolute positioning
    />
  </div>
</div>
```

The fix uses `paddingTop: 100%` to create a square aspect ratio container, then positions the image wrapper absolutely inside it. The image itself uses normal block layout with `w-full h-full` which allows it to properly size within its container.

## Related Files

- `lib/supabase-storage.ts` - Storage URL resolution utilities
- `.env.local` - Local Supabase connection config
- `docs/LOCAL_SUPABASE_IMAGES.md` - Original setup documentation

## Key Learnings

1. **Always ensure Supabase is running** (`npx supabase start`) before testing local storage
2. **CSS absolute positioning** requires explicit parent dimensions - `aspect-square` alone isn't enough
3. **Use paddingTop percentage hack** for aspect ratio containers: `paddingTop: '100%'` creates a square
4. **Direct storage URLs are faster** than proxy routes and avoid CORS issues
