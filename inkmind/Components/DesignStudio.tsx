"use client";

import { useState } from "react";
import BookingModal from "./BookingModal";
import ConversationalWizard from "./ConversationalWizard";

export type DesignStudioProps = {
  onOpenBooking?: () => void;
};

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
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [savedDesigns, setSavedDesigns] = useState<Set<number>>(new Set()); // Track saved designs

  const useExternalBooking = !!externalOpenBooking;
  const openBookingModal = useExternalBooking ? externalOpenBooking! : () => setBookingModalOpen(true);
  const closeBookingModal = () => setBookingModalOpen(false);

  const showPlaceholders = designs.length === 0;

  // Download a design
  const handleDownload = (dataUrl: string, index: number) => {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `inkmind-design-${index + 1}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Save/unsave a design
  const toggleSave = (index: number) => {
    setSavedDesigns(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

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
      setSavedDesigns(new Set()); // Reset saved state on new generation
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

        <div style={{ marginTop: 32 }}>
          {loading ? (
            <div className="wizard-loading">
              <div className="wizard-spinner" />
              <p>Generating {designCount} design{designCount > 1 ? 's' : ''}...</p>
            </div>
          ) : (
            <ConversationalWizard
              onComplete={handleWizardComplete}
              selectedStyle={selectedStyle}
              isPaid={isPaid}
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
                        onClick={() => toggleSave(i)}
                        title={savedDesigns.has(i) ? "Unsave" : "Save"}
                      >
                        <HeartIcon filled={savedDesigns.has(i)} />
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

        {/* Saved designs section */}
        {savedDesigns.size > 0 && (
          <div className="saved-designs-section">
            <h3>Saved Designs ({savedDesigns.size})</h3>
            <p className="saved-hint">Your saved designs are stored in this session only</p>
          </div>
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
