"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import BookingModal from "./BookingModal";
import ConversationalWizard from "./ConversationalWizard";
import ImageLightbox from "./ImageLightbox";
import GenerationLoader from "./GenerationLoader";
import HistorySkeleton from "./HistorySkeleton";
import { getFirstTattooPhotos, getRandomTattooPhotos } from "@/lib/tattoo-photos";
import { promptToDownloadFilename } from "@/lib/download-filename";
import { TATTOO_STYLES } from "@/lib/tattoo-styles";
import { getRossAdvice, getRossImageReview, type RossImageReviewResponse } from "@/app/actions/ross";
import ModelSelector, { type ModelOption } from "./ModelSelector";
import TattooDesignImage from "./TattooDesignImage";

export type DesignStudioProps = {
  onOpenBooking?: () => void;
  /** When set (e.g. on studio slug page), generations are saved to this studio. */
  studioSlug?: string | null;
  /** When set, Ross assistant uses this studio's ai_name and ai_personality_prompt (white-label). */
  studioId?: string | null;
};

// ─── Saved Design Library (localStorage) ─────────────────────────────────────

const SAVED_DESIGNS_KEY = "inkmind_saved_designs_v1";
const LAST_GENERATION_KEY = "inkmind_last_generation_v1";
const COLLECTIONS_KEY = "inkmind_collections_v1";

const DEFAULT_GALLERIES: { id: string; name: string }[] = [
  { id: "general", name: "General" },
  { id: "arm", name: "Arm tattoos" },
  { id: "back", name: "Back tattoos" },
  { id: "viking", name: "Viking tattoos" },
];

export type Gallery = { id: string; name: string };

export type SavedDesign = {
  id: string;
  prompt: string;
  style: string;
  image: string;
  date: string;
  collectionId?: string | null;
};

function loadDesignLibrary(): SavedDesign[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(SAVED_DESIGNS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    const arr = Array.isArray(parsed) ? parsed : [];
    return arr.map((item: SavedDesign) => ({
      ...item,
      collectionId: item.collectionId ?? null,
    }));
  } catch {
    return [];
  }
}

function saveDesignLibrary(items: SavedDesign[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(SAVED_DESIGNS_KEY, JSON.stringify(items));
  } catch (e) {
    // QuotaExceededError when images are large (e.g. base64); don't overwrite existing data
    if (e instanceof DOMException && e.name === "QuotaExceededError") {
      console.warn("[InkMind] Design library too large to save; use Download on favorites to keep them.");
    }
  }
}

function loadCollections(): Gallery[] {
  if (typeof window === "undefined") return DEFAULT_GALLERIES;
  try {
    const raw = localStorage.getItem(COLLECTIONS_KEY);
    if (!raw) return DEFAULT_GALLERIES;
    const parsed = JSON.parse(raw);
    const arr = Array.isArray(parsed) ? parsed : [];
    return arr.length > 0 ? arr : DEFAULT_GALLERIES;
  } catch {
    return DEFAULT_GALLERIES;
  }
}

function saveCollections(collections: Gallery[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(COLLECTIONS_KEY, JSON.stringify(collections));
  } catch {
    // ignore
  }
}

type LastGeneration = { designs: string[]; prompt: string; style: string };

function loadLastGeneration(): LastGeneration | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(LAST_GENERATION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || !Array.isArray((parsed as LastGeneration).designs)) return null;
    const { designs, prompt, style } = parsed as LastGeneration;
    if (designs.length === 0) return null;
    return { designs, prompt: String(prompt ?? ""), style: String(style ?? "") };
  } catch {
    return null;
  }
}

function saveLastGeneration(designs: string[], prompt: string, style: string) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LAST_GENERATION_KEY, JSON.stringify({ designs, prompt, style }));
  } catch {
    // quota or parse error — ignore
  }
}

// ─── DATA ────────────────────────────────────────────────────────────────────

// Artist style presets (keywords injected in app/api/generate)

const CARD_BG = [
  "radial-gradient(ellipse at 30% 70%, #1a1205 0%, #0e0e0e 60%)",
  "radial-gradient(ellipse at 70% 30%, #0f1a1a 0%, #0e0e0e 60%)",
  "radial-gradient(ellipse at 50% 80%, #1a0f0f 0%, #0e0e0e 60%)",
  "radial-gradient(ellipse at 20% 40%, #151a0f 0%, #0e0e0e 60%)",
];

const PLACEMENT_OPTIONS = [
  "Forearm", "Upper Arm", "Chest", "Back", "Thigh", "Shoulder", "Calf",
];

const LOADING_STATUSES = [
  "Analyzing Reference...",
  "Drafting Linework...",
  "Applying Whip-Shading...",
  "Finalizing 2K Render...",
];

// ─── ICONS ───────────────────────────────────────────────────────────────────

function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 14, height: 14 }}>
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 16, height: 16 }}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

function RefIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 16, height: 16 }}>
      <rect x="3" y="3" width="14" height="14" rx="2" />
      <path d="M21 15v2a2 2 0 0 1-2 2h-5" />
      <path d="M15 9l3 3 3-3" />
    </svg>
  );
}

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg 
      viewBox="0 0 24 24" 
      fill={filled ? "currentColor" : "none"} 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      style={{ width: 16, height: 16 }}
    >
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

// ─── COMPONENT ───────────────────────────────────────────────────────────────

