This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

---

## Vertex AI (High Quality / Paid tier)

The app can use **Google Vertex AI** for image generation when "High Quality" is enabled. Setup:

1. **Google Cloud project**  
   Use a project with **billing enabled** and the **Vertex AI API** enabled:  
   [Enable Vertex AI API](https://console.cloud.google.com/apis/library/aiplatform.googleapis.com)

2. **Service account**  
   Create a service account (or use an existing one) and add the role **Vertex AI User** (`roles/aiplatform.user`):  
   [IAM → Service Accounts](https://console.cloud.google.com/iam-admin/serviceaccounts)

3. **Credentials in `.env.local`** (in the `inkmind` folder):
   - `GCP_PROJECT_ID` – your Google Cloud project ID  
   - `GCP_CLIENT_EMAIL` – service account email  
   - `GCP_PRIVATE_KEY` – full private key (paste as one line; use `\n` for line breaks)  
   - Optional: `VERTEX_LOCATION` – default `global`; use e.g. `us-central1` for a specific region

4. **Auth**  
   The app uses `getAccessToken()` from `lib/google-auth.ts` (Bearer token). No API key is sent for Vertex requests.

- [Vertex AI generateContent REST API](https://cloud.google.com/vertex-ai/generative-ai/docs/reference/rest/v1/projects.locations.publishers.models/generateContent)  
- [Vertex AI authentication](https://cloud.google.com/vertex-ai/docs/authentication)
