"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import chanFlowerBackdrop from "../assets/chan-flower-backdrop.avif";
import musicIcon from "../assets/icons/music-icon.avif";
import {
  DEFAULT_MUSIC_MODE,
  INITIAL_MANUAL_SELECTION,
  INITIAL_PLAYLIST_INDEXES,
  MUSIC_CHOICES,
  MUSIC_PLAYLISTS,
  getMusicChoiceId,
  getPageMusicMode,
} from "../data/music.js";
import { ARCHIVE_READY_EVENT } from "../lib/client-navigation.js";
import ScrollIndicator from "./ScrollIndicator.js";

const DEFAULT_VOLUME = 1;
const MUSIC_FADE_DURATION = 850;
const PAGE_MUSIC_FADE_DURATION = 180;
const MUSIC_STORAGE_KEY = "khmer-wedding-archive:music-session";
const MUSIC_STORAGE_VERSION = 1;

const MUSIC_TRACK_SOURCES = new Set(
  Object.values(MUSIC_PLAYLISTS).flat().map((track) => track.source),
);

function normalizePlaylistIndex(mode, index) {
  const playlistLength = MUSIC_PLAYLISTS[mode]?.length ?? 1;
  const numericIndex = Number(index);

  if (!Number.isInteger(numericIndex)) {
    return 0;
  }

  return ((numericIndex % playlistLength) + playlistLength) % playlistLength;
}

function readPersistedMusicState() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const rawState = window.sessionStorage.getItem(MUSIC_STORAGE_KEY);
    const savedState = rawState ? JSON.parse(rawState) : null;

    if (!savedState || savedState.version !== MUSIC_STORAGE_VERSION) {
      return null;
    }

    const savedMode = savedState.mode === DEFAULT_MUSIC_MODE
      || Object.prototype.hasOwnProperty.call(MUSIC_PLAYLISTS, savedState.mode)
      ? savedState.mode
      : DEFAULT_MUSIC_MODE;
    const savedManualMode = Object.prototype.hasOwnProperty.call(
      MUSIC_PLAYLISTS,
      savedState.manualSelection?.mode,
    )
      ? savedState.manualSelection.mode
      : INITIAL_MANUAL_SELECTION.mode;
    const playlistIndexes = Object.fromEntries(
      Object.keys(MUSIC_PLAYLISTS).map((playlistMode) => [
        playlistMode,
        normalizePlaylistIndex(playlistMode, savedState.playlistIndexes?.[playlistMode]),
      ]),
    );
    const playbackPositions = Object.fromEntries(
      Object.entries(savedState.playbackPositions ?? {}).filter(([source, position]) => (
        MUSIC_TRACK_SOURCES.has(source)
        && Number.isFinite(position)
        && position >= 0
      )),
    );

    return {
      mode: savedMode,
      manualSelection: {
        mode: savedManualMode,
        trackIndex: normalizePlaylistIndex(
          savedManualMode,
          savedState.manualSelection?.trackIndex,
        ),
      },
      playlistIndexes,
      playbackPositions,
      wasPlaying: savedState.wasPlaying === true,
    };
  } catch {
    return null;
  }
}

function clampVolume(volume) {
  const safeVolume = Number.isFinite(volume) ? volume : 0;
  return Math.min(Math.max(safeVolume, 0), 1);
}

function setAudioSource(audio, source) {
  const absoluteSource = new URL(source, window.location.href).href;
  if (audio.src === absoluteSource || audio.currentSrc === absoluteSource) {
    return false;
  }

  audio.src = source;
  audio.load();
  return true;
}

function fadeAudioVolume(audio, nextVolume, duration, transitionId, transitionIdRef) {
  const previousVolume = audio.volume;
  const targetVolume = clampVolume(nextVolume);

  if (duration <= 0 || previousVolume === targetVolume) {
    audio.volume = targetVolume;
    return Promise.resolve(transitionIdRef.current === transitionId);
  }

  return new Promise((resolve) => {
    const startedAt = performance.now();

    const step = (now) => {
      if (transitionIdRef.current !== transitionId) {
        resolve(false);
        return;
      }

      const progress = Math.min((now - startedAt) / duration, 1);
      audio.volume = clampVolume(previousVolume + (targetVolume - previousVolume) * progress);

      if (progress < 1) {
        requestAnimationFrame(step);
        return;
      }

      resolve(true);
    };

    requestAnimationFrame(step);
  });
}

