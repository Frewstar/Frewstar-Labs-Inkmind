"use client";

import { useState } from "react";
import BookingModal from "./BookingModal";

export type DesignStudioProps = {
  /** When provided, parent owns the booking modal; use this instead of internal state */
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

const PLACEMENTS = [
  "Forearm", "Upper Arm", "Chest", "Back", "Thigh", "Neck", "Hand",
];

// ─── PLACEHOLDER SVGs (shown before the user generates anything) ─────────────
// These match the original HTML mockup exactly.

const PLACEHOLDER_SVGS = [
  // 1 — fine-line snake + chrysanthemum
  `<svg class="tattoo-sketch" viewBox="0 0 200 200" fill="none" stroke="rgba(232,180,90,0.55)" stroke-width="1.2" stroke-linecap="round">
    <path d="M60,180 C55,150 80,130 70,100 C60,70 90,60 85,40 C80,20 100,15 110,30"/>
    <ellipse cx="115" cy="24" rx="10" ry="7" stroke-width="1.5"/>
    <circle cx="112" cy="22" r="1.5" fill="rgba(232,180,90,0.55)"/>
    <ellipse cx="90" cy="110" rx="12" ry="6" transform="rotate(-30 90 110)"/>
    <ellipse cx="78" cy="108" rx="11" ry="5" transform="rotate(-60 78 108)"/>
    <ellipse cx="102" cy="105" rx="11" ry="5" transform="rotate(10 102 105)"/>
    <ellipse cx="85" cy="98" rx="10" ry="5" transform="rotate(-10 85 98)"/>
    <ellipse cx="95" cy="96" rx="9" ry="4" transform="rotate(20 95 96)"/>
    <ellipse cx="88" cy="118" rx="8" ry="4" transform="rotate(-5 88 118)"/>
    <path d="M65,160 C68,155 62,148 66,142"/>
    <path d="M72,135 C75,128 70,122 74,116"/>
  </svg>`,

  // 2 — geometric variation
  `<svg class="tattoo-sketch" viewBox="0 0 200 200" fill="none" stroke="rgba(232,180,90,0.5)" stroke-width="1" stroke-linecap="round">
    <polygon points="100,20 170,70 170,150 100,180 30,150 30,70" stroke-width="1.2"/>
    <polygon points="100,40 150,75 150,140 100,160 50,140 50,75" stroke-width="0.8" stroke-dasharray="4 3"/>
    <path d="M75,120 C80,100 95,95 90,75 C85,58 105,55 110,70 C115,82 100,85 105,100 C108,110 95,115 90,105"/>
    <circle cx="100" cy="95" r="8"/>
    <circle cx="100" cy="95" r="3" fill="rgba(232,180,90,0.2)"/>
    <line x1="100" y1="87" x2="100" y2="72"/><line x1="108" y1="90" x2="118" y2="78"/>
    <line x1="92" y1="90" x2="82" y2="78"/><line x1="100" y1="103" x2="100" y2="118"/>
    <line x1="108" y1="100" x2="118" y2="112"/><line x1="92" y1="100" x2="82" y2="112"/>
  </svg>`,

  // 3 — bold blackwork
  `<svg class="tattoo-sketch" viewBox="0 0 200 200" fill="none" stroke="rgba(232,180,90,0.45)" stroke-width="1.4" stroke-linecap="round">
    <path d="M50,170 C45,140 75,120 65,90 C55,60 85,50 90,70 C95,88 75,92 80,110 C83,125 70,130 65,140" stroke-width="2.5"/>
    <ellipse cx="95" cy="100" rx="18" ry="8" transform="rotate(-25 95 100)" stroke-width="2"/>
    <ellipse cx="78" cy="98" rx="16" ry="7" transform="rotate(-55 78 98)" stroke-width="1.8"/>
    <ellipse cx="112" cy="95" rx="16" ry="7" transform="rotate(15 112 95)" stroke-width="1.8"/>
    <ellipse cx="90" cy="82" rx="14" ry="6" transform="rotate(-5 90 82)" stroke-width="1.6"/>
    <ellipse cx="105" cy="80" rx="13" ry="6" transform="rotate(25 105 80)" stroke-width="1.5"/>
    <circle cx="97" cy="93" r="6" stroke-width="2"/>
  </svg>`,

  // 4 — minimal abstract
  `<svg class="tattoo-sketch" viewBox="0 0 200 200" fill="none" stroke="rgba(232,180,90,0.4)" stroke-width="0.8" stroke-linecap="round">
    <path d="M70,175 C68,155 85,145 82,125 C79,105 95,100 92,82 C89,65 105,58 108,72" stroke-width="1.2"/>
    <ellipse cx="112" cy="68" rx="6" ry="4" stroke-width="1"/>
    <path d="M85,110 C82,105 88,100 84,95 C81,91 86,87 90,90 C93,92 90,97 94,100 C97,102 94,107 90,108 C87,109 85,112 85,110 Z" stroke-width="1.2"/>
    <line x1="75" y1="140" x2="80" y2="135" opacity="0.5"/><line x1="78" y1="130" x2="83" y2="125" opacity="0.4"/>
    <line x1="80" y1="120" x2="85" y2="115" opacity="0.3"/>
    <circle cx="65" cy="155" r="1.5" fill="rgba(232,180,90,0.3)"/>
    <circle cx="72" cy="148" r="1" fill="rgba(232,180,90,0.25)"/>
    <circle cx="60" cy="162" r="1" fill="rgba(232,180,90,0.2)"/>
  </svg>`,
];

// Card background gradients — one per placeholder slot
const CARD_BG = [
  "radial-gradient(ellipse at 30% 70%, #1a1205 0%, #0e0e0e 60%)",
  "radial-gradient(ellipse at 70% 30%, #0f1a1a 0%, #0e0e0e 60%)",
  "radial-gradient(ellipse at 50% 80%, #1a0f0f 0%, #0e0e0e 60%)",
  "radial-gradient(ellipse at 20% 40%, #151a0f 0%, #0e0e0e 60%)",
];

// ─── ICONS ───────────────────────────────────────────────────────────────────

function GenerateIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 18, height: 18 }}>
      <path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 14, height: 14 }}>
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  );
}

