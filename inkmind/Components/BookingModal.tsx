"use client";

import { useState, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";

// Static calendar: one month view — 7 columns (Sun–Sat), numbers 1–28
const DAYS_HEADER = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DAYS_IN_MONTH = 28; // simple grid

function GoldCheckmark() {
  return (
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="24" cy="24" r="22" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <path d="M14 24l8 8 16-18" />
    </svg>
  );
}

interface BookingModalProps {
  open: boolean;
  onClose: () => void;
}

export default function BookingModal({ open, onClose }: BookingModalProps) {
  const [reserved, setReserved] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) onClose();
    },
    [onClose]
  );

  const handleDateClick = useCallback(() => {
    setReserved(true);
  }, []);

  const handleClose = useCallback(() => {
    setReserved(false);
    onClose();
  }, [onClose]);

  if (!open) return null;

  const modal = (
    <div className="booking-modal-backdrop" onClick={handleBackdropClick} role="dialog" aria-modal="true" aria-labelledby="booking-modal-title">
      <div className="booking-modal-panel" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className="booking-modal-close"
          onClick={handleClose}
          aria-label="Close"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>

        {reserved ? (
          <div className="booking-modal-success">
            <div className="booking-modal-success-icon" style={{ animationDelay: "0.1s" }}>
              <GoldCheckmark />
            </div>
            <h2 id="booking-modal-title" className="booking-modal-success-title" style={{ animationDelay: "0.2s" }}>
              Design Reserved
            </h2>
            <p className="booking-modal-success-sub" style={{ animationDelay: "0.3s" }}>
              We&apos;ll confirm your session shortly.
            </p>
            <button type="button" className="booking-modal-done-btn" onClick={handleClose} style={{ animationDelay: "0.4s" }}>
              Done
            </button>
          </div>
        ) : (
          <>
            <h2 id="booking-modal-title" className="booking-modal-title" style={{ animationDelay: "0.1s" }}>
              Select a Date
            </h2>
            <p className="booking-modal-sub" style={{ animationDelay: "0.15s" }}>
              Choose a day for your design consultation.
            </p>
            <div className="booking-modal-calendar" style={{ animationDelay: "0.2s" }}>
              <div className="booking-calendar-header">
                {DAYS_HEADER.map((d) => (
                  <span key={d} className="booking-calendar-day-label">{d}</span>
                ))}
              </div>
              <div className="booking-calendar-grid">
                {Array.from({ length: DAYS_IN_MONTH }, (_, i) => i + 1).map((day) => (
                  <button
                    key={day}
                    type="button"
                    className="booking-calendar-cell"
                    onClick={handleDateClick}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );

  return mounted && typeof document !== "undefined"
    ? createPortal(modal, document.body)
    : null;
}
