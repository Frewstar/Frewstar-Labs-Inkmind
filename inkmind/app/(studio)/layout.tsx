import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export default async function StudioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();

  if (!authUser?.id) {
    redirect("/login");
  }

  return (
    <div
      style={{
        background: "var(--bg)",
        paddingTop: "var(--safe-top)",
        paddingBottom: "var(--safe-bottom)",
      }}
    >
      {children}
    </div>
  );
}