// ─── COMPONENT ───────────────────────────────────────────────────────────────

export default function DesignStudio({ onOpenBooking: externalOpenBooking }: DesignStudioProps = {}) {
  const [prompt, setPrompt]               = useState("A geometric snake coiling around a chrysanthemum, fine line work, minimal shading");
  const [selectedStyle, setSelectedStyle] = useState("fine-line");
  const [selectedPlacement, setSelectedPlacement] = useState("Forearm");
  const [designs, setDesigns]             = useState<string[]>([]);   // SVG strings from API
  const [loading, setLoading]             = useState(false);
  const [error, setError]                 = useState<string | null>(null);
  const [lastGeneratedPrompt, setLastGeneratedPrompt] = useState<string>("");
  const [bookingModalOpen, setBookingModalOpen] = useState(false);

  const useExternalBooking = !!externalOpenBooking;
  const openBookingModal = useExternalBooking ? externalOpenBooking! : () => setBookingModalOpen(true);
  const closeBookingModal = () => setBookingModalOpen(false);

  // Whether we're showing AI-generated results or the original placeholders
  const showPlaceholders = designs.length === 0;

  // ── Generate ──
  const handleGenerate = async () => {
    if (!prompt.trim() || loading) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: prompt.trim(),
          style: selectedStyle,
          placement: selectedPlacement,
          count: 4,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Generation failed");
      const newDesigns = Array.isArray(data.designs) ? data.designs : [];
      setDesigns(newDesigns);
      if (newDesigns.length > 0) setLastGeneratedPrompt(prompt.trim());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="studio-layout">
      {/* ── LEFT: Prompt Panel ── */}
      <div className="prompt-panel">
        <label>Describe Your Tattoo</label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g. A geometric snake coiling around a chrysanthemum, fine line work, minimal shading…"
        />

        <label style={{ marginTop: 24 }}>Pick a Style</label>
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

        <label style={{ marginTop: 24 }}>Placement</label>
        <div className="placement-row">
          {PLACEMENTS.map((p) => (
            <button
              key={p}
              className={`placement-tag ${selectedPlacement === p ? "active" : ""}`}
              onClick={() => setSelectedPlacement(p)}
            >
              {p}
            </button>
          ))}
        </div>

        <button
          className="generate-btn"
          onClick={handleGenerate}
          disabled={loading || !prompt.trim()}
        >
          {loading ? (
            <>
              <GenerateIcon style={{ animation: "spin 0.8s linear infinite" }} />
              Generating…
            </>
          ) : (
            <>
              <GenerateIcon />
              Generate Designs
            </>
          )}
        </button>

        {error && <p className="studio-error">{error}</p>}
      </div>

      {/* ── RIGHT: Gallery ── */}
      <div className="gallery-panel">
        <div className="gallery-grid">
          {showPlaceholders
            ? // Original placeholder cards with SVG sketches
              PLACEHOLDER_SVGS.map((svg, i) => (
                <div
                  key={i}
                  className="gallery-card"
                  style={{ background: CARD_BG[i] }}
                >
                  <div dangerouslySetInnerHTML={{ __html: svg }} />
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
            : // AI-generated SVGs from the API
              designs.map((svg, i) => (
                <div
                  key={i}
                  className="gallery-card"
                  style={{ background: CARD_BG[i % CARD_BG.length] }}
                >
                  <div dangerouslySetInnerHTML={{ __html: svg }} />
                  <div className="card-overlay">
                    <button
                      type="button"
                      className="overlay-btn"
                      onClick={() =>
                        openBookingModal()
                      }
                    >
                      <ArrowIcon /> Book This
                    </button>
                  </div>
                </div>
              ))}
        </div>

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
              onClick={() => openBookingModal()}
            >
              View Calendar
            </button>
            <button
              type="button"
              className="btn-primary"
              onClick={() => openBookingModal()}
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
