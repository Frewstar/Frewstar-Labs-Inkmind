import BodyThemeInjector from "@/components/BodyThemeInjector";
import { getStudioBySubdomain } from "@/lib/studios";
import Link from "next/link";

type Props = {
  children: React.ReactNode;
  params: Promise<{ subdomain: string }>;
};

export default async function StudioLayout({ children, params }: Props) {
  const { subdomain } = await params;
  const studio = getStudioBySubdomain(subdomain);

  return (
    <>
      <BodyThemeInjector
        brandColor={studio.brandColor}
        accentColor={studio.accentColor}
      />
      <nav>
        <Link href="/" className="nav-logo">
          <img
            src={studio.logoUrl}
            alt={studio.name}
            className="nav-logo-img"
          />
        </Link>
        <div className="nav-links">
          <Link href="/">Studio</Link>
          <Link href="/#book">Book</Link>
        </div>
      </nav>
      {children}
    </>
  );
}
