/**
 * Layout for /admin/super/*. Renders the active child route (studios, users, designs, etc.).
 * The index route /admin/super is handled by page.tsx which redirects to /admin/super/studios.
 */
export default function AdminSuperLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
