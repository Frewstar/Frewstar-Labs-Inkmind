"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { updateStudioRossSettings } from "@/app/admin/actions";
import { getRossAdvice } from "@/app/actions/ross";
import HelpTooltip from "@/components/HelpTooltip";
import { StyleStrengthSlider, STYLE_STRENGTH_DEFAULT } from "@/components/StyleStrengthSlider";

const studioRossSchema = z.object({
  aiName: z.string().min(2, "Name must be at least 2 characters."),
  voiceTone: z.string(),
  personality: z.string().max(500, "Max 500 characters."),
  specialties: z.string().describe("Comma-separated list of tattoo styles"),
  styleAdherence: z.number().min(1.5).max(5).default(STYLE_STRENGTH_DEFAULT),
});

export type StudioRossFormValues = z.infer<typeof studioRossSchema>;

const DEFAULTS = {
  aiName: "Ross",
  voiceTone: "Professional",
  personality: "",
  specialties: "",
};

function isDefault(field: keyof StudioRossFormValues, value: string): boolean {
  const d = DEFAULTS[field];
  if (field === "specialties" || field === "personality") return value.trim() === d;
  return (value.trim() || d) === d;
}

type StyleSettingsProps = {
  slug: string;
  studioId: string;
  studioName: string;
  initialData: {
    ai_name: string | null;
    artist_voice_tone: string | null;
    ai_personality_prompt: string | null;
    studio_specialties: string[];
    style_adherence: number | null;
  };
};

