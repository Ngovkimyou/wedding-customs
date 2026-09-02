"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import chanFlowerBackdrop from "../assets/chan-flower-backdrop.png";
import musicIcon from "../assets/icons/music-icon.png";
import {
  DEFAULT_MUSIC_MODE,
  INITIAL_MANUAL_SELECTION,
  INITIAL_PLAYLIST_INDEXES,
  MUSIC_CHOICES,
  MUSIC_PLAYLISTS,
  getMusicChoiceId,
  getPageMusicMode,
} from "../data/music.js";

const DEFAULT_VOLUME = 1;
const MUSIC_FADE_DURATION = 850;

function clampVolume(volume) {
  return Math.min(Math.max(volume, 0), 1);
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
  const musicScrollbarRef = useRef(null);
  const musicChoiceRefs = useRef(new Map());
  const previouslyFocusedRef = useRef(null);
  const shouldResumeRef = useRef(false);
  const currentSourceRef = useRef(null);
  const playbackPositionsRef = useRef({});
  const transitionIdRef = useRef(0);
  const [isMounted, setIsMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [mode, setMode] = useState(DEFAULT_MUSIC_MODE);
  const [manualSelection, setManualSelection] = useState(INITIAL_MANUAL_SELECTION);
  const [playlistIndexes, setPlaylistIndexes] = useState(INITIAL_PLAYLIST_INDEXES);
  const [scrollIndicator, setScrollIndicator] = useState({
    isScrollable: false,
    thumbHeight: 0,
    thumbOffset: 0,
  });

  const pageMode = getPageMusicMode(pathname);
  const activeMode = mode === DEFAULT_MUSIC_MODE ? pageMode : manualSelection.mode;
  const activePlaylist = MUSIC_PLAYLISTS[activeMode];
  const activeTrackIndex = mode === DEFAULT_MUSIC_MODE
    ? playlistIndexes[activeMode]
    : manualSelection.trackIndex;
  const activeTrack = activePlaylist[activeTrackIndex % activePlaylist.length];

  const saveCurrentPosition = useCallback(() => {
    const audio = audioRef.current;
    const currentSource = currentSourceRef.current;

    if (!audio || !currentSource || !Number.isFinite(audio.currentTime)) {
      return;
    }

    playbackPositionsRef.current[currentSource] = audio.ended ? 0 : audio.currentTime;
  }, []);

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
      audio.src = nextTrack.source;
      audio.loop = activePlaylist.length === 1;
      currentSourceRef.current = nextTrack.source;
      audio.load();
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
      const wasPlaying = shouldResumeRef.current || !audio.paused;

      transitionIdRef.current = transitionId;
      shouldResumeRef.current = false;
      saveCurrentPosition();

      if (previousSource === nextSource) {
        audio.loop = mode !== DEFAULT_MUSIC_MODE || activePlaylist.length === 1;

        if (wasPlaying && audio.paused) {
          audio.volume = DEFAULT_VOLUME;
          audio.play().catch(() => setIsPlaying(false));
        } else {
          setIsPlaying(!audio.paused);
        }

        return;
      }

      if (!audio.paused) {
        const completedFadeOut = await fadeAudioVolume(
          audio,
          0,
          MUSIC_FADE_DURATION,
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

      audio.src = nextSource;
      audio.loop = mode !== DEFAULT_MUSIC_MODE || activePlaylist.length === 1;
      currentSourceRef.current = nextSource;
      audio.load();

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
        setIsPlaying(true);
        await fadeAudioVolume(audio, DEFAULT_VOLUME, MUSIC_FADE_DURATION, transitionId, transitionIdRef);
      } catch {
        audio.volume = DEFAULT_VOLUME;
        setIsPlaying(false);
      }
    };

    transitionToTrack();
  }, [activePlaylist.length, activeTrack.source, mode, saveCurrentPosition]);

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

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const body = musicPanelBodyRef.current;
    const scrollbar = musicScrollbarRef.current;

    if (!body || !scrollbar) {
      return undefined;
    }

    const updateScrollIndicator = () => {
      const maxScroll = body.scrollHeight - body.clientHeight;
      const trackHeight = scrollbar.clientHeight;
      const isScrollable = maxScroll > 1;
      const thumbHeight = isScrollable ? Math.max((body.clientHeight / body.scrollHeight) * trackHeight, 24) : 0;
      const thumbOffset = isScrollable
        ? (body.scrollTop / maxScroll) * Math.max(trackHeight - thumbHeight, 0)
        : 0;

      setScrollIndicator({
        isScrollable,
        thumbHeight,
        thumbOffset,
      });
    };

    updateScrollIndicator();
    body.addEventListener("scroll", updateScrollIndicator, { passive: true });
    window.addEventListener("resize", updateScrollIndicator);
    const resizeObserver = new ResizeObserver(updateScrollIndicator);
    resizeObserver.observe(body);

    return () => {
      body.removeEventListener("scroll", updateScrollIndicator);
      window.removeEventListener("resize", updateScrollIndicator);
      resizeObserver.disconnect();
    };
  }, [activeMode, activeTrackIndex, isOpen, mode]);

  const closePanel = () => setIsOpen(false);

  const openPanel = () => {
    setIsOpen(true);
  };

  const togglePlayback = async () => {
    const audio = audioRef.current;

    if (!audio) {
      return;
    }

    if (audio.paused) {
      try {
        await audio.play();
      } catch {
        setIsPlaying(false);
      }
      return;
    }

    audio.pause();
  };

  const suppressPointerFocus = (event) => {
    event.preventDefault();
  };

  const selectPlaylist = (nextMode, nextTrackIndex = 0) => {
    const audio = audioRef.current;
    const nextPlaylist = nextMode === DEFAULT_MUSIC_MODE
      ? MUSIC_PLAYLISTS[pageMode]
      : MUSIC_PLAYLISTS[nextMode];
    const nextTrack = nextPlaylist[nextTrackIndex % nextPlaylist.length];

    saveCurrentPosition();
    setMode(nextMode);
    if (nextMode === DEFAULT_MUSIC_MODE) {
      setPlaylistIndexes((currentIndexes) => ({
        ...currentIndexes,
        [pageMode]: nextTrackIndex,
      }));
    } else {
      setManualSelection({
        mode: nextMode,
        trackIndex: nextTrackIndex,
      });
    }
    shouldResumeRef.current = true;

    if (audio && currentSourceRef.current === nextTrack.source) {
      shouldResumeRef.current = false;
      audio.loop = nextMode !== DEFAULT_MUSIC_MODE || nextPlaylist.length === 1;
      audio.play().catch(() => setIsPlaying(false));
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
      className="music-panel-layer"
      role="presentation"
      onMouseDown={(event) => {
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
        onMouseDown={(event) => event.stopPropagation()}
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

        <div
          ref={musicScrollbarRef}
          className={`music-panel__scrollbar${scrollIndicator.isScrollable ? " music-panel__scrollbar--visible" : ""}`}
          aria-hidden="true"
        >
          <span
            className="music-panel__scrollbar-thumb"
            style={{
              height: `${scrollIndicator.thumbHeight}px`,
              transform: `translateY(${scrollIndicator.thumbOffset}px)`,
            }}
          />
        </div>

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
      <div className={`music-control${isPlaying ? " music-control--playing" : ""}`}>
        <img
          className="music-control__backdrop"
          src={chanFlowerBackdrop.src}
          alt=""
          aria-hidden="true"
        />
        <button
          className="music-control__button"
          type="button"
          aria-label="Open archive music panel"
          aria-haspopup="dialog"
          aria-expanded={isOpen}
          onClick={openPanel}
        >
          <img className="music-control__icon" src={musicIcon.src} alt="" aria-hidden="true" />
        </button>
        <audio ref={audioRef} className="music-control__audio" loop={false} preload="none" />
      </div>
      {isMounted && isOpen ? createPortal(musicPanel, document.body) : null}
    </>
  );
}
