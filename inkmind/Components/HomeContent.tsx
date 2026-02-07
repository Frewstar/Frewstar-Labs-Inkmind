"use client";

import { useState } from "react";
import DesignStudio from "@/components/DesignStudio";
import InstagramPortfolio from "@/components/InstagramPortfolio";
import BookingModal from "@/components/BookingModal";
import { LOGO_PATH, LOGO_ALT } from "@/lib/branding";

type HomeContentProps = {
  designGallerySlot?: React.ReactNode;
  signedInAs?: string | null;
  signedInUserId?: string | null;
  authNav?: React.ReactNode;
};

export default function HomeContent({ designGallerySlot, signedInAs, signedInUserId, authNav }: HomeContentProps) {
  const [bookingModalOpen, setBookingModalOpen] = useState(false);

  return (
    <>
      {/* ─── NAV ─── */}
      <nav>
        <a href="#" className="nav-logo">
          <img src={LOGO_PATH} alt={LOGO_ALT} className="nav-logo-img" />
        </a>
        <div className="nav-links">
          <a href="#how">How It Works</a>
          <a href="#studio">Design Studio</a>
          <a href="#portfolio">Portfolio</a>
          <a href="#why">Why Frewstar Labs</a>
          <a href="#book">Book</a>
          {signedInAs && (
            <span
              className="nav-signed-in"
              title={signedInUserId ? `User ID (profile_id): ${signedInUserId}` : "Signed in"}
            >
              {signedInAs.includes("@") ? signedInAs : `Signed in (${signedInAs.slice(0, 8)}…)`}
            </span>
          )}
          {authNav && <span className="nav-auth-wrap">{authNav}</span>}
        </div>
      </nav>

      {/* ─── HERO ─── */}
      <section className="hero">
        <p className="hero-eyebrow animate-hero-eyebrow">
          AI Tattoo Design Studio
        </p>
        <h1 className="animate-hero-h1">
          Your idea.<br />
          <em>His style.</em><br />
          One tap to book.
        </h1>
        <p className="hero-sub animate-hero-sub">
          Describe the tattoo you&apos;re imagining. Frewstar Labs generates designs in
          your artist&apos;s signature style — then you book directly. No DMs, no
          guesswork.
        </p>
        <div className="hero-cta animate-hero-cta">
          <a href="#studio" className="btn-primary">
            Start Designing
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </a>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section id="how">
        <div className="section-inner">
          <p className="section-label">How It Works</p>
          <h2 className="section-title">
            Three steps from idea to appointment.
          </h2>
          <div className="steps-wrap">
            <div className="steps">
              <div className="step-card">
                <div className="step-num">01</div>
                <h3>Describe Your Idea</h3>
                <p>
                  Tell us what you&apos;re thinking — themes, mood, references.
                  The more detail, the better the result. No art skills needed.
                </p>
              </div>
              <div className="step-card">
                <div className="step-num">02</div>
                <h3>See It in His Style</h3>
                <p>
                  The AI generates designs trained on this artist&apos;s actual
                  portfolio. What you see is genuinely close to what you&apos;d
                  get on skin.
                </p>
              </div>
              <div className="step-card">
                <div className="step-num">03</div>
                <h3>Book Your Session</h3>
                <p>
                  Loved a design? One tap takes you to booking. Pick a date, pay
                  your deposit, and you&apos;re locked in. That simple.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── DESIGN STUDIO ─── */}
      <section id="studio" className="studio">
        <div className="section-inner">
          <p className="section-label">Design Studio</p>
          <h2 className="section-title">
            Describe what you want. Watch it come to life.
          </h2>
          <DesignStudio onOpenBooking={() => setBookingModalOpen(true)} />
        </div>
      </section>

      {/* ─── MY DESIGNS (saved in DB, per user) — rendered as Server Component slot ─── */}
      <section id="my-designs" className="studio my-designs-section">
        <div className="section-inner">
          <p className="section-label">My Designs</p>
          <h2 className="section-title">
            Your collection
          </h2>
          <div className="design-gallery-slot">
            {designGallerySlot}
          </div>
        </div>
      </section>

      {/* ─── INSTAGRAM PORTFOLIO ─── */}
      <section id="portfolio" className="portfolio-section">
        <InstagramPortfolio />
      </section>

      {/* ─── WHY INKMIND ─── */}
      <section id="why">
        <div className="section-inner">
          <p className="section-label">Why InkMind</p>
          <h2 className="section-title">
            Built different. Designed for artists who take their craft seriously.
          </h2>
          <div className="why-grid">
            <div className="why-card">
              <div className="why-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" />
                </svg>
              </div>
              <div>
                <h3>Trained on His Work</h3>
                <p>Not generic AI output. The model learns from this artist&apos;s actual portfolio — line weight, shading, colour palette, signature moves.</p>
              </div>
            </div>
            <div className="why-card">
              <div className="why-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
              <div>
                <h3>Zero Drop-Off</h3>
                <p>Design exploration flows straight into booking. The moment someone&apos;s excited about a design, the path to your chair is one tap away.</p>
              </div>
            </div>
            <div className="why-card">
              <div className="why-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              </div>
              <div>
                <h3>Your Calendar, Your Rules</h3>
                <p>Set your own availability, rates, and deposit requirements. Clients see exactly when you&apos;re free and book accordingly.</p>
              </div>
            </div>
            <div className="why-card">
              <div className="why-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <div>
                <h3>Clear Briefs Every Time</h3>
                <p>By the time a client books, you already know the style, placement, and mood. Less guesswork, better consultations, happier clients.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── BOOK (calendar / booking CTA) ─── */}
      <section id="book" className="book-section">
        <div className="section-inner">
          <p className="section-label">Book</p>
          <h2 className="section-title">
            Pick a date. Lock your session.
          </h2>
          <p className="book-section-sub">
            See real availability and pay your deposit in one flow. No back-and-forth.
          </p>
          <div className="book-section-actions">
            <button
              type="button"
              className="btn-outline"
              onClick={() => setBookingModalOpen(true)}
            >
              View Calendar
            </button>
            <button
              type="button"
              className="btn-primary"
              onClick={() => setBookingModalOpen(true)}
            >
              Book a Session
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer>
        <div className="footer-logo">
          <img src={LOGO_PATH} alt={LOGO_ALT} className="footer-logo-img" />
        </div>
        <p>AI-powered tattoo design. Built by Frewstar Labs.</p>
        <p style={{ marginTop: "6px", color: "#333" }}>
          © 2026 Frewstar Labs. All rights reserved.
        </p>
      </footer>

      <BookingModal open={bookingModalOpen} onClose={() => setBookingModalOpen(false)} />
    </>
  );
}
