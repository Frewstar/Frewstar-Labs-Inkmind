import type { NextConfig } from "next";
import path from "path";
import { config } from "dotenv";

// Load .env.example as fallback so Design Studio can use it for testing when .env.local is missing
config({ path: path.join(process.cwd(), ".env.example"), override: false });

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "picsum.photos", port: "", pathname: "/**" },
      { protocol: "https", hostname: "*.cdninstagram.com", port: "", pathname: "/**" },
      { protocol: "https", hostname: "*.fbcdn.net", port: "", pathname: "/**" },
      { protocol: "https", hostname: "images.unsplash.com", port: "", pathname: "/**" },
    ],
  },
};

export default nextConfig;