export default function DesignStudio({ onOpenBooking: externalOpenBooking, studioSlug, studioId }: DesignStudioProps = {}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [selectedStyle, setSelectedStyle] = useState("fine-line");
  const [designCount, setDesignCount] = useState(4); // New: adjustable count
  const [designs, setDesigns] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorConsoleUrl, setErrorConsoleUrl] = useState<string | null>(null);
  const [model, setModel] = useState<ModelOption>("basic"); // basic = Schnell, standard = Gemini, high = Vertex
  const [isManualMode, setIsManualMode] = useState(false); // Manual prompt vs Wizard
  const [manualPrompt, setManualPrompt] = useState("");
  const [manualPlacement, setManualPlacement] = useState("Forearm");
  const [lastWizardPrompt, setLastWizardPrompt] = useState(""); // Pre-fill when ejecting from wizard
  const [lastWizardPlacement, setLastWizardPlacement] = useState<string | null>(null);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [designLibrary, setDesignLibrary] = useState<SavedDesign[]>([]);
  const [collections, setCollections] = useState<Gallery[]>([]);
  const [selectedCollectionId, setSelectedCollectionId] = useState<string>("general");
  const [filterCollectionId, setFilterCollectionId] = useState<string | null>(null);
  const [lastGenerationPrompt, setLastGenerationPrompt] = useState("");
  const [lastGenerationStyle, setLastGenerationStyle] = useState(selectedStyle);
  const [savedInSession, setSavedInSession] = useState<Set<number>>(new Set()); // which current gallery indices were saved this session
  const [refImage, setRefImage] = useState<string | null>(null);
  /** When ref was loaded from "Branch off" (?parent_id=), send this so the new design gets parent_id saved. */
  const [branchFromDesignId, setBranchFromDesignId] = useState<string | null>(null);
  /** Img2Img strength 0.1–1.0: lower = stay closer to reference, higher = more freedom. Only used when refImage is set. */
  const [referenceStrength, setReferenceStrength] = useState(0.5);
  /** FLUX Style Adherence 1.5–5.0: only used when model is Basic (Schnell). Sent as styleStrength to API. */
  const [styleStrength, setStyleStrength] = useState(3.0);
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);
  const [loadingStatusIndex, setLoadingStatusIndex] = useState(0);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [placeholderImages, setPlaceholderImages] = useState<string[]>(() => getFirstTattooPhotos(6));
  const [hasMounted, setHasMounted] = useState(false);
  const [newGalleryName, setNewGalleryName] = useState("");
  // Ross Assistant: suggestions + longevity tip (debounced 2s after user stops typing)
  const [rossSuggestions, setRossSuggestions] = useState<string[]>([]);
  const [rossLongevityAlert, setRossLongevityAlert] = useState<string | null>(null);
  const [rossLoading, setRossLoading] = useState(false);
  const [rossError, setRossError] = useState<string | null>(null);
  // Ross image review (Help mode): fixes for the selected generated image
  const [rossReviewFixes, setRossReviewFixes] = useState<RossImageReviewResponse | null>(null);
  const [rossReviewLoading, setRossReviewLoading] = useState(false);
  const [rossReviewError, setRossReviewError] = useState<string | null>(null);
  /** Index of the design that was reviewed (so Apply Fixes uses that image as ref). */
  const [rossReviewedImageIndex, setRossReviewedImageIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const refFileRef = useRef<File | null>(null);
  const promptSectionRef = useRef<HTMLDivElement>(null);
  const tweakLoadedRef = useRef<string | null>(null);
  const parentIdLoadedRef = useRef<string | null>(null);
  const hasRestoredLibraryRef = useRef(false);

  const useExternalBooking = !!externalOpenBooking;
  const openBookingModal = useExternalBooking ? externalOpenBooking! : () => setBookingModalOpen(true);
  const closeBookingModal = () => setBookingModalOpen(false);

  const showPlaceholders = designs.length === 0;

  // Filter design library by selected gallery (null = All)
  const filteredDesignLibrary = useMemo(() => {
    if (filterCollectionId == null) return designLibrary;
    return designLibrary.filter(
      (d) => d.collectionId === filterCollectionId || (d.collectionId == null && filterCollectionId === "general")
    );
  }, [designLibrary, filterCollectionId]);

  // Persist design library when it changes — skip until after restore so we don't overwrite with [] on load or in Strict Mode
  useEffect(() => {
    if (!hasRestoredLibraryRef.current) return;
    saveDesignLibrary(designLibrary);
  }, [designLibrary]);
  useEffect(() => {
    if (collections.length > 0) saveCollections(collections);
  }, [collections]);

  // Status stepper: cycle through loading statuses every 7 seconds
  useEffect(() => {
    if (!loading) {
      setLoadingStatusIndex(0);
      return;
    }
    const interval = setInterval(() => {
      setLoadingStatusIndex((i) => (i + 1) % LOADING_STATUSES.length);
    }, 7000);
    return () => clearInterval(interval);
  }, [loading]);

  // After mount: restore design library, last generation; show skeleton briefly. Reset ref on unmount so Strict Mode doesn't wipe localStorage.
  const SKELETON_MIN_MS = 500;
  useEffect(() => {
    setDesignLibrary(loadDesignLibrary());
    hasRestoredLibraryRef.current = true;
    const last = loadLastGeneration();
    if (last?.designs?.length) {
      setDesigns(last.designs);
      setLastGenerationPrompt(last.prompt);
      setLastGenerationStyle(last.style);
    }
    const t = setTimeout(() => setHasMounted(true), SKELETON_MIN_MS);
    return () => {
      clearTimeout(t);
      hasRestoredLibraryRef.current = false;
    };
  }, []);

  // Refresh placeholder images every 60 seconds when showing placeholders (client-only)
  useEffect(() => {
    if (!hasMounted || !showPlaceholders) return;
    setPlaceholderImages(getRandomTattooPhotos(6));
    const interval = setInterval(() => {
      setPlaceholderImages(getRandomTattooPhotos(6));
    }, 60000);
    return () => clearInterval(interval);
  }, [hasMounted, showPlaceholders]);

  // Ross Assistant: when user stops typing for 2s in manual prompt, fetch suggestions + longevity tip
  useEffect(() => {
    if (!isManualMode) {
      setRossSuggestions([]);
      setRossLongevityAlert(null);
      setRossError(null);
      return;
    }
    const trimmed = manualPrompt.trim();
    if (trimmed.length < 2) {
      setRossSuggestions([]);
      setRossLongevityAlert(null);
      setRossError(null);
      return;
    }
    const t = setTimeout(() => {
      setRossLoading(true);
      setRossError(null);
      getRossAdvice(trimmed, studioId ?? undefined)
        .then((result) => {
          if (result.error) {
            setRossError(result.error);
            setRossSuggestions([]);
            setRossLongevityAlert(null);
            return;
          }
          if (result.data) {
            setRossSuggestions(result.data.suggestions ?? []);
            setRossLongevityAlert(result.data.longevityAlert ?? null);
          }
        })
        .finally(() => setRossLoading(false));
    }, 2000);
    return () => clearTimeout(t);
  }, [isManualMode, manualPrompt]);

  // Load design from "Tweak this Design" (?tweak=id) — My Designs gallery
  useEffect(() => {
    const tweakId = searchParams.get("tweak");
    if (!tweakId || tweakLoadedRef.current === tweakId) return;
    tweakLoadedRef.current = tweakId;
    fetch(`/api/designs/${tweakId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((design: { prompt?: string; imageUrl?: string } | null) => {
        if (!design?.prompt) return;
        setIsManualMode(true);
        setManualPrompt(design.prompt);
        if (design.imageUrl) setRefImage(design.imageUrl);
        document.getElementById("studio")?.scrollIntoView({ behavior: "smooth" });
        const next = new URLSearchParams(searchParams.toString());
        next.delete("tweak");
        const path = next.toString() ? `/?${next.toString()}` : "/";
        router.replace(path, { scroll: false });
      })
      .catch(() => {})
      .finally(() => {
        tweakLoadedRef.current = null;
      });
  }, [searchParams, router]);

  // Load reference from "Branch off from here" (?parent_id=id) — share history sidebar
  useEffect(() => {
    const parentId = searchParams.get("parent_id");
    if (!parentId || parentIdLoadedRef.current === parentId) return;
    parentIdLoadedRef.current = parentId;
    fetch(`/api/designs/${parentId}/public`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { imageUrl?: string | null; prompt?: string | null } | null) => {
        if (!data) return;
        if (data.imageUrl) setRefImage(data.imageUrl);
        setIsManualMode(true);
        setManualPrompt(data.prompt ? `Modify: ${data.prompt}` : "e.g. Add more shading, make lines thicker");
        setTimeout(() => promptSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
        const next = new URLSearchParams(searchParams.toString());
        next.delete("parent_id");
        const path = next.toString() ? `/?${next.toString()}` : "/";
        router.replace(path, { scroll: false });
      })
      .catch(() => {})
      .finally(() => {
        parentIdLoadedRef.current = null;
      });
  }, [searchParams, router]);

  // Load reference from "Edit this design" (?edit=id) — studio workbench design list
  useEffect(() => {
    const editId = searchParams.get("edit");
    if (!editId || editLoadedRef.current === editId) return;
    editLoadedRef.current = editId;
    fetch(`/api/designs/${editId}/public`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { imageUrl?: string | null; prompt?: string | null } | null) => {
        if (!data) return;
        if (data.imageUrl) setRefImage(data.imageUrl);
        setIsManualMode(true);
        setManualPrompt(data.prompt ? `Modify: ${data.prompt}` : "e.g. Add more shading, make lines thicker");
        setTimeout(() => {
          document.getElementById("studio")?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 100);
        const next = new URLSearchParams(searchParams.toString());
        next.delete("edit");
        const base = typeof window !== "undefined" ? window.location.pathname : "/";
        const path = next.toString() ? `${base}?${next.toString()}` : base;
        router.replace(path, { scroll: false });
      })
      .catch(() => {})
      .finally(() => {
        editLoadedRef.current = null;
      });
  }, [searchParams, router]);

  // Download a design with descriptive filename: Inkmind-Tattoo-[prompt-keywords].png
  // HTTP(S) URLs go through /api/download (watermark + force download); data URLs stay client-side
  const handleDownload = (dataUrl: string, index: number) => {
    const prompt = lastGenerationPrompt || manualPrompt || "";
    const suffix = designs.length > 1 ? index + 1 : undefined;
    const filename = promptToDownloadFilename(prompt, suffix != null ? { suffix } : undefined);
    if (dataUrl.startsWith("http://") || dataUrl.startsWith("https://")) {
      window.location.href = `/api/download?url=${encodeURIComponent(dataUrl)}&filename=${encodeURIComponent(filename)}`;
      return;
    }
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Save a design to the library (image + prompt) into the currently selected gallery
  const handleSaveToLibrary = useCallback((index: number) => {
    const dataUrl = designs[index];
    if (!dataUrl) return;
    const prompt = lastGenerationPrompt || manualPrompt || "Custom design";
    const style = lastGenerationStyle || selectedStyle;
    const entry: SavedDesign = {
      id: `saved-${Date.now()}-${index}`,
      prompt,
      style,
      image: dataUrl,
      date: new Date().toISOString(),
      collectionId: selectedCollectionId || null,
    };
    setDesignLibrary(prev => [entry, ...prev]);
    setSavedInSession(prev => new Set(prev).add(index));
  }, [designs, lastGenerationPrompt, lastGenerationStyle, manualPrompt, selectedStyle, selectedCollectionId]);

  // Add a new gallery (collection)
  const handleAddGallery = useCallback(() => {
    const name = newGalleryName.trim();
    if (!name) return;
    const id = `col-${Date.now()}`;
    setCollections(prev => [...prev, { id, name }]);
    setSelectedCollectionId(id);
    setNewGalleryName("");
  }, [newGalleryName]);

  // Load a saved design into the editor (manual mode + prompt + style)
  const handleLoadIntoEditor = useCallback((saved: SavedDesign) => {
    setIsManualMode(true);
    setManualPrompt(saved.prompt);
    setSelectedStyle(saved.style);
  }, []);

  // Download a saved (heart) design from the library — HTTP URLs via /api/download, data URLs client-side
  const handleDownloadSaved = useCallback((saved: SavedDesign) => {
    if (!saved.image) return;
    const filename = promptToDownloadFilename(saved.prompt);
    if (saved.image.startsWith("http://") || saved.image.startsWith("https://")) {
      window.location.href = `/api/download?url=${encodeURIComponent(saved.image)}&filename=${encodeURIComponent(filename)}`;
      return;
    }
    const link = document.createElement("a");
    link.href = saved.image;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, []);

  // Move a saved design to another gallery
  const handleMoveToGallery = useCallback((savedId: string, newCollectionId: string) => {
    setDesignLibrary(prev =>
      prev.map((d) => (d.id === savedId ? { ...d, collectionId: newCollectionId || null } : d))
    );
  }, []);

  const handleRefImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    refFileRef.current = file;
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === "string") setRefImage(result);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  // Wizard completion handler. referenceImageOverride: when set (e.g. from Apply Fixes), use this as the ref image.
  const handleWizardComplete = async (
    finalPrompt: string,
    placement: string,
    referenceImageOverride?: string
  ) => {
    setLoading(true);
    setError(null);
    setErrorConsoleUrl(null);

    try {
      let referenceImageUrl: string | undefined;
      if (refFileRef.current) {
        const file = refFileRef.current;
        const formData = new FormData();
        formData.append("file", file);
        const uploadRes = await fetch("/api/upload/reference", {
          method: "POST",
          body: formData,
        });
        const uploadJson = await uploadRes.json().catch(() => ({}));
        if (!uploadRes.ok) {
          setError(uploadJson.error || "Reference image upload failed");
          setLoading(false);
          return;
        }
        referenceImageUrl = uploadJson.url;
      }

      // Prefer override (e.g. from Ross Apply Fixes), then uploaded ref, then refImage state
      const refSource = referenceImageOverride ?? refImage;
      const refUrl =
        referenceImageUrl ?? (refSource?.startsWith("http") ? refSource : undefined);
      const refData =
        !refUrl && refSource && !refSource.startsWith("http") ? refSource : undefined;
      const hasReference = !!refUrl || !!refData;

      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: finalPrompt,
          style: selectedStyle,
          placement,
          count: designCount,
          model,
          isPaid: model === "high",
          ...(studioSlug && { studioSlug }),
          // Explicit user override for FLUX; backend uses studio default only when this is omitted
          ...(model === "basic" && { styleStrength }),
          ...(refUrl && { referenceImageUrl: refUrl }),
          ...(refData && { referenceImage: refData }),
          ...(hasReference && { referenceStrength }),
          ...(branchFromDesignId && { parent_id: branchFromDesignId }),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Generation failed");
        setErrorConsoleUrl(data.code === "GCP_IAM_REQUIRED" ? data.consoleUrl ?? null : null);
        return;
      }
      // When using Basic (Schnell), the API persists Replicate URLs via persistGeneratedTattoo and returns permanent Supabase URLs
      const newDesigns = Array.isArray(data.designs) ? data.designs : [];
      setDesigns(newDesigns);
      setLastGenerationPrompt(finalPrompt);
      setLastGenerationStyle(selectedStyle);
      setSavedInSession(new Set());
      setBranchFromDesignId(null);
      setRossReviewFixes(null);
      setRossReviewedImageIndex(null);
      saveLastGeneration(newDesigns, finalPrompt, selectedStyle);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setErrorConsoleUrl(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="studio-layout">
      {/* ── LEFT: Wizard Panel ── */}
      <div className="prompt-panel">
        <label style={{ marginBottom: 16 }}>Pick a Style</label>
        <div className="style-grid style-grid-scroll">
          {TATTOO_STYLES.map((s) => (
            <button
              key={s.id}
              type="button"
              className={`style-chip ${selectedStyle === s.id ? "active" : ""}`}
              onClick={() => setSelectedStyle(s.id)}
            >
              <span className="chip-icon">{s.icon}</span>
              {s.label}
            </button>
          ))}
        </div>

        {/* Which model generates the images — keep visible so users don't miss it */}
        <ModelSelector value={model} onChange={setModel} />

        {/* Generation count selector */}
        <div style={{ marginTop: 24 }}>
          <label style={{ marginBottom: 8, display: "block" }}>Number of Designs</label>
          <div className="generation-count-selector">
            {[1, 2, 4].map((count) => (
              <button
                key={count}
                type="button"
                className={`count-btn ${designCount === count ? "active" : ""}`}
                onClick={() => setDesignCount(count)}
              >
                {count}
              </button>
            ))}
          </div>
          <p className="count-hint">
            {designCount === 1 && "Save quota — perfect for testing"}
            {designCount === 2 && "Balanced approach"}
            {designCount === 4 && "Full gallery — uses 4 generations"}
          </p>
        </div>

        {/* Style Adherence (DNA) — only for Basic / FLUX Schnell. 1.5–2.5 Creative, 3.0 Balanced, 4–5 Strict. */}
        {model === "basic" && (
          <div className="space-y-3 pt-4 border-t" style={{ borderColor: "var(--gold-dim)" }}>
            <div className="flex justify-between items-center">
              <label
                htmlFor="style-strength"
                className="text-xs font-semibold uppercase tracking-wider"
                style={{ color: "var(--gold)" }}
              >
                Style Adherence (DNA)
              </label>
              <span
                className="text-xs font-mono px-2 py-0.5 rounded border"
                style={{
                  color: "rgba(232,180,90,0.95)",
                  background: "var(--gold-dim)",
                  borderColor: "rgba(232,180,90,0.25)",
                }}
              >
                {styleStrength.toFixed(1)}x
              </span>
            </div>
            <input
              id="style-strength"
              type="range"
              min={1.5}
              max={5}
              step={0.1}
              value={styleStrength}
              onChange={(e) => setStyleStrength(Number(e.target.value))}
              className="w-full h-2 rounded-full appearance-none cursor-pointer"
              style={{ accentColor: "var(--gold)" }}
              aria-label="Style adherence (DNA)"
            />
            <p
              className="text-[10px] flex justify-between px-1 italic"
              style={{ color: "var(--grey)" }}
            >
              <span>Creative</span>
              <span style={{ color: "rgba(232,180,90,0.7)" }}>Balanced</span>
              <span>Strict DNA</span>
            </p>
          </div>
        )}

        {/* Reference Image Upload */}
        <div style={{ marginTop: 24 }}>
          <label style={{ marginBottom: 8, display: "block", fontSize: 14, fontWeight: 500 }}>
            Reference Image
          </label>
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleRefImageChange}
              style={{ display: "none" }}
            />
            <button
              type="button"
              className="btn-outline"
              onClick={() => fileInputRef.current?.click()}
              style={{ padding: "10px 18px", fontSize: 13 }}
            >
              Upload Reference (e.g., Pokémon, Logo)
            </button>
            {refImage && (
              <div className="reference-with-strength">
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                    <img
                      src={refImage}
                      alt="Original"
                      style={{ width: 48, height: 48, objectFit: "cover", borderRadius: 8, border: "1px solid rgba(232,180,90,0.3)" }}
                    />
                    <span style={{ fontSize: 11, color: "var(--grey)" }}>Original</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => { refFileRef.current = null; setRefImage(null); setBranchFromDesignId(null); }}
                    style={{
                      background: "none",
                      border: "none",
                      color: "var(--grey)",
                      fontSize: 12,
                      cursor: "pointer",
                      textDecoration: "underline",
                    }}
                  >
                    Remove
                  </button>
                </div>
                <div className="strength-slider-row" style={{ marginTop: 10, maxWidth: 320 }}>
                  <label htmlFor="ref-strength" style={{ fontSize: 12, color: "var(--grey)", display: "block", marginBottom: 4 }}>
                    Strength: lower = stay close to original, higher = more change (0.1–1.0)
                  </label>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <input
                      id="ref-strength"
                      type="range"
                      min={0.1}
                      max={1}
                      step={0.1}
                      value={referenceStrength}
                      onChange={(e) => setReferenceStrength(Number(e.target.value))}
                      style={{ flex: 1, accentColor: "var(--gold)" }}
                      aria-label="Reference strength"
                    />
                    <span style={{ fontSize: 12, color: "var(--grey)", minWidth: 36 }}>
                      {(referenceStrength * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Mode toggle: Guided (Wizard) vs Manual prompt */}
        <div style={{ marginTop: 24, marginBottom: 8, display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
          <button
            type="button"
            onClick={() => setIsManualMode((m) => !m)}
            style={{
              background: "none",
              border: "none",
              color: "rgba(232, 180, 90, 0.9)",
              fontSize: 13,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              cursor: "pointer",
              padding: 0,
              textDecoration: "underline",
              textUnderlineOffset: 4,
            }}
          >
            {isManualMode ? "← Back to guided designer" : "Skip to manual prompt"}
          </button>
          {!isManualMode && (
            <button
              type="button"
              className="mode-toggle-btn"
              onClick={() => {
                setManualPrompt(lastWizardPrompt);
                if (lastWizardPlacement) setManualPlacement(lastWizardPlacement);
                setIsManualMode(true);
              }}
            >
              Switch to manual mode
            </button>
          )}
        </div>

        {/* Legal Disclaimer */}
        {!loading && (
          <div style={{ marginTop: 20 }}>
            <label
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 10,
                cursor: "pointer",
                fontSize: 13,
                color: "var(--grey)",
                lineHeight: 1.5,
              }}
            >
              <input
                type="checkbox"
                checked={disclaimerAccepted}
                onChange={(e) => setDisclaimerAccepted(e.target.checked)}
                style={{ marginTop: 4, width: 18, height: 18, accentColor: "var(--gold)" }}
              />
              <span>
                I understand this AI design is a final concept. If I provide this to my artist, it will be tattooed as-is without further modifications.
              </span>
            </label>
          </div>
        )}

        <div style={{ marginTop: 24 }}>
          {loading ? (
            <div className="wizard-loading">
              <div className="wizard-spinner" />
              <p>{LOADING_STATUSES[loadingStatusIndex]}</p>
            </div>
          ) : isManualMode ? (
            <div ref={promptSectionRef} className="manual-prompt-container">
              <div style={{ display: "flex", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
                {refImage && (
                  <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                    <img
                      src={refImage}
                      alt="Original"
                      style={{ width: 56, height: 56, objectFit: "cover", borderRadius: 8, border: "1px solid rgba(232,180,90,0.3)" }}
                    />
                    <span style={{ fontSize: 11, color: "var(--grey)" }}>Original</span>
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 200 }}>
                  <label htmlFor="manual-prompt" style={{ display: "block", fontSize: 14, fontWeight: 500 }}>
                    Describe your tattoo
                  </label>
                  <textarea
                    id="manual-prompt"
                    className="manual-textarea"
                    value={manualPrompt}
                    onChange={(e) => setManualPrompt(e.target.value)}
                    placeholder="e.g. A fine-line blackwork raven with geometric patterns, bold and minimal, for forearm placement"
                    disabled={loading}
                  />
                  {/* Studio Assistant: style suggestion chips (not a chat box) */}
                  <div className="mt-4 rounded-[var(--radius-lg)] bg-[var(--bg-card)] border border-white/10 p-4 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-[var(--gold)] opacity-5 rounded-full blur-3xl pointer-events-none" />
                    <div className="relative">
                      <div className="flex items-center gap-2 mb-3">
                        <svg viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                          <path d="M9 2v6l-3 1" />
                          <path d="M15 2v6l3 1" />
                          <path d="M12 8v13" />
                          <path d="M9 21h6" />
                        </svg>
                        <span className="text-sm font-semibold text-[var(--white)] font-[var(--font-head)]">
                          Studio Assistant
                        </span>
                        {rossLoading && (
                          <span className="text-xs text-[var(--grey)] ml-auto animate-pulse">Thinking…</span>
                        )}
                        {rossError && (
                          <span className="text-xs text-[var(--red)] ml-auto">{rossError}</span>
                        )}
                      </div>
                      {rossSuggestions.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-xs text-[var(--grey)] uppercase tracking-wider font-medium">
                            Style Enhancers
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {rossSuggestions.map((s, i) => (
                              <button
                                key={i}
                                type="button"
                                className="studio-assistant-suggestion group px-3 py-2 rounded-[var(--radius)] text-sm border border-white/10 bg-[var(--bg)] text-[var(--white)] hover:bg-[var(--gold-dim)] hover:border-[var(--gold)]/30 hover:text-[var(--gold)] transition-all duration-200"
                                style={{ animationDelay: `${i * 40}ms` }}
                                onClick={() => {
                                  const sep = manualPrompt.trim().endsWith(",") || !manualPrompt.trim() ? "" : ", ";
                                  setManualPrompt((p) => p.trim() + sep + s);
                                }}
                              >
                                <span className="inline-flex items-center gap-1.5">
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3 opacity-60 group-hover:opacity-100">
                                    <polyline points="9 18 15 12 9 6" />
                                  </svg>
                                  {s}
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                      {!rossLoading && rossSuggestions.length === 0 && !rossError && (
                        <p className="text-xs text-[var(--grey)] italic">
                          Start typing your tattoo idea to get professional suggestions…
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                <label htmlFor="manual-placement" style={{ fontSize: 14 }}>Placement</label>
                <select
                  id="manual-placement"
                  value={manualPlacement}
                  onChange={(e) => setManualPlacement(e.target.value)}
                  disabled={loading}
                  style={{
                    padding: "10px 14px",
                    borderRadius: 10,
                    border: "1px solid rgba(232, 180, 90, 0.25)",
                    background: "rgba(10, 10, 10, 0.6)",
                    color: "#f5f5f5",
                    fontSize: 14,
                  }}
                >
                  {PLACEMENT_OPTIONS.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
                {rossLongevityAlert && (
                  <div className="flex-1 min-w-[200px] rounded-[var(--radius-lg)] bg-[var(--gold-dim)] border border-[var(--gold)]/30 p-4 relative overflow-hidden">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-[var(--gold)]" />
                    <div className="flex items-start gap-3 pl-2">
                      <svg viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 shrink-0 mt-0.5">
                        <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" />
                        <path d="M9 18h6" />
                        <path d="M10 22h4" />
                      </svg>
                      <div className="flex-1">
                        <p className="text-xs font-semibold text-[var(--gold)] uppercase tracking-wider mb-1">
                          Artist Insight
                        </p>
                        <p className="text-sm text-[var(--white)] leading-relaxed">
                          {rossLongevityAlert}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => handleWizardComplete(manualPrompt.trim(), manualPlacement)}
                  disabled={loading || !manualPrompt.trim() || !disclaimerAccepted}
                  className="wizard-btn-next"
                  style={{ marginLeft: "auto" }}
                >
                  Generate
                </button>
              </div>
            </div>
          ) : (
            <ConversationalWizard
              onComplete={handleWizardComplete}
              selectedStyle={selectedStyle}
              isPaid={model === "high"}
              disclaimerAccepted={disclaimerAccepted}
              onPromptChange={(prompt, placement) => {
                setLastWizardPrompt(prompt);
                setLastWizardPlacement(placement);
              }}
            />
          )}
        </div>

        {error && (
          <div className="studio-error" style={{ marginTop: 16 }}>
            <p>{error}</p>
            {errorConsoleUrl && (
              <a
                href={errorConsoleUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{ marginTop: 8, display: "inline-block", fontSize: 14 }}
              >
                Fix in Google Cloud Console →
              </a>
            )}
          </div>
        )}
      </div>

      {/* ── RIGHT: Gallery ── */}
      <div className="gallery-panel">
        {designs.length > 0 && hasMounted && (
          <div className="save-to-gallery-strip">
            <div className="save-to-gallery-label">
              <span className="saved-hint">Hearted designs save to:</span>
              <select
                value={selectedCollectionId}
                onChange={(e) => setSelectedCollectionId(e.target.value)}
                className="gallery-select"
                aria-label="Choose gallery to save designs to"
              >
                {collections.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <p className="save-to-gallery-hint">Pick a gallery above, then tap the heart on any design to add it there.</p>
          </div>
        )}
        {loading ? (
          <GenerationLoader
            statusMessage={LOADING_STATUSES[loadingStatusIndex]}
            count={designCount}
          />
        ) : (
        <div className="gallery-grid" style={{
          gridTemplateColumns: showPlaceholders
            ? "repeat(3, 1fr)"
            : designCount === 1 ? "1fr" : designCount === 2 ? "repeat(2, 1fr)" : "repeat(2, 1fr)",
        }}>
          {showPlaceholders
            ? placeholderImages.map((imgUrl, i) => (
                <div
                  key={`${imgUrl}-${i}`}
                  className="gallery-card"
                  style={{ background: CARD_BG[i % CARD_BG.length] }}
                  onClick={() => setLightboxImage(imgUrl)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === "Enter" && setLightboxImage(imgUrl)}
                >
                  <img
                    src={imgUrl}
                    alt="Placeholder tattoo design"
                    className="gallery-card-img"
                  />
                  <div className="card-overlay">
                    <button
                      type="button"
                      className="overlay-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        openBookingModal();
                      }}
                    >
                      <ArrowIcon /> Book This
                    </button>
                  </div>
                </div>
              ))
            : designs.map((dataUrl, i) => (
                <div
                  key={i}
                  className="gallery-card"
                  style={{ background: CARD_BG[i % CARD_BG.length] }}
                  onClick={() => setLightboxImage(dataUrl)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === "Enter" && setLightboxImage(dataUrl)}
                >
                  <TattooDesignImage
                    src={dataUrl}
                    alt={`Generated tattoo design ${i + 1}`}
                    className="gallery-card-img"
                  />
                  <div className="card-overlay">
                    <div className="card-actions">
                      <button
                        type="button"
                        className="action-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSaveToLibrary(i);
                        }}
                        title={savedInSession.has(i) ? "Saved to library" : "Save to library"}
                      >
                        <HeartIcon filled={savedInSession.has(i)} />
                      </button>
                      <button
                        type="button"
                        className="action-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownload(dataUrl, i);
                        }}
                        title="Download"
                      >
                        <DownloadIcon />
                      </button>
                      <button
                        type="button"
                        className="overlay-btn overlay-btn-edit"
                        onClick={(e) => {
                          e.stopPropagation();
                          setRefImage(dataUrl);
                          setIsManualMode(true);
                          setManualPrompt(lastGenerationPrompt ? `Modify: ${lastGenerationPrompt}` : "e.g. Add more shading, make lines thicker");
                          setTimeout(() => {
                            promptSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                          }, 100);
                        }}
                        title="Use this design as reference and edit in the form above"
                      >
                        <RefIcon /> Edit this Design
                      </button>
                      <button
                        type="button"
                        className="overlay-btn overlay-btn-edit"
                        onClick={(e) => {
                          e.stopPropagation();
                          setRossReviewError(null);
                          setRossReviewLoading(true);
                          setRossReviewedImageIndex(i);
                          getRossImageReview(dataUrl, lastGenerationPrompt || manualPrompt || "")
                            .then((result) => {
                              if (result.error) {
                                setRossReviewError(result.error);
                                setRossReviewFixes(null);
                                return;
                              }
                              if (result.data) setRossReviewFixes(result.data);
                            })
                            .finally(() => setRossReviewLoading(false));
                        }}
                        disabled={rossReviewLoading}
                        title="Get Ross’s feedback on shading, linework, and color"
                      >
                        {rossReviewLoading && rossReviewedImageIndex === i ? "…" : "Ross Review"}
                      </button>
                      <button
                        type="button"
                        className="overlay-btn-main"
                        onClick={(e) => {
                          e.stopPropagation();
                          openBookingModal();
                        }}
                      >
                        <ArrowIcon /> Book This
                      </button>
                    </div>
                  </div>
                </div>
              ))}
        </div>
        )}

        {/* Ross Correction List — shown after Ross Review, with Apply Fixes */}
        {designs.length > 0 && rossReviewFixes && (
          <div className="mt-4 rounded-lg bg-zinc-900 border border-white/10 p-4">
            <h4 className="text-sm font-medium text-zinc-300 mb-2">Correction List</h4>
            <ul className="space-y-1.5 text-sm text-zinc-200 mb-4">
              <li><span className="text-amber-400/90 font-medium">Shading:</span> {rossReviewFixes.shadingFix}</li>
              <li><span className="text-amber-400/90 font-medium">Linework:</span> {rossReviewFixes.lineFix}</li>
              <li><span className="text-amber-400/90 font-medium">Color:</span> {rossReviewFixes.colorFix}</li>
            </ul>
            <div className="flex items-center gap-3 flex-wrap">
              <button
                type="button"
                onClick={() => {
                  if (rossReviewedImageIndex == null) return;
                  const refImageUrl = designs[rossReviewedImageIndex];
                  const refinementPrompt = `Refine with corrections: ${rossReviewFixes.shadingFix}. ${rossReviewFixes.lineFix}. ${rossReviewFixes.colorFix}.`;
                  setRefImage(refImageUrl);
                  setIsManualMode(true);
                  setManualPrompt(refinementPrompt);
                  setRossReviewFixes(null);
                  setRossReviewedImageIndex(null);
                  handleWizardComplete(refinementPrompt, manualPlacement, refImageUrl);
                  setTimeout(() => promptSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
                }}
                disabled={loading}
                className="px-4 py-2 rounded-lg bg-amber-500/20 border border-amber-500/30 text-amber-400 hover:bg-amber-500/30 transition-colors text-sm font-medium"
              >
                Apply Fixes
              </button>
              <button
                type="button"
                onClick={() => { setRossReviewFixes(null); setRossReviewedImageIndex(null); setRossReviewError(null); }}
                className="text-sm text-zinc-400 hover:text-zinc-200"
              >
                Dismiss
              </button>
            </div>
            {rossReviewError && <p className="mt-2 text-sm text-amber-500/90">{rossReviewError}</p>}
          </div>
        )}

        {/* Your Galleries — skeleton while hydrating; after mount always show so user can create galleries before generating */}
        {!hasMounted && <HistorySkeleton />}
        {hasMounted && (
          <div className="animate-historyFadeIn">
            <section className="history-section">
              <h3 className="section-label">Your Galleries</h3>
              <p className="saved-hint" style={{ marginTop: 4 }}>
                {designLibrary.length > 0
                  ? "Saved designs by gallery — load into the editor or download"
                  : "Create galleries below, then generate designs and tap the heart to add them."}
              </p>
              <div className="gallery-filter-row">
                <button
                  type="button"
                  className={`gallery-filter-chip ${filterCollectionId === null ? "active" : ""}`}
                  onClick={() => setFilterCollectionId(null)}
                >
                  All
                </button>
                {collections.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    className={`gallery-filter-chip ${filterCollectionId === c.id ? "active" : ""}`}
                    onClick={() => setFilterCollectionId(c.id)}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
              <div className="new-gallery-row">
                <input
                  type="text"
                  placeholder="New gallery name"
                  value={newGalleryName}
                  onChange={(e) => setNewGalleryName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddGallery()}
                  className="new-gallery-input"
                  aria-label="New gallery name"
                />
                <button
                  type="button"
                  className="btn-outline new-gallery-btn"
                  onClick={handleAddGallery}
                  disabled={!newGalleryName.trim()}
                >
                  Add gallery
                </button>
              </div>
              <div className="history-grid">
              {filteredDesignLibrary.length === 0 ? (
                <p className="saved-hint" style={{ gridColumn: "1 / -1", marginTop: 8 }}>
                  {filterCollectionId == null ? "No saved designs yet." : "No designs in this gallery."}
                </p>
              ) : filteredDesignLibrary.map((saved) => (
                <div
                  key={saved.id}
                  className="history-card"
                  onClick={() => setLightboxImage(saved.image)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === "Enter" && setLightboxImage(saved.image)}
                >
                  <img
                    src={saved.image}
                    alt=""
                    className="history-thumb"
                  />
                  <div className="history-overlay">
                    <span title={saved.prompt}>
                      {saved.prompt.slice(0, 40)}{saved.prompt.length > 40 ? "…" : ""}
                    </span>
                    <div className="history-card-actions">
                      <button
                        type="button"
                        className="action-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownloadSaved(saved);
                        }}
                        title="Download"
                      >
                        <DownloadIcon />
                      </button>
                      <button
                        type="button"
                        className="action-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          setRefImage(saved.image);
                          setIsManualMode(true);
                          setManualPrompt(`Modify: ${saved.prompt.slice(0, 60)}${saved.prompt.length > 60 ? "…" : ""}`);
                          setTimeout(() => {
                            promptSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                          }, 100);
                        }}
                        title="Use as reference and edit in the form above"
                      >
                        <RefIcon />
                      </button>
                      <button
                        type="button"
                        className="overlay-btn-main"
                        style={{ flex: 1, fontSize: 12, padding: "8px 12px" }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLoadIntoEditor(saved);
                        }}
                      >
                        Load into Editor
                      </button>
                    </div>
                    <div className="history-move-row">
                      <label htmlFor={`move-${saved.id}`} className="history-move-label">Move to:</label>
                      <select
                        id={`move-${saved.id}`}
                        value={saved.collectionId ?? "general"}
                        onChange={(e) => {
                          e.stopPropagation();
                          handleMoveToGallery(saved.id, e.target.value);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="history-move-select"
                        aria-label="Move to gallery"
                      >
                        {collections.map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            </section>
          </div>
        )}

        {/* Booking strip */}
        <div className="booking-strip" style={{ alignItems: "center" }}>
          <div className="booking-strip-text">
            <h2>Happy with a design?<br />Let&apos;s get it on skin.</h2>
            <p>
              Book a session directly — see real availability, choose your date,
              and pay your deposit. No back-and-forth needed.
            </p>
          </div>
          <div className="booking-strip-actions">
            <button
              type="button"
              className="btn-outline"
              onClick={openBookingModal}
            >
              View Calendar
            </button>
            <button
              type="button"
              className="btn-primary"
              onClick={openBookingModal}
            >
              Book a Session
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {!useExternalBooking && (
        <BookingModal open={bookingModalOpen} onClose={closeBookingModal} />
      )}

      <ImageLightbox
        src={lightboxImage}
        alt="Tattoo design"
        onClose={() => setLightboxImage(null)}
      />
    </div>
  );
}
