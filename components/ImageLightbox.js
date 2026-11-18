"use client";

import Image from "next/image";
import { createPortal } from "react-dom";
import { useCallback, useEffect, useRef, useState } from "react";
import KhmerScriptText from "./KhmerScriptText.js";
import { translate } from "../lib/locale.js";
import { translateArchiveContent } from "../lib/archive-content-km.js";
import { useLocale } from "./LocaleProvider.js";

const CLOSE_DURATION = 180;

export default function ImageLightbox({
  src,
  alt = "Archive photograph",
  caption = "",
  sizes = "100vw",
  className = "",
  children,
  localizeContent = false,
}) {
  const { locale } = useLocale();
  const [isOpen, setIsOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [imageStatus, setImageStatus] = useState("idle");
  const triggerRef = useRef(null);
  const overlayRef = useRef(null);
  const closeTimerRef = useRef(null);

  const finishClose = useCallback(() => {
    window.clearTimeout(closeTimerRef.current);
    closeTimerRef.current = null;
    setIsOpen(false);
    setIsClosing(false);

    window.requestAnimationFrame(() => {
      if (triggerRef.current?.isConnected) {
        triggerRef.current.focus();
      }
    });
  }, []);

  const close = useCallback(() => {
    if (!isOpen || isClosing) {
      return;
    }

    setIsClosing(true);
    closeTimerRef.current = window.setTimeout(finishClose, CLOSE_DURATION);
  }, [finishClose, isClosing, isOpen]);

  const open = () => {
    window.clearTimeout(closeTimerRef.current);
    setIsClosing(false);
    setImageStatus("loading");
    setIsOpen(true);
  };

  useEffect(() => () => {
    window.clearTimeout(closeTimerRef.current);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const root = document.documentElement;
    const body = document.body;
    const previousRootOverflow = root.style.overflow;
    const previousBodyOverflow = body.style.overflow;
    const previousBodyOverscroll = body.style.overscrollBehavior;

    root.style.overflow = "hidden";
    body.style.overflow = "hidden";
    body.style.overscrollBehavior = "none";

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      root.style.overflow = previousRootOverflow;
      body.style.overflow = previousBodyOverflow;
      body.style.overscrollBehavior = previousBodyOverscroll;
    };
  }, [close, isOpen]);

  useEffect(() => {
    if (!isOpen || isClosing) {
      return;
    }

    window.requestAnimationFrame(() => {
      overlayRef.current?.focus();
    });
  }, [isClosing, isOpen]);

  const triggerClassName = ["image-lightbox__trigger", className]
    .filter(Boolean)
    .join(" ");
  const localizedCaption = localizeContent
    ? caption.split(" · ").map((part) => translateArchiveContent(locale, part)).join(" · ")
    : caption;
  const localizedAlt = localizeContent ? translateArchiveContent(locale, alt) : alt;
  const imageLabel = localizedCaption || localizedAlt || "Archive photograph";

  return (
    <>
      <button
        ref={triggerRef}
        className={triggerClassName}
        type="button"
        aria-label={`${translate(locale, "View")} ${imageLabel} ${translate(locale, "full screen")}`}
        aria-haspopup="dialog"
        onClick={open}
      >
        {children}
      </button>

      {isOpen && typeof document !== "undefined"
        ? createPortal(
          <div
            ref={overlayRef}
            className={`image-lightbox${isClosing ? " image-lightbox--closing" : ""}`}
            role="dialog"
            aria-modal="true"
            aria-label={`${imageLabel} — ${translate(locale, "Full-size preview")}`}
            tabIndex={-1}
            onClick={close}
          >
            <div className={`image-lightbox__stage image-lightbox__stage--${imageStatus}`}>
              {imageStatus === "loading" ? (
                <span className="image-lightbox__status" role="status">{translate(locale, "Loading image...")}</span>
              ) : null}
              {imageStatus === "error" ? (
                <span className="image-lightbox__status image-lightbox__status--error" role="alert">
                  {translate(locale, "Image unavailable")}
                </span>
              ) : null}
              <Image
                className="image-lightbox__image"
                src={src}
                alt={localizedAlt}
                fill
                sizes={sizes}
                priority
                unoptimized={/^https?:\/\//iu.test(src)}
                draggable={false}
                onLoad={() => setImageStatus("loaded")}
                onError={() => setImageStatus("error")}
              />
            </div>
            <div className="image-lightbox__caption" aria-live="polite">
              {localizedCaption ? <p><KhmerScriptText>{localizedCaption}</KhmerScriptText></p> : null}
              <span>{translate(locale, "Click anywhere to close · Esc")}</span>
            </div>
          </div>,
          document.body,
        )
        : null}
    </>
  );
}
