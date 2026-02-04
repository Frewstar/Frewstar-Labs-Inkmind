"use client";

import { useState } from "react";
import { markDesignPaid } from "./actions";

type DesignRow = {
  id: string;
  prompt: string;
  imageUrl: string;
  isPaid: boolean;
  clientEmail: string | null;
};

export default function AdminDesignRow({ design }: { design: DesignRow }) {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleMarkPaid() {
    setLoading(true);
    const result = await markDesignPaid(design.id);
    setLoading(false);
    if (!result.error) setDone(true);
  }

  return (
    <tr className="border-b border-white/10">
      <td className="py-3 pr-4 text-sm text-[var(--white)]/90">
        {design.clientEmail ?? "—"}
      </td>
      <td className="py-3 pr-4 text-sm text-[var(--grey)] max-w-[280px] truncate" title={design.prompt}>
        {design.prompt}
      </td>
      <td className="py-3 pr-4">
        <a
          href={`/api/download?url=${encodeURIComponent(design.imageUrl)}&filename=tattoo-design.png`}
          className="inline-block w-16 h-16 rounded-[var(--radius)] overflow-hidden border border-white/10 bg-[var(--bg)]"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={design.imageUrl}
            alt=""
            className="w-full h-full object-cover"
            width={64}
            height={64}
          />
        </a>
      </td>
      <td className="py-3">
        {design.isPaid ? (
          <span className="text-xs font-medium text-[var(--gold)]">Paid</span>
        ) : (
          <button
            type="button"
            onClick={handleMarkPaid}
            disabled={loading || done}
            className="rounded-[var(--radius)] border border-[var(--gold)]/50 bg-[var(--gold-dim)] px-3 py-1.5 text-xs font-medium text-[var(--gold)] hover:bg-[var(--gold-glow)] hover:text-[var(--white)] disabled:opacity-50"
          >
            {loading ? "…" : done ? "Done" : "Mark paid"}
          </button>
        )}
      </td>
    </tr>
  );
}
