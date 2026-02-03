"use client";

import { useState, useEffect } from "react";

// ─── TYPES ───────────────────────────────────────────────────────────────────

type WizardStep = "meaning" | "placement" | "size" | "vibe" | "elements" | "review";

interface WizardState {
  meaning: string | null;      // "personal" | "aesthetic" | "memory" | "someone"
  placement: string | null;    // "Forearm" | "Upper Arm" etc
  size: string | null;         // "small" | "medium" | "large"
  vibe: string | null;         // "bold" | "subtle" | "edgy" | "elegant" | "fun"
  elements: string;            // free text, optional
}

interface ConversationalWizardProps {
  onComplete: (finalPrompt: string, placement: string) => void;
  selectedStyle: string;
  isPaid?: boolean;
  disclaimerAccepted?: boolean;
  /** Called when wizard state changes so parent can pre-fill manual mode on eject */
  onPromptChange?: (prompt: string, placement: string | null) => void;
}

// ─── DATA ────────────────────────────────────────────────────────────────────

const MEANING_OPTIONS = [
  { id: "personal", label: "Something Personal", desc: "Marks a life event or belief" },
  { id: "aesthetic", label: "Just Aesthetics", desc: "I like how it looks" },
  { id: "memory", label: "A Memory", desc: "Commemorates someone or something" },
  { id: "someone", label: "Represents Someone", desc: "Tribute to a person" },
];

const PLACEMENT_OPTIONS = [
  "Forearm", "Upper Arm", "Chest", "Back", "Thigh", "Shoulder", "Calf",
  "General / Other",
];

const SIZE_OPTIONS = [
  { id: "small", label: "Small", desc: "Palm-sized or smaller" },
  { id: "medium", label: "Medium", desc: "Fist-sized, noticeable" },
  { id: "large", label: "Large", desc: "Bigger than your hand, statement piece" },
];

const VIBE_OPTIONS = [
  { id: "bold", label: "Bold Statement", desc: "Demands attention" },
  { id: "subtle", label: "Subtle & Refined", desc: "Understated elegance" },
  { id: "edgy", label: "Edgy", desc: "Dark, intense, raw" },
  { id: "elegant", label: "Elegant", desc: "Graceful, sophisticated" },
  { id: "fun", label: "Fun", desc: "Playful, doesn't take itself seriously" },
];

const STEP_ORDER: WizardStep[] = ["meaning", "placement", "size", "vibe", "elements", "review"];

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function buildPrompt(state: WizardState, style: string): string {
  const parts: string[] = [];

  // Meaning context
  if (state.meaning === "personal") parts.push("A deeply personal tattoo design");
  else if (state.meaning === "memory") parts.push("A memorial tattoo design");
  else if (state.meaning === "someone") parts.push("A tribute tattoo design");
  else parts.push("A tattoo design");

  // Elements
  if (state.elements.trim()) parts.push(`featuring ${state.elements.trim()}`);

  // Vibe
  if (state.vibe === "bold") parts.push("with bold, eye-catching composition");
  else if (state.vibe === "subtle") parts.push("with subtle, refined details");
  else if (state.vibe === "edgy") parts.push("with dark, intense energy");
  else if (state.vibe === "elegant") parts.push("with graceful, sophisticated linework");
  else if (state.vibe === "fun") parts.push("with playful, lighthearted character");

  // Size context
  if (state.size === "small") parts.push("scaled for a small, intimate placement");
  else if (state.size === "medium") parts.push("medium-sized and noticeable");
  else if (state.size === "large") parts.push("large-scale statement piece");

  // Style
  parts.push(`in ${style} style`);

  // Placement (for composition)
  if (state.placement) parts.push(`optimized for ${state.placement.toLowerCase()} placement`);

  return parts.join(", ") + ".";
}

// ─── ICONS ───────────────────────────────────────────────────────────────────

function BackIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 16, height: 16 }}>
      <path d="M19 12H5M12 19l-7-7 7-7" />
    </svg>
  );
}

function NextIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 16, height: 16 }}>
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  );
}

// ─── COMPONENT ───────────────────────────────────────────────────────────────

function DiamondIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 16, height: 16 }}>
      <path d="M12 2L2 9l4 13h12l4-13L12 2zm0 2.5l6.5 5H5.5L12 4.5zM5.5 11h13L17 20H7L5.5 11z" />
    </svg>
  );
}