function TrackLabel({ track }) {
  return (
    <>
      <span>{track.label}</span>
      {track.variant ? <em className="music-choice__variant">{track.variant}</em> : null}
    </>
  );
}

export default function MusicControl() {
  const pathname = usePathname();
  const audioRef = useRef(null);
  const musicPanelRef = useRef(null);
  const musicPanelBodyRef = useRef(null);
  const musicChoiceRefs = useRef(new Map());
  const previouslyFocusedRef = useRef(null);
  const panelCloseTimerRef = useRef(null);
  const prefetchedTracksRef = useRef(new Map());
  const shouldResumeRef = useRef(false);
  const resumePendingRef = useRef(false);
  const hasRestoredMusicStateRef = useRef(false);
  const currentSourceRef = useRef(null);
  const activeModeRef = useRef(null);
  const playbackPositionsRef = useRef({});
  const transitionIdRef = useRef(0);
  const [isMounted, setIsMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isPanelClosing, setIsPanelClosing] = useState(false);
  const [panelAnimationKey, setPanelAnimationKey] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isResumePending, setIsResumePending] = useState(false);
  const [hasUserStarted, setHasUserStarted] = useState(false);
  const [mode, setMode] = useState(DEFAULT_MUSIC_MODE);
  const [manualSelection, setManualSelection] = useState(INITIAL_MANUAL_SELECTION);
  const [playlistIndexes, setPlaylistIndexes] = useState(INITIAL_PLAYLIST_INDEXES);
  const musicStateRef = useRef(null);

  musicStateRef.current = {
    mode,
    manualSelection,
    playlistIndexes,
  };

  const pageMode = getPageMusicMode(pathname);
  const activeMode = mode === DEFAULT_MUSIC_MODE ? pageMode : manualSelection.mode;
  const activePlaylist = MUSIC_PLAYLISTS[activeMode];
  const activeTrackIndex = mode === DEFAULT_MUSIC_MODE
    ? playlistIndexes[activeMode]
    : manualSelection.trackIndex;
  const activeTrack = activePlaylist[activeTrackIndex % activePlaylist.length];
  const initialAudioSourceRef = useRef(null);

  if (initialAudioSourceRef.current === null) {
    initialAudioSourceRef.current = activeTrack.source;
  }

  const saveCurrentPosition = useCallback(() => {
    const audio = audioRef.current;
    const currentSource = currentSourceRef.current;

    if (!audio || !currentSource || !Number.isFinite(audio.currentTime)) {
      return;
    }

    playbackPositionsRef.current[currentSource] = audio.ended ? 0 : audio.currentTime;
  }, []);

  const persistMusicState = useCallback((overrides = {}) => {
    if (!hasRestoredMusicStateRef.current || typeof window === "undefined") {
      return;
    }

    saveCurrentPosition();
    const audio = audioRef.current;
    const state = {
      ...musicStateRef.current,
      ...overrides,
    };

    try {
      window.sessionStorage.setItem(MUSIC_STORAGE_KEY, JSON.stringify({
        version: MUSIC_STORAGE_VERSION,
        mode: state.mode,
        manualSelection: state.manualSelection,
        playlistIndexes: state.playlistIndexes,
        playbackPositions: playbackPositionsRef.current,
        wasPlaying: Boolean(
          resumePendingRef.current || (audio && !audio.paused && !audio.ended),
        ),
      }));
    } catch {
      // Storage can be unavailable in privacy-restricted browsing contexts.
    }
  }, [saveCurrentPosition]);

  const tryResumeMusic = useCallback(() => {
    const audio = audioRef.current;

    if (!audio || !resumePendingRef.current || document.body.classList.contains("loading-screen-open")) {
      return;
    }

    audio.volume = DEFAULT_VOLUME;
    let playPromise;

    try {
      playPromise = audio.play();
    } catch {
      return;
    }

    playPromise?.then(() => {
      resumePendingRef.current = false;
      setIsResumePending(false);
      setHasUserStarted(true);
      setIsPlaying(true);
      persistMusicState();
    }).catch(() => {
      // Keep the pending state so the next user gesture can try again.
    });
  }, [persistMusicState]);

  const defaultMusicChoice = MUSIC_CHOICES[0];

  const setMusicChoiceRef = (id) => (node) => {
    if (node) {
      musicChoiceRefs.current.set(id, node);
      return;
    }

    musicChoiceRefs.current.delete(id);
  };

  const focusMusicChoice = (currentChoiceId, direction) => {
    const currentIndex = MUSIC_CHOICES.findIndex((choice) => choice.id === currentChoiceId);

    if (currentIndex === -1) {
      return;
    }

    const nextIndex = (currentIndex + direction + MUSIC_CHOICES.length) % MUSIC_CHOICES.length;
    const nextButton = musicChoiceRefs.current.get(MUSIC_CHOICES[nextIndex].id);

    nextButton?.focus();
    nextButton?.scrollIntoView({ block: "nearest" });
  };

  const isChoiceSelected = (choiceMode, nextTrackIndex = 0) => {
    if (choiceMode === DEFAULT_MUSIC_MODE) {
      return mode === DEFAULT_MUSIC_MODE;
    }

    return (
      mode !== DEFAULT_MUSIC_MODE &&
      activeMode === choiceMode &&
      activeTrackIndex % MUSIC_PLAYLISTS[choiceMode].length === nextTrackIndex
    );
  };

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const savedState = readPersistedMusicState();

    hasRestoredMusicStateRef.current = true;

    if (!savedState) {
      return;
    }

    playbackPositionsRef.current = savedState.playbackPositions;
    setMode(savedState.mode);
    setManualSelection(savedState.manualSelection);
    setPlaylistIndexes(savedState.playlistIndexes);

    if (savedState.wasPlaying) {
      resumePendingRef.current = true;
      shouldResumeRef.current = true;
      setHasUserStarted(true);
      setIsResumePending(true);
    }
  }, []);

  useEffect(() => {
    if (!isResumePending) {
      return undefined;
    }

    const handleUserGesture = () => {
      tryResumeMusic();
    };

    document.addEventListener("pointerdown", handleUserGesture, true);
    document.addEventListener("keydown", handleUserGesture, true);

    return () => {
      document.removeEventListener("pointerdown", handleUserGesture, true);
      document.removeEventListener("keydown", handleUserGesture, true);
    };
  }, [isResumePending, tryResumeMusic]);

  useEffect(() => () => {
    if (panelCloseTimerRef.current) {
      window.clearTimeout(panelCloseTimerRef.current);
    }

    prefetchedTracksRef.current.forEach((audio) => {
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
    });
    prefetchedTracksRef.current.clear();
  }, []);

  useEffect(() => {
    const audio = audioRef.current;

    if (!audio) {
      return undefined;
    }

    let lastPersistedAt = 0;
    const persistDuringPlayback = () => {
      const now = performance.now();

      if (now - lastPersistedAt < 1000) {
        return;
      }

      lastPersistedAt = now;
      persistMusicState();
    };
    const persistWhenHidden = () => {
      if (document.visibilityState === "hidden") {
        persistMusicState();
      }
    };
    const persistWhenPageHidden = () => persistMusicState();

    audio.addEventListener("timeupdate", persistDuringPlayback);
    window.addEventListener("pagehide", persistWhenPageHidden);
    document.addEventListener("visibilitychange", persistWhenHidden);

    return () => {
      audio.removeEventListener("timeupdate", persistDuringPlayback);
      window.removeEventListener("pagehide", persistWhenPageHidden);
      document.removeEventListener("visibilitychange", persistWhenHidden);
    };
  }, [persistMusicState]);

  useEffect(() => {
    if (!hasUserStarted || mode !== DEFAULT_MUSIC_MODE || activePlaylist.length < 2) {
      return undefined;
    }

    const nextTrack = activePlaylist[(activeTrackIndex + 1) % activePlaylist.length];
    const preloadTimer = window.setTimeout(() => {
      if (prefetchedTracksRef.current.has(nextTrack.source)) {
        return;
      }

      const audio = new Audio();
      audio.preload = "auto";
      audio.fetchPriority = "low";
      audio.src = nextTrack.source;
      audio.load();
      prefetchedTracksRef.current.set(nextTrack.source, audio);
    }, 900);

    return () => window.clearTimeout(preloadTimer);
  }, [activePlaylist, activeTrackIndex, hasUserStarted, mode]);

  useEffect(() => {
    const audio = audioRef.current;

    if (!audio) {
      return undefined;
    }

    const syncPlaybackState = () => {
      setIsPlaying(!audio.paused);
    };

    const playNextTrack = () => {
      if (currentSourceRef.current) {
        playbackPositionsRef.current[currentSourceRef.current] = 0;
      }

      resumePendingRef.current = false;
      setIsResumePending(false);

      if (mode !== DEFAULT_MUSIC_MODE) {
        audio.currentTime = 0;
        audio.play().catch(() => setIsPlaying(false));
        return;
      }

      const nextIndex = (activeTrackIndex + 1) % activePlaylist.length;
      const nextTrack = activePlaylist[nextIndex];

      setPlaylistIndexes((currentIndexes) => ({
        ...currentIndexes,
        [activeMode]: nextIndex,
      }));

      shouldResumeRef.current = false;
      setAudioSource(audio, nextTrack.source);
      audio.loop = activePlaylist.length === 1;
      currentSourceRef.current = nextTrack.source;
      audio.currentTime = 0;
      audio.volume = DEFAULT_VOLUME;
      audio.play().catch(() => setIsPlaying(false));
    };

    audio.addEventListener("play", syncPlaybackState);
    audio.addEventListener("pause", syncPlaybackState);
    audio.addEventListener("ended", playNextTrack);

    return () => {
      audio.removeEventListener("play", syncPlaybackState);
      audio.removeEventListener("pause", syncPlaybackState);
      audio.removeEventListener("ended", playNextTrack);
    };
  }, [activeMode, activePlaylist, activePlaylist.length, activeTrackIndex, mode]);

  useEffect(() => {
    const audio = audioRef.current;

    if (!audio) {
      return;
    }

    const transitionToTrack = async () => {
      const transitionId = transitionIdRef.current + 1;
      const nextSource = activeTrack.source;
      const previousSource = currentSourceRef.current;
      const previousActiveMode = activeModeRef.current;
      const isDefaultPageChange = mode === DEFAULT_MUSIC_MODE
        && previousActiveMode !== null
        && previousActiveMode !== activeMode;
      const fadeDuration = isDefaultPageChange ? PAGE_MUSIC_FADE_DURATION : MUSIC_FADE_DURATION;
      const wasPlaying = shouldResumeRef.current || hasUserStarted || !audio.paused;
      const wasResumeAttempt = resumePendingRef.current;

      transitionIdRef.current = transitionId;
      activeModeRef.current = activeMode;
      shouldResumeRef.current = false;
      saveCurrentPosition();

      if (previousSource === nextSource) {
        audio.loop = mode !== DEFAULT_MUSIC_MODE || activePlaylist.length === 1;
        // A canceled fade may leave the same track below its normal level.
        audio.volume = DEFAULT_VOLUME;

        if (wasPlaying && audio.paused) {
          audio.play()
            .then(() => {
              resumePendingRef.current = false;
              setIsResumePending(false);
              setIsPlaying(true);
            })
            .catch(() => {
              setIsPlaying(false);
              if (wasResumeAttempt) {
                setIsResumePending(true);
              }
            });
        } else {
          setIsPlaying(!audio.paused);
        }

        return;
      }

      if (!audio.paused) {
        // Continue only the audible portion of an interrupted fade instead
        // of waiting through another full transition.
        const fadeOutDuration = audio.volume > 0
          ? Math.max(80, Math.round(fadeDuration * audio.volume / DEFAULT_VOLUME))
          : 0;
        const completedFadeOut = await fadeAudioVolume(
          audio,
          0,
          fadeOutDuration,
          transitionId,
          transitionIdRef,
        );

        if (!completedFadeOut) {
          return;
        }

        audio.pause();
      }

      if (transitionIdRef.current !== transitionId) {
        return;
      }

      setAudioSource(audio, nextSource);
      audio.loop = mode !== DEFAULT_MUSIC_MODE || activePlaylist.length === 1;
      currentSourceRef.current = nextSource;

      const savedTime = playbackPositionsRef.current[nextSource];

      if (Number.isFinite(savedTime) && savedTime > 0) {
        try {
          audio.currentTime = savedTime;
        } catch {
          audio.addEventListener("loadedmetadata", () => {
            audio.currentTime = savedTime;
          }, { once: true });
        }
      }

      if (!wasPlaying) {
        audio.volume = DEFAULT_VOLUME;
        setIsPlaying(false);
        return;
      }

      audio.volume = 0;

      try {
        await audio.play();
        resumePendingRef.current = false;
        setIsResumePending(false);
        setIsPlaying(true);
        await fadeAudioVolume(audio, DEFAULT_VOLUME, fadeDuration, transitionId, transitionIdRef);
      } catch {
        audio.volume = DEFAULT_VOLUME;
        setIsPlaying(false);
        if (wasResumeAttempt) {
          setIsResumePending(true);
        }
      }
    };

    transitionToTrack();
  }, [activeMode, activePlaylist.length, activeTrack.source, hasUserStarted, mode, saveCurrentPosition]);

  useEffect(() => {
    const handleArchiveStart = () => {
      const audio = audioRef.current;
      const startingTrack = MUSIC_PLAYLISTS[pageMode][0];
      const nextPlaylistIndexes = {
        ...musicStateRef.current.playlistIndexes,
        [pageMode]: 0,
      };

      setMode(DEFAULT_MUSIC_MODE);
      setPlaylistIndexes(nextPlaylistIndexes);
      shouldResumeRef.current = true;
      resumePendingRef.current = false;
      setIsResumePending(false);
      setHasUserStarted(true);

      if (!audio) {
        return;
      }

      if (currentSourceRef.current !== startingTrack.source) {
        setAudioSource(audio, startingTrack.source);
        currentSourceRef.current = startingTrack.source;
      }

      audio.loop = MUSIC_PLAYLISTS[pageMode].length === 1;
      audio.volume = DEFAULT_VOLUME;
      audio.currentTime = 0;
      audio.play()
        .then(() => {
          setIsPlaying(true);
          persistMusicState({ mode: DEFAULT_MUSIC_MODE, playlistIndexes: nextPlaylistIndexes });
        })
        .catch(() => setIsPlaying(false));
    };

    window.addEventListener(ARCHIVE_READY_EVENT, handleArchiveStart);

    return () => window.removeEventListener(ARCHIVE_READY_EVENT, handleArchiveStart);
  }, [pageMode, persistMusicState]);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    const previousPaddingRight = document.body.style.paddingRight;
    const previousDocumentOverflow = document.documentElement.style.overflow;
    const activeElement = document.activeElement;

    previouslyFocusedRef.current = activeElement instanceof HTMLElement ? activeElement : null;
    document.body.style.overflow = "hidden";
    document.body.style.paddingRight = "0px";
    document.documentElement.style.overflow = "hidden";
    document.body.classList.add("music-panel-open");

    const focusTimer = window.setTimeout(() => {
      musicChoiceRefs.current.get(defaultMusicChoice.id)?.focus();
    }, 0);
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setIsOpen(false);
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const focusableElements = Array.from(
        musicPanelRef.current?.querySelectorAll("button:not([disabled]), [href]") ?? [],
      );

      if (focusableElements.length === 0) {
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      document.body.style.paddingRight = previousPaddingRight;
      document.documentElement.style.overflow = previousDocumentOverflow;
      document.body.classList.remove("music-panel-open");
      previouslyFocusedRef.current?.focus?.();
    };
  }, [isOpen]);

  const closePanel = () => {
    if (!isOpen || isPanelClosing) {
      return;
    }

    setIsOpen(false);
    setIsPanelClosing(true);
    panelCloseTimerRef.current = window.setTimeout(() => {
      setIsPanelClosing(false);
      panelCloseTimerRef.current = null;
    }, 260);
  };

  const openPanel = () => {
    if (panelCloseTimerRef.current) {
      window.clearTimeout(panelCloseTimerRef.current);
      panelCloseTimerRef.current = null;
    }
    setIsPanelClosing(false);
    setPanelAnimationKey((key) => key + 1);
    setIsOpen(true);
  };

  const togglePlayback = async () => {
    const audio = audioRef.current;

    if (!audio) {
      return;
    }

    if (audio.paused) {
      try {
        resumePendingRef.current = false;
        setIsResumePending(false);
        setHasUserStarted(true);
        await audio.play();
        setIsPlaying(true);
        persistMusicState();
      } catch {
        setIsPlaying(false);
      }
      return;
    }

    audio.pause();
    resumePendingRef.current = false;
    setIsResumePending(false);
    setHasUserStarted(false);
    persistMusicState();
  };

  const suppressPointerFocus = (event) => {
    event.preventDefault();
  };

  const selectPlaylist = (nextMode, nextTrackIndex = 0) => {
    const audio = audioRef.current;
    const nextPlaylist = nextMode === DEFAULT_MUSIC_MODE
      ? MUSIC_PLAYLISTS[pageMode]
      : MUSIC_PLAYLISTS[nextMode];
    const playlistMode = nextMode === DEFAULT_MUSIC_MODE ? pageMode : nextMode;
    const normalizedTrackIndex = normalizePlaylistIndex(playlistMode, nextTrackIndex);
    const nextTrack = nextPlaylist[normalizedTrackIndex];
    const nextPlaylistIndexes = {
      ...musicStateRef.current.playlistIndexes,
      ...(nextMode === DEFAULT_MUSIC_MODE
        ? { [pageMode]: normalizedTrackIndex }
        : {}),
    };
    const nextManualSelection = nextMode === DEFAULT_MUSIC_MODE
      ? musicStateRef.current.manualSelection
      : { mode: nextMode, trackIndex: normalizedTrackIndex };

    saveCurrentPosition();
    resumePendingRef.current = false;
    setIsResumePending(false);
    setMode(nextMode);
    if (nextMode === DEFAULT_MUSIC_MODE) {
      setPlaylistIndexes(nextPlaylistIndexes);
    } else {
      setManualSelection(nextManualSelection);
    }
    shouldResumeRef.current = true;
    setHasUserStarted(true);
    persistMusicState({
      mode: nextMode,
      manualSelection: nextManualSelection,
      playlistIndexes: nextPlaylistIndexes,
    });

    if (audio && currentSourceRef.current === nextTrack.source) {
      shouldResumeRef.current = false;
      audio.loop = nextMode !== DEFAULT_MUSIC_MODE || nextPlaylist.length === 1;
      audio.play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
      return;
    }
  };

  const handleMusicChoiceKeyDown = (event, choice) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      focusMusicChoice(choice.id, 1);
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      focusMusicChoice(choice.id, -1);
      return;
    }

    if (event.key === "Home") {
      event.preventDefault();
      musicChoiceRefs.current.get(MUSIC_CHOICES[0].id)?.focus();
      return;
    }

    if (event.key === "End") {
      event.preventDefault();
      musicChoiceRefs.current.get(MUSIC_CHOICES[MUSIC_CHOICES.length - 1].id)?.focus();
      return;
    }

    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }

    event.preventDefault();

    if (isChoiceSelected(choice.mode, choice.trackIndex)) {
      togglePlayback();
      return;
    }

    selectPlaylist(choice.mode, choice.trackIndex);
  };

  const renderTrackChoices = (playlist, playlistMode) => (
    <ol className="music-choice-list">
      {playlist.map((track, index) => {
        const isSelected = activeMode === playlistMode && activeTrackIndex % playlist.length === index;
        const choice = {
          id: getMusicChoiceId(playlistMode, index),
          mode: playlistMode,
          trackIndex: index,
        };

        return (
          <li key={track.id}>
            <button
              ref={setMusicChoiceRef(choice.id)}
              className={`music-choice${isSelected ? " music-choice--selected" : ""}`}
              type="button"
              aria-pressed={isSelected}
              onKeyDown={(event) => handleMusicChoiceKeyDown(event, choice)}
              onClick={() => selectPlaylist(playlistMode, index)}
            >
              <span className="music-choice__number" aria-hidden="true">
                {index + 1}.
              </span>
              <span className="music-choice__label">
                <TrackLabel track={track} />
                {isSelected && mode !== DEFAULT_MUSIC_MODE ? (
                  <span className="music-choice__loop-note">This song will loop automatically.</span>
                ) : null}
              </span>
              {isSelected ? (
                <span className="music-choice__check" aria-hidden="true">✓</span>
              ) : null}
            </button>
          </li>
        );
      })}
    </ol>
  );

  const musicPanel = (
    <div
      key={panelAnimationKey}
      className={`music-panel-layer${isPanelClosing ? " music-panel-layer--closing" : ""}`}
      role="presentation"
      onPointerDown={(event) => {
        if (event.target === event.currentTarget) {
          closePanel();
        }
      }}
    >
      <section
        ref={musicPanelRef}
        className="music-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="music-panel-title"
        onPointerDown={(event) => event.stopPropagation()}
      >
        <header className="music-panel__header">
          <div>
            <p className="music-panel__eyebrow">Archive music</p>
            <h2 id="music-panel-title">Choose a soundtrack</h2>
          </div>
          <button
            className="music-panel__close"
            type="button"
            aria-label="Close music panel"
            onMouseDown={suppressPointerFocus}
            onClick={closePanel}
          >
            <img
              className="music-panel__close-backdrop"
              src={chanFlowerBackdrop.src}
              alt=""
              aria-hidden="true"
            />
            <span aria-hidden="true">×</span>
          </button>
        </header>

        <div className="music-panel__body" ref={musicPanelBodyRef}>
          <button
            ref={setMusicChoiceRef(defaultMusicChoice.id)}
            className={`music-choice music-choice--default${mode === DEFAULT_MUSIC_MODE ? " music-choice--selected" : ""}`}
            type="button"
            aria-pressed={mode === DEFAULT_MUSIC_MODE}
            onKeyDown={(event) => handleMusicChoiceKeyDown(event, defaultMusicChoice)}
            onClick={() => selectPlaylist(DEFAULT_MUSIC_MODE, 0)}
          >
            <span className="music-choice__label">
              <span>Default <span className="music-choice__recommend"><em>Recommend</em>⭐</span></span>
              <small className="music-choice__description">
                Default option will play all songs at the appropriate pages.
              </small>
            </span>
            {mode === DEFAULT_MUSIC_MODE ? (
              <span className="music-choice__check" aria-hidden="true">✓</span>
            ) : null}
          </button>

          <div className="music-panel__section">
            <h3>Home page</h3>
            {renderTrackChoices(MUSIC_PLAYLISTS.home, "home")}
          </div>

          <div className="music-panel__section">
            <h3>About page</h3>
            {renderTrackChoices(MUSIC_PLAYLISTS.about, "about")}
          </div>

          <div className="music-panel__section">
            <h3>Reading Mode</h3>
            {renderTrackChoices(MUSIC_PLAYLISTS.reading, "reading")}
          </div>
        </div>

        <ScrollIndicator scrollRef={musicPanelBodyRef} className="music-panel__scrollbar" />

        <footer className="music-panel__footer">
          <p className="music-panel__now-playing">
            {isPlaying ? "Playing" : "Paused"}: <span>{activeTrack.label}</span>
          </p>
          <button
            className={`music-panel__play${isPlaying ? " music-panel__play--pause" : " music-panel__play--play"}`}
            type="button"
            onMouseDown={suppressPointerFocus}
            onClick={togglePlayback}
          >
            {isPlaying ? "Pause" : "Play"}
          </button>
        </footer>
      </section>
    </div>
  );

  return (
    <>
      <div className={`music-control${isPlaying ? " music-control--playing" : ""}${isResumePending ? " music-control--resume-pending" : ""}`}>
        <img
          className="music-control__backdrop"
          src={chanFlowerBackdrop.src}
          alt=""
          aria-hidden="true"
        />
        <button
          className="music-control__button"
          type="button"
          aria-label={isResumePending ? "Resume archive music" : "Open archive music panel"}
          aria-haspopup="dialog"
          aria-expanded={isOpen}
          onClick={openPanel}
        >
          <img className="music-control__icon" src={musicIcon.src} alt="" aria-hidden="true" />
        </button>
        <audio
          ref={audioRef}
          data-music-audio
          className="music-control__audio"
          src={initialAudioSourceRef.current}
          loop={false}
          preload="auto"
        />
      </div>
      {isMounted && (isOpen || isPanelClosing) ? createPortal(musicPanel, document.body) : null}
    </>
  );
}
