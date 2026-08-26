"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export const INTRO_SEEN_KEY = "ello-intro-seen";
export const INTRO_COMPLETE_EVENT = "ello:intro-complete";
const INTRO_DURATION_MS = 5000;

export function SiteIntro() {
  const [visible, setVisible] = useState(true);
  const [leaving, setLeaving] = useState(false);
  const hideTimer = useRef<number | null>(null);

  const dismiss = useCallback(() => {
    if (leaving) return;
    try { window.sessionStorage.setItem(INTRO_SEEN_KEY, "1"); } catch { /* Storage can be unavailable in private contexts. */ }
    window.dispatchEvent(new Event(INTRO_COMPLETE_EVENT));
    setLeaving(true);
    hideTimer.current = window.setTimeout(() => setVisible(false), 650);
  }, [leaving]);

  useEffect(() => {
    let alreadySeen = false;
    try { alreadySeen = window.sessionStorage.getItem(INTRO_SEEN_KEY) === "1"; } catch { /* Continue without persistence. */ }
    if (!alreadySeen && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const frame = window.requestAnimationFrame(() => setVisible(false));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (!visible) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previousOverflow; };
  }, [visible]);

  useEffect(() => {
    if (!visible || leaving) return;
    const timer = window.setTimeout(dismiss, INTRO_DURATION_MS);
    return () => window.clearTimeout(timer);
  }, [dismiss, leaving, visible]);

  useEffect(() => () => {
    if (hideTimer.current !== null) window.clearTimeout(hideTimer.current);
  }, []);

  if (!visible) return null;

  return (
    <div
      aria-label="Introduction ell’o"
      className={`fixed inset-0 z-[100] grid place-items-center bg-night transition-opacity duration-700 ${leaving ? "pointer-events-none opacity-0" : "opacity-100"}`}
    >
      <div className="intro-veil absolute inset-0 grid place-items-center overflow-hidden bg-night" aria-hidden="true">
        <div className="intro-glow absolute left-1/2 top-1/2 size-[min(82vw,44rem)] -translate-x-1/2 -translate-y-1/2 rounded-full" />
        <div className="intro-lockup relative flex flex-col items-center">
          <div className="intro-wordmark flex items-baseline" aria-label="ell’o">
            {["e", "l", "l", "’", "o"].map((letter, index) => (
              <span key={`${letter}-${index}`} className="intro-letter" style={{ animationDelay: `${0.35 + index * 0.12}s` }}>{letter}</span>
            ))}
          </div>
          <span className="intro-rule" />
          <span className="intro-tagline">Coiffure · Genève</span>
        </div>
      </div>
      <button
        type="button"
        onClick={dismiss}
        className="absolute bottom-6 right-6 border border-ivory/45 bg-night/40 px-5 py-3 text-[.62rem] font-normal uppercase tracking-[.17em] text-ivory backdrop-blur-sm transition hover:border-ivory hover:bg-night/70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brass sm:bottom-10 sm:right-10"
      >
        Passer l’introduction
      </button>
    </div>
  );
}