export default function ConversationalWizard({ onComplete, selectedStyle, isPaid = false, disclaimerAccepted = false, onPromptChange }: ConversationalWizardProps) {
  const [currentStep, setCurrentStep] = useState<WizardStep>("meaning");
  const [state, setState] = useState<WizardState>({
    meaning: null,
    placement: null,
    size: null,
    vibe: null,
    elements: "",
  });

  useEffect(() => {
    onPromptChange?.(buildPrompt(state, selectedStyle), state.placement);
  }, [state, selectedStyle]);

  const stepIndex = STEP_ORDER.indexOf(currentStep);
  const canGoBack = stepIndex > 0;
  const canGoNext = () => {
    if (currentStep === "meaning") return state.meaning !== null;
    if (currentStep === "placement") return state.placement !== null;
    if (currentStep === "size") return state.size !== null;
    if (currentStep === "vibe") return state.vibe !== null;
    if (currentStep === "elements") return true; // optional
    if (currentStep === "review") return disclaimerAccepted;
    return false;
  };

  const handleBack = () => {
    if (canGoBack) setCurrentStep(STEP_ORDER[stepIndex - 1]);
  };

  const handleNext = () => {
    if (!canGoNext()) return;
    if (currentStep === "review") {
      // Generate
      const finalPrompt = buildPrompt(state, selectedStyle);
      onComplete(finalPrompt, state.placement!);
    } else {
      setCurrentStep(STEP_ORDER[stepIndex + 1]);
    }
  };

  const updateState = (key: keyof WizardState, value: any) => {
    setState((prev) => ({ ...prev, [key]: value }));
  };

  // Progress indicator
  const progress = ((stepIndex + 1) / STEP_ORDER.length) * 100;

  return (
    <div className="wizard-container">
      {/* Progress bar */}
      <div className="wizard-progress-track">
        <div className="wizard-progress-fill" style={{ width: `${progress}%` }} />
      </div>

      {/* Step content */}
      <div className="wizard-step-content">
        {currentStep === "meaning" && (
          <div className="wizard-step">
            <h3 className="wizard-question">What's this tattoo about?</h3>
            <p className="wizard-hint">This helps us understand the tone and approach.</p>
            <div className="wizard-options-grid">
              {MEANING_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  className={`wizard-option-card ${state.meaning === opt.id ? "active" : ""}`}
                  onClick={() => updateState("meaning", opt.id)}
                >
                  <span className="wizard-option-label">{opt.label}</span>
                  <span className="wizard-option-desc">{opt.desc}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {currentStep === "placement" && (
          <div className="wizard-step">
            <h3 className="wizard-question">Where on your body?</h3>
            <p className="wizard-hint">Placement changes how the design needs to be composed.</p>
            <div className="wizard-placement-grid">
              {PLACEMENT_OPTIONS.map((p) => (
                <button
                  key={p}
                  type="button"
                  className={`wizard-placement-btn ${state.placement === p ? "active" : ""}`}
                  onClick={() => updateState("placement", p)}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}

        {currentStep === "size" && (
          <div className="wizard-step">
            <h3 className="wizard-question">How big are we talking?</h3>
            <p className="wizard-hint">Size affects detail level and visual impact.</p>
            <div className="wizard-options-grid">
              {SIZE_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  className={`wizard-option-card ${state.size === opt.id ? "active" : ""}`}
                  onClick={() => updateState("size", opt.id)}
                >
                  <span className="wizard-option-label">{opt.label}</span>
                  <span className="wizard-option-desc">{opt.desc}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {currentStep === "vibe" && (
          <div className="wizard-step">
            <h3 className="wizard-question">What's the vibe?</h3>
            <p className="wizard-hint">This sets the emotional tone of the design.</p>
            <div className="wizard-options-grid">
              {VIBE_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  className={`wizard-option-card ${state.vibe === opt.id ? "active" : ""}`}
                  onClick={() => updateState("vibe", opt.id)}
                >
                  <span className="wizard-option-label">{opt.label}</span>
                  <span className="wizard-option-desc">{opt.desc}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {currentStep === "elements" && (
          <div className="wizard-step">
            <h3 className="wizard-question">Any specific elements?</h3>
            <p className="wizard-hint">Optional — anything you definitely want included?</p>
            <textarea
              className="wizard-textarea"
              value={state.elements}
              onChange={(e) => updateState("elements", e.target.value)}
              placeholder="e.g. a snake, chrysanthemums, my dad's initials..."
              rows={4}
            />
          </div>
        )}

        {currentStep === "review" && (
          <div className="wizard-step">
            <h3 className="wizard-question">Ready to generate?</h3>
            <p className="wizard-hint">Here's what we're creating:</p>
            <div className="wizard-review-box">
              <div className="wizard-review-row">
                <span className="wizard-review-label">Meaning:</span>
                <span className="wizard-review-value">
                  {MEANING_OPTIONS.find((o) => o.id === state.meaning)?.label || "—"}
                </span>
              </div>
              <div className="wizard-review-row">
                <span className="wizard-review-label">Placement:</span>
                <span className="wizard-review-value">{state.placement || "—"}</span>
              </div>
              <div className="wizard-review-row">
                <span className="wizard-review-label">Size:</span>
                <span className="wizard-review-value">
                  {SIZE_OPTIONS.find((o) => o.id === state.size)?.label || "—"}
                </span>
              </div>
              <div className="wizard-review-row">
                <span className="wizard-review-label">Vibe:</span>
                <span className="wizard-review-value">
                  {VIBE_OPTIONS.find((o) => o.id === state.vibe)?.label || "—"}
                </span>
              </div>
              {state.elements.trim() && (
                <div className="wizard-review-row">
                  <span className="wizard-review-label">Elements:</span>
                  <span className="wizard-review-value">{state.elements}</span>
                </div>
              )}
              <div className="wizard-review-row">
                <span className="wizard-review-label">Style:</span>
                <span className="wizard-review-value">{selectedStyle}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="wizard-nav">
        <button
          type="button"
          className="wizard-btn-back"
          onClick={handleBack}
          disabled={!canGoBack}
        >
          <BackIcon />
          Back
        </button>
        <button
          type="button"
          className={`wizard-btn-next ${currentStep === "review" && isPaid ? "wizard-btn-next-premium" : ""}`}
          onClick={handleNext}
          disabled={!canGoNext()}
        >
          {currentStep === "review" && isPaid && <DiamondIcon />}
          {currentStep === "review" ? "Generate Designs" : "Next"}
          <NextIcon />
        </button>
      </div>
    </div>
  );
}
