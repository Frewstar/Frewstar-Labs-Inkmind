"use client";

export type ModelOption = "basic" | "standard" | "high";

const OPTIONS: { id: ModelOption; label: string; description: string }[] = [
  { id: "basic", label: "Basic", description: "FLUX Schnell — fast, good for drafts" },
  { id: "standard", label: "Standard", description: "Gemini (free tier)" },
  { id: "high", label: "High Quality", description: "Vertex AI (paid tier)" },
];

type ModelSelectorProps = {
  value: ModelOption;
  onChange: (model: ModelOption) => void;
};

export default function ModelSelector({ value, onChange }: ModelSelectorProps) {
  return (
    <div style={{ marginTop: 24 }}>
      <label style={{ marginBottom: 4, display: "block", fontSize: 14, fontWeight: 600, color: "var(--white)" }}>
        Choose generation model
      </label>
      <p style={{ marginBottom: 10, fontSize: 12, color: "var(--grey)" }}>
        Which AI engine creates your designs
      </p>
      <div className="style-grid style-grid-scroll" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
        {OPTIONS.map((opt) => (
          <button
            key={opt.id}
            type="button"
            className={`style-chip ${value === opt.id ? "active" : ""}`}
            onClick={() => onChange(opt.id)}
          >
            {opt.label}
          </button>
        ))}
      </div>
      <p style={{ marginTop: 6, fontSize: 12, color: "var(--grey)" }}>
        {OPTIONS.find((o) => o.id === value)?.description}
      </p>
    </div>
  );
}
