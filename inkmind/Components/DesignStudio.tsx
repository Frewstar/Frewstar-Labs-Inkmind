"use client";

import { useState, useEffect, useCallback } from "react";
import BookingModal from "./BookingModal";
import ConversationalWizard from "./ConversationalWizard";

export type DesignStudioProps = {
  onOpenBooking?: () => void;
};

// ─── Saved Design Library (localStorage) ─────────────────────────────────────

const SAVED_DESIGNS_KEY = "inkmind_saved_designs_v1";

export type SavedDesign = {
  id: string;
  prompt: string;
  style: string;
  image: string;
  date: string;
};

function loadDesignLibrary(): SavedDesign[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(SAVED_DESIGNS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveDesignLibrary(items: SavedDesign[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(SAVED_DESIGNS_KEY, JSON.stringify(items));
  } catch {
    // ignore
  }
}

// ─── DATA ────────────────────────────────────────────────────────────────────

const STYLES = [
  { id: "fine-line",   label: "Fine Line",   icon: "✦" },
  { id: "geometric",  label: "Geometric",   icon: "◎" },
  { id: "blackwork",  label: "Blackwork",   icon: "⟡" },
  { id: "watercolor", label: "Watercolor",  icon: "❋" },
  { id: "traditional",label: "Traditional", icon: "⊕" },
  { id: "minimalist", label: "Minimalist",  icon: "◇" },
];

const PLACEHOLDER_IMAGES = [
  "https://picsum.photos/seed/tattoo1/800/800",
  "https://picsum.photos/seed/tattoo2/800/800",
  "https://picsum.photos/seed/tattoo3/800/800",
  "https://picsum.photos/seed/tattoo4/800/800",
];

const CARD_BG = [
  "radial-gradient(ellipse at 30% 70%, #1a1205 0%, #0e0e0e 60%)",
  "radial-gradient(ellipse at 70% 30%, #0f1a1a 0%, #0e0e0e 60%)",
  "radial-gradient(ellipse at 50% 80%, #1a0f0f 0%, #0e0e0e 60%)",
  "radial-gradient(ellipse at 20% 40%, #151a0f 0%, #0e0e0e 60%)",
];

const PLACEMENT_OPTIONS = [
  "Forearm", "Upper Arm", "Chest", "Back", "Thigh", "Shoulder", "Calf",
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

export default function DesignStudio({ onOpenBooking: externalOpenBooking }: DesignStudioProps = {}) {
  const [selectedStyle, setSelectedStyle] = useState("fine-line");
  const [designCount, setDesignCount] = useState(4); // New: adjustable count
  const [designs, setDesigns] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorConsoleUrl, setErrorConsoleUrl] = useState<string | null>(null);
  const [isPaid, setIsPaid] = useState(false); // High Quality (Paid Tier)
  const [isManualMode, setIsManualMode] = useState(false); // Manual prompt vs Wizard
  const [manualPrompt, setManualPrompt] = useState("");
  const [manualPlacement, setManualPlacement] = useState("Forearm");
  const [lastWizardPrompt, setLastWizardPrompt] = useState(""); // Pre-fill when ejecting from wizard
  const [lastWizardPlacement, setLastWizardPlacement] = useState<string | null>(null);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [designLibrary, setDesignLibrary] = useState<SavedDesign[]>(loadDesignLibrary);
  const [lastGenerationPrompt, setLastGenerationPrompt] = useState("");
  const [lastGenerationStyle, setLastGenerationStyle] = useState(selectedStyle);
  const [savedInSession, setSavedInSession] = useState<Set<number>>(new Set()); // which current gallery indices were saved this session

  const useExternalBooking = !!externalOpenBooking;
  const openBookingModal = useExternalBooking ? externalOpenBooking! : () => setBookingModalOpen(true);
  const closeBookingModal = () => setBookingModalOpen(false);

  const showPlaceholders = designs.length === 0;

  // Persist design library to localStorage when it changes
  useEffect(() => {
    saveDesignLibrary(designLibrary);
  }, [designLibrary]);

  // Download a design
  const handleDownload = (dataUrl: string, index: number) => {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `inkmind-design-${index + 1}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Save a design to the library (image + prompt used for generation)
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
    };
    setDesignLibrary(prev => [entry, ...prev]);
    setSavedInSession(prev => new Set(prev).add(index));
  }, [designs, lastGenerationPrompt, lastGenerationStyle, manualPrompt, selectedStyle]);

  // Load a saved design into the editor (manual mode + prompt + style)
  const handleLoadIntoEditor = useCallback((saved: SavedDesign) => {
    setIsManualMode(true);
    setManualPrompt(saved.prompt);
    setSelectedStyle(saved.style);
  }, []);

  // Wizard completion handler
  const handleWizardComplete = async (finalPrompt: string, placement: string) => {
    setLoading(true);
    setError(null);
    setErrorConsoleUrl(null);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: finalPrompt,
          style: selectedStyle,
          placement,
          count: designCount,
          isPaid,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Generation failed");
        setErrorConsoleUrl(data.code === "GCP_IAM_REQUIRED" ? data.consoleUrl ?? null : null);
        return;
      }
      const newDesigns = Array.isArray(data.designs) ? data.designs : [];
      setDesigns(newDesigns);
      setLastGenerationPrompt(finalPrompt);
      setLastGenerationStyle(selectedStyle);
      setSavedInSession(new Set());
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
        <div className="style-grid">
          {STYLES.map((s) => (
            <button
              key={s.id}
              className={`style-chip ${selectedStyle === s.id ? "active" : ""}`}
              onClick={() => setSelectedStyle(s.id)}
            >
              <span className="chip-icon">{s.icon}</span>
              {s.label}
            </button>
          ))}
        </div>

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

        {/* High Quality (Paid Tier) toggle */}
        <div style={{ marginTop: 24 }}>
          <label
            htmlFor="high-quality-toggle"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              cursor: "pointer",
              fontSize: 14,
              fontWeight: 500,
            }}
          >
            <button
              id="high-quality-toggle"
              type="button"
              role="switch"
              aria-checked={isPaid}
              onClick={() => setIsPaid((p) => !p)}
              style={{
                width: 44,
                height: 24,
                borderRadius: 12,
                border: "none",
                background: isPaid ? "linear-gradient(135deg, #c9a227 0%, #e8b45a 100%)" : "#333",
                position: "relative",
                cursor: "pointer",
                transition: "background 0.2s",
              }}
            >
              <span
                style={{
                  position: "absolute",
                  top: 2,
                  left: isPaid ? 22 : 2,
                  width: 20,
                  height: 20,
                  borderRadius: "50%",
                  background: "#fff",
                  transition: "left 0.2s",
                }}
              />
            </button>
            <span style={{ color: isPaid ? "#e8b45a" : "inherit" }}>
              High Quality {isPaid && "✨"}
            </span>
          </label>
          <p style={{ marginTop: 4, fontSize: 12, color: "#888" }}>
            {isPaid ? "Uses Vertex AI (Paid tier) for higher quality." : "Standard quality (free tier)."}
          </p>
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

        <div style={{ marginTop: 24 }}>
          {loading ? (
            <div className="wizard-loading">
              <div className="wizard-spinner" />
              <p>Generating {designCount} design{designCount > 1 ? 's' : ''}...</p>
            </div>
          ) : isManualMode ? (
            <div className="manual-prompt-container">
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
                <button
                  type="button"
                  onClick={() => handleWizardComplete(manualPrompt.trim(), manualPlacement)}
                  disabled={loading || !manualPrompt.trim()}
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
              isPaid={isPaid}
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
        <div className="gallery-grid" style={{ 
          gridTemplateColumns: designCount === 1 ? '1fr' : designCount === 2 ? 'repeat(2, 1fr)' : 'repeat(2, 1fr)'
        }}>
          {showPlaceholders
            ? PLACEHOLDER_IMAGES.slice(0, designCount).map((imgUrl, i) => (
                <div
                  key={i}
                  className="gallery-card"
                  style={{ background: CARD_BG[i] }}
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
                      onClick={openBookingModal}
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
                >
                  <img
                    src={dataUrl}
                    alt={`Generated tattoo design ${i + 1}`}
                    className="gallery-card-img"
                  />
                  <div className="card-overlay">
                    <div className="card-actions">
                      <button
                        type="button"
                        className="action-btn"
                        onClick={() => handleSaveToLibrary(i)}
                        title={savedInSession.has(i) ? "Saved to library" : "Save to library"}
                      >
                        <HeartIcon filled={savedInSession.has(i)} />
                      </button>
                      <button
                        type="button"
                        className="action-btn"
                        onClick={() => handleDownload(dataUrl, i)}
                        title="Download"
                      >
                        <DownloadIcon />
                      </button>
                      <button
                        type="button"
                        className="overlay-btn-main"
                        onClick={openBookingModal}
                      >
                        <ArrowIcon /> Book This
                      </button>
                    </div>
                  </div>
                </div>
              ))}
        </div>

        {/* Your Design History (saved to localStorage) */}
        {designLibrary.length > 0 && (
          <section className="history-section">
            <h3 className="section-label">Your Design History</h3>
            <p className="saved-hint" style={{ marginTop: 4 }}>
              Saved designs — load any into the editor to tweak and regenerate
            </p>
            <div className="history-grid">
              {designLibrary.map((saved) => (
                <div key={saved.id} className="history-card">
                  <img
                    src={saved.image}
                    alt=""
                    className="history-thumb"
                  />
                  <div className="history-overlay">
                    <span title={saved.prompt}>
                      {saved.prompt.slice(0, 40)}{saved.prompt.length > 40 ? "…" : ""}
                    </span>
                    <button
                      type="button"
                      className="overlay-btn-main"
                      style={{ marginTop: 8, width: "100%", fontSize: 12, padding: "8px 12px" }}
                      onClick={() => handleLoadIntoEditor(saved)}
                    >
                      Load into Editor
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Booking strip */}
        <div className="booking-strip">
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
    </div>
  );
}
