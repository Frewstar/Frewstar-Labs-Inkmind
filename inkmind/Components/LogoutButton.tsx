"use client";

import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";

type Props = {
  className?: string;
  children?: React.ReactNode;
};

export default function LogoutButton({ className, children }: Props) {
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      className={className}
      aria-label="Log out"
    >
      {children ?? "Log out"}
    </button>
  );
}