export default function StyleSettings({
  slug,
  studioId,
  studioName,
  initialData,
}: StyleSettingsProps) {
  const router = useRouter();
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [previewMessage, setPreviewMessage] = useState("");
  const [previewResult, setPreviewResult] = useState<{
    improvedPrompt?: string;
    suggestions?: string[];
    longevityAlert?: string | null;
  } | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  const form = useForm<StudioRossFormValues>({
    resolver: zodResolver(studioRossSchema),
    defaultValues: {
      aiName: initialData.ai_name ?? "",
      voiceTone: initialData.artist_voice_tone ?? "",
      personality: initialData.ai_personality_prompt ?? "",
      specialties: Array.isArray(initialData.studio_specialties)
        ? initialData.studio_specialties.join(", ")
        : "",
      styleAdherence:
        initialData.style_adherence ?? STYLE_STRENGTH_DEFAULT,
    },
  });

  const watched = form.watch();

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  async function onSubmit(values: StudioRossFormValues) {
    const result = await updateStudioRossSettings(slug, {
      aiName: values.aiName,
      voiceTone: values.voiceTone,
      personality: values.personality,
      specialties: values.specialties,
      styleAdherence: values.styleAdherence,
    });
    if (result.success) {
      setToast({ type: "success", message: "Ross's DNA has been updated." });
      router.refresh();
    } else {
      setToast({ type: "error", message: result.error ?? "Failed to save." });
    }
  }

  async function runPreview() {
    const msg = previewMessage.trim();
    if (!msg) {
      setPreviewError("Enter a test message.");
      return;
    }
    setPreviewError(null);
    setPreviewResult(null);
    setPreviewLoading(true);
    const values = form.getValues();
    const overrides = {
      name: studioName,
      ai_name: values.aiName.trim() || null,
      artist_voice_tone: values.voiceTone.trim() || null,
      ai_personality_prompt: values.personality.trim() || null,
      studio_specialties: values.specialties
        .split(/[\n,]+/)
        .map((t) => t.trim())
        .filter(Boolean),
    };
    const result = await getRossAdvice(msg, studioId, overrides);
    setPreviewLoading(false);
    if (result.error) {
      setPreviewError(result.error);
      return;
    }
    if (result.data) setPreviewResult(result.data);
  }

  function FieldBadge({ field }: { field: keyof StudioRossFormValues }) {
    const value = watched[field] ?? "";
    const custom = !isDefault(field, value);
    return (
      <span
        className={`ml-2 inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium ${
          custom
            ? "bg-[var(--gold)]/20 text-[var(--gold)] border border-[var(--gold)]/40"
            : "bg-white/10 text-[var(--grey)] border border-white/10"
        }`}
      >
        {custom ? "Custom" : "Default"}
      </span>
    );
  }

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

      <div className="flex flex-col lg:flex-row lg:gap-8 lg:items-start">
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-6 flex-1 max-w-2xl"
          style={{ fontFamily: "var(--font-body)" }}
        >
          <div className="rounded-[var(--radius-lg)] border border-white/10 bg-[var(--bg-card)] p-5 space-y-4">
            <h2 className="text-sm font-semibold text-[var(--white)] border-b border-white/10 pb-2">
              Artist Twin (Ross) DNA
            </h2>
            <p className="text-xs text-[var(--grey)]">
              These variables build the dynamic system prompt. Focus over features.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="aiName" className="flex items-center text-xs font-medium text-[var(--grey)] mb-1">
                  AI Twin Name
                  <FieldBadge field="aiName" />
                </label>
                <input
                  id="aiName"
                  placeholder="Ross"
                  className="studio-settings-input"
                  maxLength={64}
                  {...form.register("aiName")}
                />
                {form.formState.errors.aiName && (
                  <p className="mt-1 text-xs text-[var(--red)]">
                    {form.formState.errors.aiName.message}
                  </p>
                )}
              </div>
              <div>
                <label htmlFor="voiceTone" className="flex items-center text-xs font-medium text-[var(--grey)] mb-1">
                  Voice Tone
                  <FieldBadge field="voiceTone" />
                </label>
                <input
                  id="voiceTone"
                  placeholder="Encouraging & Technical"
                  className="studio-settings-input"
                  {...form.register("voiceTone")}
                />
              </div>
            </div>

            <div>
              <label htmlFor="personality" className="flex items-center text-xs font-medium text-[var(--grey)] mb-1">
                AI Personality & Philosophy
                <HelpTooltip
                  text="The more specific you are, the better Ross will defend your technical standards."
                  label="Learn more about Personality"
                />
                <FieldBadge field="personality" />
              </label>
              <textarea
                id="personality"
                placeholder="Tell Ross how to behave. Mention your studio's values."
                className="studio-settings-input min-h-[80px] resize-y w-full"
                maxLength={500}
                {...form.register("personality")}
              />
              <p className="mt-1 text-xs text-[var(--grey)]">
                Guides Ross&apos;s advice during consultations. Max 500 characters.
              </p>
              {form.formState.errors.personality && (
                <p className="mt-1 text-xs text-[var(--red)]">
                  {form.formState.errors.personality.message}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="specialties" className="flex items-center text-xs font-medium text-[var(--grey)] mb-1">
                Specialties
                <HelpTooltip
                  text="Used for longevity alerts and gently steering clients toward your styles."
                  label="Learn more about Specialties"
                />
                <FieldBadge field="specialties" />
              </label>
              <input
                id="specialties"
                placeholder="e.g. Blackwork, Fine-line, Neo-traditional"
                className="studio-settings-input"
                {...form.register("specialties")}
              />
              <p className="mt-1 text-xs text-[var(--grey)]">
                Comma-separated list of tattoo styles.
              </p>
            </div>

            <StyleStrengthSlider
              value={form.watch("styleAdherence") ?? STYLE_STRENGTH_DEFAULT}
              onChange={(v) => form.setValue("styleAdherence", v, { shouldDirty: true })}
              disabled={form.formState.isSubmitting}
            />

            <button
              type="submit"
              disabled={form.formState.isSubmitting}
              className="w-full min-h-[var(--touch-min)] rounded-[var(--radius)] bg-[var(--gold)] px-4 py-3 font-medium text-[var(--bg)] transition hover:bg-[var(--gold)]/90 focus:outline-none focus:ring-2 focus:ring-[var(--gold)] focus:ring-offset-2 focus:ring-offset-[var(--bg)] disabled:opacity-70 disabled:pointer-events-none sm:w-auto"
            >
              {form.formState.isSubmitting ? "Saving…" : "Update Artist Twin"}
            </button>
          </div>
        </form>

        <div className="mt-8 lg:mt-0 lg:w-80 shrink-0">
          <div className="rounded-[var(--radius-lg)] border border-white/10 bg-[var(--bg-card)] p-4 space-y-3 sticky top-4">
            <h3 className="text-xs font-semibold text-[var(--white)] border-b border-white/10 pb-2">
              Chat Preview
            </h3>
            <p className="text-[11px] text-[var(--grey)]">
              Send a test message to see how Ross responds with your current settings (unsaved changes apply).
            </p>
            <input
              type="text"
              placeholder="e.g. I want a rose on my forearm"
              value={previewMessage}
              onChange={(e) => setPreviewMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && runPreview()}
              className="studio-settings-input text-sm"
            />
            <button
              type="button"
              onClick={runPreview}
              disabled={previewLoading}
              className="w-full rounded-[var(--radius)] bg-white/10 px-3 py-2 text-xs font-medium text-[var(--white)] hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-[var(--gold)] disabled:opacity-60"
            >
              {previewLoading ? "…" : "Preview reply"}
            </button>
            {previewError && (
              <p className="text-xs text-[var(--red)]">{previewError}</p>
            )}
            {previewResult && (
              <div className="space-y-2 text-xs border-t border-white/10 pt-2">
                <p className="text-[var(--grey)] font-medium">Improved prompt</p>
                <p className="text-[var(--white)]">{previewResult.improvedPrompt}</p>
                {previewResult.suggestions && previewResult.suggestions.length > 0 && (
                  <>
                    <p className="text-[var(--grey)] font-medium mt-2">Suggestions</p>
                    <ul className="list-disc list-inside text-[var(--white)] space-y-0.5">
                      {previewResult.suggestions.map((s, i) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ul>
                  </>
                )}
                {previewResult.longevityAlert && (
                  <>
                    <p className="text-[var(--grey)] font-medium mt-2">Tip</p>
                    <p className="text-amber-400/90">{previewResult.longevityAlert}</p>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
