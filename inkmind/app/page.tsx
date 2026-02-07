import Link from "next/link";
import HomeContent from "@/components/HomeContent";
import DesignGalleryServer from "@/components/DesignGalleryServer";
import LogoutButton from "@/components/LogoutButton";
import { createClient } from "@/utils/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <HomeContent
      designGallerySlot={<DesignGalleryServer />}
      signedInAs={user?.email ?? user?.id ?? null}
      signedInUserId={user?.id ?? null}
      authNav={
        user ? (
          <LogoutButton className="nav-auth">
            Sign out
          </LogoutButton>
        ) : (
          <Link href="/login" className="nav-auth">
            Sign in
          </Link>
        )
      }
    />
  );
}
