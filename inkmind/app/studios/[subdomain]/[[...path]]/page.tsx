import type { Metadata } from "next";

type Props = {
  params: Promise<{ subdomain: string; path?: string[] }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { subdomain } = await params;
  const title = `${subdomain} | Frewstar Labs`;
  return { title };
}

export default async function StudioPage({ params }: Props) {
  const { subdomain, path } = await params;
  const pathSegments = path ?? [];

  return (
    <div className="studio-tenant-page" style={{ padding: "2rem", minHeight: "100vh" }}>
      <header style={{ marginBottom: "1.5rem" }}>
        <h1 style={{ fontFamily: "var(--font-head)", fontSize: "1.75rem" }}>
          {subdomain}
        </h1>
        <p style={{ color: "var(--grey)", fontSize: "0.9rem" }}>
          Studio tenant page
          {pathSegments.length > 0 && ` — path: /${pathSegments.join("/")}`}
        </p>
      </header>
      <p style={{ color: "var(--grey)" }}>
        Content for <strong>{subdomain}</strong> will go here. Use this route to show
        studio-specific branding, portfolio, and design studio.
      </p>
    </div>
  );
}
