"use client";

import { useRef, useState } from "react";
import ProgressiveImage from "./ProgressiveImage.js";
import FullScreenPhotoPreview from "./FullScreenPhotoPreview.js";
import InteractionLock from "./InteractionLock.js";
import { decideReviewEntry } from "../app/review/actions.js";
import { translate } from "../lib/locale.js";
import { useLocale } from "./LocaleProvider.js";

const FAILURE_MESSAGE =
  "That decision was not saved. The entry may have already been reviewed. Refresh the queue to see its current status.";
const SAVING_MESSAGE = "Saving review decision...";

function formatSubmittedAt(value, locale) {
  const date = new Date(value);
  if (!value || Number.isNaN(date.getTime())) {
    return translate(locale, "Time unavailable");
  }

  return new Intl.DateTimeFormat(locale === "km" ? "km-KH" : "en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Phnom_Penh",
  }).format(date);
}

function ReviewEmptyState({ locale }) {
  return <p className="review-empty" role="status">{translate(locale, "No entries are waiting for review.")}</p>;
}

export default function ReviewQueue({ entries: initialEntries }) {
  const { locale } = useLocale();
  const [entries, setEntries] = useState(initialEntries);
  const [pendingEntryId, setPendingEntryId] = useState(null);
  const [failedEntryIds, setFailedEntryIds] = useState({});
  const isSubmittingRef = useRef(false);

  const handleDecision = async (entryId, decision) => {
    if (isSubmittingRef.current) {
      return;
    }

    isSubmittingRef.current = true;
    setPendingEntryId(entryId);
    setFailedEntryIds((current) => ({ ...current, [entryId]: false }));

    try {
      const result = await decideReviewEntry(entryId, decision);
      if (result?.ok === true) {
        setEntries((current) => current.filter((entry) => entry.id !== entryId));
      } else {
        setFailedEntryIds((current) => ({ ...current, [entryId]: true }));
      }
    } catch {
      setFailedEntryIds((current) => ({ ...current, [entryId]: true }));
    } finally {
      isSubmittingRef.current = false;
      setPendingEntryId(null);
    }
  };

  const isSaving = pendingEntryId !== null;

  if (entries.length === 0) {
    return (
      <>
        <ReviewEmptyState locale={locale} />
        {isSaving ? <InteractionLock message={translate(locale, SAVING_MESSAGE)} /> : null}
      </>
    );
  }

  return (
    <>
      <ol className="review-queue" aria-busy={isSaving} inert={isSaving}>
        {entries.map((entry) => {
          const showKhmerAsPrimary = locale === "km" && Boolean(entry.title_kh?.trim());
          const primaryTitle = showKhmerAsPrimary ? entry.title_kh : entry.title_en;
          const alternateTitle = showKhmerAsPrimary ? entry.title_en : entry.title_kh;

          return (
            <li
              className="review-entry"
              key={entry.id}
              aria-busy={pendingEntryId === entry.id}
            >
            <div className="review-entry__photo">
              {entry.thumbnail_path ? (
                <FullScreenPhotoPreview
                  src={entry.thumbnail_path}
                  alt={`${translate(locale, "Photograph for")} ${entry.title_en}`}
                  className="review-entry__image-trigger"
                  sizes="(max-width: 760px) 100vw, 30rem"
                >
                  <ProgressiveImage
                    className="review-entry__image"
                    src={entry.thumbnail_path}
                    alt={`${translate(locale, "Photograph for")} ${entry.title_en}`}
                    fill
                    sizes="(max-width: 760px) 100vw, 30rem"
                    fallbackContent="Image unavailable"
                  />
                </FullScreenPhotoPreview>
              ) : (
                <span className="review-entry__photo-fallback">{translate(locale, "Photograph unavailable")}</span>
              )}
            </div>

            <div className="review-entry__content">
              <p className="review-entry__submitted">
                <span className="review-entry__submitted-label">{translate(locale, "Submitted")}</span>
                <time dateTime={entry.created_at || undefined}>
                  {formatSubmittedAt(entry.created_at, locale)}
                </time>
              </p>
              <h2 lang={showKhmerAsPrimary ? "km" : "en"}>{primaryTitle}</h2>
              {alternateTitle ? (
                <p className="review-entry__khmer-title" lang={showKhmerAsPrimary ? "en" : "km"} dir="auto">
                  {alternateTitle}
                </p>
              ) : null}
              {entry.summary ? (
                <div className="review-entry__summary-block">
                  <p className="review-entry__field-label">
                    <span>{translate(locale, "Summary")}</span>
                  </p>
                  <p className="review-entry__summary">{entry.summary}</p>
                </div>
              ) : null}
              <div className="review-entry__description">
                <p className="review-entry__field-label">
                  <span>{translate(locale, "Story")}</span>
                </p>
                <p>{entry.description}</p>
              </div>

              {entry.period_label || entry.location ? (
                <dl className="review-entry__metadata">
                  {entry.period_label ? (
                    <div>
                      <dt><span>{translate(locale, "Period")}</span></dt>
                      <dd>{entry.period_label}</dd>
                    </div>
                  ) : null}
                  {entry.location ? (
                    <div>
                      <dt><span>{translate(locale, "Location")}</span></dt>
                      <dd>{entry.location}</dd>
                    </div>
                  ) : null}
                </dl>
              ) : null}

              <div
                className="review-entry__actions"
                role="group"
                aria-label={translate(locale, "Review decision")}
              >
                <button
                  className="review-decision review-decision--publish"
                  type="button"
                  disabled={pendingEntryId !== null}
                  onClick={() => handleDecision(entry.id, "published")}
                >
                  <span>{translate(locale, "Publish")}</span>
                </button>
                <button
                  className="review-decision review-decision--return"
                  type="button"
                  disabled={pendingEntryId !== null}
                  onClick={() => handleDecision(entry.id, "returned")}
                >
                  <span>{translate(locale, "Return for edits")}</span>
                </button>
              </div>

              {pendingEntryId === entry.id ? (
                <p className="review-entry__saving" role="status">
                  <span>{translate(locale, "Saving decision...")}</span>
                </p>
              ) : null}
              {failedEntryIds[entry.id] ? (
                <p className="review-entry__error" role="alert">
                  <span>{translate(locale, FAILURE_MESSAGE)}</span>
                </p>
              ) : null}
            </div>
            </li>
          );
        })}
      </ol>
      {isSaving ? <InteractionLock message={translate(locale, SAVING_MESSAGE)} /> : null}
    </>
  );
}
