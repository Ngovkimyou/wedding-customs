"use client";

import Image from "next/image";
import { createPortal } from "react-dom";
import { useEffect, useRef, useState } from "react";
import { translate } from "../lib/locale.js";
import { useLocale } from "./LocaleProvider.js";

export default function FullScreenPhotoPreview({
  src,
  alt,
  children,
  className,
  disabled = false,
  sizes = "100vw",
  triggerProps = {},
}) {
  const { locale } = useLocale();
  const triggerRef = useRef(null);
  const dialogRef = useRef(null);
  const restoreFocusRef = useRef(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) return undefined;

    const previousBodyOverflow = document.body.style.overflow;
    const previousRootOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    const closeOnKeyDown = (event) => {
      if (event.key === "Escape" || event.key === " " || event.code === "Space") {
        event.preventDefault();
        restoreFocusRef.current = true;
        setIsOpen(false);
      } else if (event.key === "Tab") {
        event.preventDefault();
        dialogRef.current?.focus({ preventScroll: true });
      }
    };

    document.addEventListener("keydown", closeOnKeyDown);
    const focusDialogFrame = window.requestAnimationFrame(() => {
      dialogRef.current?.focus({ preventScroll: true });
    });

    return () => {
      document.removeEventListener("keydown", closeOnKeyDown);
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousRootOverflow;
      window.cancelAnimationFrame(focusDialogFrame);

      if (restoreFocusRef.current) {
        window.requestAnimationFrame(() => {
          if (triggerRef.current?.isConnected) {
            triggerRef.current.focus({ preventScroll: true });
          }
        });
        restoreFocusRef.current = false;
      }
    };
  }, [isOpen]);

  return (
    <>
      <button
        {...triggerProps}
        ref={triggerRef}
        className={className}
        type="button"
        disabled={disabled || !src}
        aria-label={`${translate(locale, "Open full-size preview of")} ${alt}`}
        aria-haspopup="dialog"
        onClick={() => {
          restoreFocusRef.current = true;
          setIsOpen(true);
        }}
      >
        {children}
      </button>
      {isOpen && src && typeof document !== "undefined"
        ? createPortal(
          <div
            ref={dialogRef}
            className="contribution-photo-preview"
            role="dialog"
            aria-modal="true"
            aria-label={`${translate(locale, "Full-size preview of")} ${alt}`}
            tabIndex={-1}
            onClick={() => {
              restoreFocusRef.current = false;
              setIsOpen(false);
            }}
          >
            <Image
              className="contribution-photo-preview__image"
              src={src}
              alt={alt}
              width={1600}
              height={1200}
              sizes={sizes}
              unoptimized
            />
          </div>,
          document.body,
        )
        : null}
    </>
  );
}
