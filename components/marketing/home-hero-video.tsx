"use client";

import { useEffect, useRef } from "react";
import { INTRO_COMPLETE_EVENT, INTRO_SEEN_KEY } from "@/components/marketing/site-intro";

export function HomeHeroVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const playFromStart = () => {
      video.currentTime = 0;
      void video.play().catch(() => undefined);
    };

    let introSeen = false;
    try { introSeen = window.sessionStorage.getItem(INTRO_SEEN_KEY) === "1"; } catch { /* Start after the intro event. */ }
    if (introSeen || window.matchMedia("(prefers-reduced-motion: reduce)").matches) playFromStart();
    else video.pause();

    window.addEventListener(INTRO_COMPLETE_EVENT, playFromStart);
    return () => window.removeEventListener(INTRO_COMPLETE_EVENT, playFromStart);
  }, []);

  return (
    <video ref={videoRef} loop muted playsInline preload="metadata" aria-hidden="true" className="h-full w-full object-cover object-center opacity-55">
      <source src="/videos/ello-home-hero.mp4" type="video/mp4" />
    </video>
  );
}
