// lib/google-auth.ts
import { GoogleAuth } from "google-auth-library";

export async function getAccessToken() {
  const projectId = process.env.GCP_PROJECT_ID;
  const clientEmail = process.env.GCP_CLIENT_EMAIL;
  let privateKey = process.env.GCP_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error("Missing Vertex AI Service Account credentials in environment.");
  }

  // 1. Repair the private key string
  // This replaces literal '\n' strings with actual newline characters
  // and strips any accidental wrapping quotes.
  const formattedKey = privateKey
    .replace(/\\n/g, "\n")
    .replace(/^"(.*)"$/, "$1")
    .replace(/^'(.*)'$/, "$1");

  try {
    const auth = new GoogleAuth({
      credentials: {
        client_email: clientEmail,
        private_key: formattedKey,
      },
      scopes: ["https://www.googleapis.com/auth/cloud-platform"],
    });

    const client = await auth.getClient();
    const tokenResponse = await client.getAccessToken();

    if (!tokenResponse.token) {
      throw new Error("Access token response was empty.");
    }

    return tokenResponse.token;
  } catch (error: any) {
    console.error("Vertex Auth Error:", error.message);
    throw error;
  }
}
