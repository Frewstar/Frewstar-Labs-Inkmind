"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { updateStudioSettings, type UpdateStudioSettingsResult } from "@/app/admin/actions";

type StudioSettingsFormProps = {
  slug: string;
  initial: {
    logo_url: string | null;
    instagram_url: string | null;
    facebook_url: string | null;
    contact_email: string | null;
    contact_phone: string | null;
    address: string | null;
  };
};

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full min-h-[var(--touch-min)] rounded-[var(--radius)] bg-[var(--gold)] px-4 py-3 font-medium text-[var(--bg)] transition hover:bg-[var(--gold)]/90 focus:outline-none focus:ring-2 focus:ring-[var(--gold)] focus:ring-offset-2 focus:ring-offset-[var(--bg)] disabled:opacity-70 disabled:pointer-events-none"
    >
      {pending ? "Saving…" : "Save changes"}
    </button>
  );
}

export default function StudioSettingsForm({ slug, initial }: StudioSettingsFormProps) {
  const router = useRouter();
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(initial.logo_url);
  const [state, formAction] = useActionState(
    async (_prev: UpdateStudioSettingsResult, formData: FormData) => {
      return updateStudioSettings(slug, formData);
    },
    {}
  );

  useEffect(() => {
    if (state?.success) {
      setToast({ type: "success", message: "Profile Updated" });
      setLogoPreview(null);
      router.refresh();
    }
    if (state?.error) setToast({ type: "error", message: state.error });
  }, [state, router]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  return (
    <div className="relative">
      {toast && (
        <div
          role="alert"
          className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-[var(--radius)] text-sm font-medium shadow-lg ${
            toast.type === "success"
              ? "bg-emerald-600/95 text-white"
              : "bg-[var(--red)]/95 text-white"
          }`}
          style={{ marginTop: "var(--safe-top)" }}
        >
          {toast.message}
        </div>
      )}

      <form action={formAction} className="space-y-4" encType="multipart/form-data">
        <div className="rounded-[var(--radius-lg)] border border-white/10 bg-[var(--bg-card)] p-5 space-y-4">
          <h2 className="text-sm font-semibold text-[var(--white)] border-b border-white/10 pb-2">
            Logo
          </h2>
          <div>
            <label htmlFor="logo" className="block text-xs font-medium text-[var(--grey)] mb-1">
              Studio logo
            </label>
            <div className="flex items-start gap-4">
              {(logoPreview ?? initial.logo_url) && (
                <div className="h-16 w-16 rounded-[var(--radius)] border border-white/15 bg-[var(--bg)] overflow-hidden flex-shrink-0">
                  <img
                    src={logoPreview ?? initial.logo_url ?? ""}
                    alt="Studio logo preview"
                    className="h-full w-full object-contain"
                  />
                </div>
              )}
              <input
                id="logo"
                name="logo"
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                className="studio-settings-input text-sm file:mr-2 file:rounded file:border-0 file:bg-[var(--gold)] file:px-3 file:py-1.5 file:text-[var(--bg)] file:text-sm"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) setLogoPreview(URL.createObjectURL(file));
                }}
              />
            </div>
            <p className="mt-1 text-xs text-[var(--grey)]">
              PNG, JPEG, WebP or SVG. Max 2MB. Saved as logos/[studio]/logo.
            </p>
          </div>
        </div>

        <div className="rounded-[var(--radius-lg)] border border-white/10 bg-[var(--bg-card)] p-5 space-y-4">
          <h2 className="text-sm font-semibold text-[var(--white)] border-b border-white/10 pb-2">
            Contact & social
          </h2>
          <div>
            <label htmlFor="instagram_url" className="block text-xs font-medium text-[var(--grey)] mb-1">
              Instagram
            </label>
            <input
              id="instagram_url"
              name="instagram_url"
              type="url"
              placeholder="https://instagram.com/..."
              defaultValue={initial.instagram_url ?? ""}
              className="studio-settings-input"
            />
          </div>
          <div>
            <label htmlFor="facebook_url" className="block text-xs font-medium text-[var(--grey)] mb-1">
              Facebook
            </label>
            <input
              id="facebook_url"
              name="facebook_url"
              type="url"
              placeholder="https://facebook.com/..."
              defaultValue={initial.facebook_url ?? ""}
              className="studio-settings-input"
            />
          </div>
          <div>
            <label htmlFor="contact_email" className="block text-xs font-medium text-[var(--grey)] mb-1">
              Email
            </label>
            <input
              id="contact_email"
              name="contact_email"
              type="email"
              placeholder="studio@example.com"
              defaultValue={initial.contact_email ?? ""}
              className="studio-settings-input"
            />
          </div>
          <div>
            <label htmlFor="contact_phone" className="block text-xs font-medium text-[var(--grey)] mb-1">
              Phone
            </label>
            <input
              id="contact_phone"
              name="contact_phone"
              type="tel"
              placeholder="+1 234 567 8900"
              defaultValue={initial.contact_phone ?? ""}
              className="studio-settings-input"
            />
          </div>
          <div>
            <label htmlFor="address" className="block text-xs font-medium text-[var(--grey)] mb-1">
              Address
            </label>
            <textarea
              id="address"
              name="address"
              rows={2}
              placeholder="123 Main St, City, State"
              defaultValue={initial.address ?? ""}
              className="studio-settings-input min-h-[60px] resize-y"
            />
          </div>
        </div>

        <SaveButton />
      </form>
    </div>
  );
}
