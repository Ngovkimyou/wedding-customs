"use client";

import { useCallback, useEffect, useRef } from "react";

export default function useSoundEffect(source, volume = 0.42) {
  const audioRef = useRef(null);

  useEffect(() => {
    const audio = new Audio(source);
    audio.preload = "auto";
    audio.volume = volume;
    audioRef.current = audio;

    return () => {
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
      audioRef.current = null;
    };
  }, [source, volume]);

  return useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = 0;
    audio.play().catch(() => {});
  }, []);
}
