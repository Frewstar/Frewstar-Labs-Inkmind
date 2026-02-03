"use client";

import { useState } from "react";

const SYSTEM_PROMPT =
  "You are a helpful assistant for Frewstar Labs Tattoo Design Studio. Keep replies concise and on-topic.";

export const XAI_MODELS = [
  { id: "grok-4-latest", label: "Grok 4 (latest)" },
  { id: "grok-4", label: "Grok 4" },
  { id: "grok-4-fast-reasoning", label: "Grok 4 Fast (reasoning)" },
  { id: "grok-4-fast-non-reasoning", label: "Grok 4 Fast (non-reasoning)" },
  { id: "grok-4-1-fast-reasoning", label: "Grok 4.1 Fast (reasoning)" },
  { id: "grok-4-1-fast-non-reasoning", label: "Grok 4.1 Fast (non-reasoning)" },
] as const;

export type GrokChatProps = {
  /** When set, parent controls which Grok model is used (e.g. for wizard + chat). */
  model?: string;
  onModelChange?: (modelId: string) => void;
};

export default function GrokChat({ model: controlledModel, onModelChange }: GrokChatProps = {}) {
  const [input, setInput] = useState("");
  const [internalModel, setInternalModel] = useState<string>(XAI_MODELS[0].id);
  const model = controlledModel ?? internalModel;
  const setModel = onModelChange ?? setInternalModel;
  const [reply, setReply] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setLoading(true);
    setError(null);
    setReply(null);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: text },
          ],
          model,
          stream: false,
          temperature: 0,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = data.details ? `${data.error ?? "Error"}: ${data.details}` : (data.error ?? "Request failed");
        setError(msg);
        setLoading(false);
        return;
      }
      setReply(data.content ?? "");
      setInput("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grok-chat" style={{ marginTop: 24 }}>
      <p className="section-label" style={{ marginBottom: 8 }}>Chat with Grok</p>
      <div style={{ marginBottom: 10 }}>
        <label htmlFor="grok-model" style={{ marginRight: 8, fontSize: 14 }}>Model</label>
        <select
          id="grok-model"
          value={model}
          onChange={(e) => setModel(e.target.value)}
          disabled={loading}
          style={{
            padding: "8px 12px",
            borderRadius: 8,
            border: "1px solid #ccc",
            fontSize: 14,
            minWidth: 220,
          }}
        >
          {XAI_MODELS.map((m) => (
            <option key={m.id} value={m.id}>{m.label}</option>
          ))}
        </select>
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Ask anything..."
          disabled={loading}
          className="grok-input"
          style={{
            flex: "1 1 200px",
            padding: "10px 12px",
            border: "1px solid #ccc",
            borderRadius: 8,
            fontSize: 14,
          }}
        />
        <button
          type="button"
          onClick={send}
          disabled={loading || !input.trim()}
          className="btn-outline"
          style={{ flexShrink: 0 }}
        >
          {loading ? "..." : "Send"}
        </button>
      </div>
      {error && (
        <p className="studio-error" style={{ marginTop: 8 }}>{error}</p>
      )}
      {reply !== null && (
        <div
          className="grok-reply"
          style={{
            marginTop: 12,
            padding: 12,
            background: "#f5f5f5",
            borderRadius: 8,
            fontSize: 14,
            whiteSpace: "pre-wrap",
          }}
        >
          {reply}
        </div>
      )}
    </div>
  );
}
