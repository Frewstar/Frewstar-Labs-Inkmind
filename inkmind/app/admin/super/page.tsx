import { redirect } from "next/navigation";

/**
 * /admin/super → redirect to Studio Management
 */
export default function AdminSuperPage() {
  redirect("/admin/super/studios");
}
