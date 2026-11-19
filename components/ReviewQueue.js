"use client";

import { useEffect, useRef, useState } from "react";
import ProgressiveImage from "./ProgressiveImage.js";
import FullScreenPhotoPreview from "./FullScreenPhotoPreview.js";
import InteractionLock from "./InteractionLock.js";
import { decideReviewEntry } from "../app/review/actions.js";
import { REVIEW_FEEDBACK_MAX_LENGTH } from "../lib/review-feedback.mjs";
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
  const [returnFormEntryId, setReturnFormEntryId] = useState(null);
  const [returnNote, setReturnNote] = useState("");
  const [returnNoteError, setReturnNoteError] = useState(false);
  const isSubmittingRef = useRef(false);
  const returnNoteRef = useRef(null);

  useEffect(() => {
    if (returnFormEntryId !== null) {
      returnNoteRef.current?.focus();
    }
  }, [returnFormEntryId]);

  const handleDecision = async (entryId, decision, note = null) => {
    if (isSubmittingRef.current) {
      return;
    }

    isSubmittingRef.current = true;
    setPendingEntryId(entryId);
    setFailedEntryIds((current) => ({ ...current, [entryId]: false }));

    try {
      const result = await decideReviewEntry(entryId, decision, note);
      if (result?.ok === true) {
        setEntries((current) => current.filter((entry) => entry.id !== entryId));
        setReturnFormEntryId(null);
        setReturnNote("");
        setReturnNoteError(false);
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

  const openReturnForm = (entryId) => {
    if (isSubmittingRef.current) {
      return;
    }

    setReturnFormEntryId(entryId);
    setReturnNote("");
    setReturnNoteError(false);
    setFailedEntryIds((current) => ({ ...current, [entryId]: false }));
  };

  const cancelReturnForm = () => {
    setReturnFormEntryId(null);
    setReturnNote("");
    setReturnNoteError(false);
  };

  const submitReturnForm = (event, entryId) => {
    event.preventDefault();
    const note = returnNote.trim();

    if (!note) {
      setReturnNoteError(true);
      return;
    }

    void handleDecision(entryId, "returned", note);
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
          const preferredDescription = locale === "km" ? entry.description_kh : entry.description_en;
          const alternateDescription = locale === "km" ? entry.description_en : entry.description_kh;
          const displayedDescription = preferredDescription || alternateDescription || entry.description;
          const displayedDescriptionLocale = preferredDescription
            ? locale
            : alternateDescription
              ? locale === "km" ? "en" : "km"
              : locale;
          const isReturnFormOpen = returnFormEntryId === entry.id;
          const returnFormId = `review-feedback-form-${entry.id}`;
          const returnNoteId = `review-feedback-note-${entry.id}`;
          const returnNoteHintId = `${returnNoteId}-hint`;
          const returnNoteErrorId = `review-feedback-error-${entry.id}`;

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
                <p lang={displayedDescriptionLocale} dir="auto">{displayedDescription}</p>
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

              {isReturnFormOpen ? (
                <form
                  id={returnFormId}
                  className="review-feedback-form"
                  noValidate
                  onSubmit={(event) => submitReturnForm(event, entry.id)}
                >
                  <p className="review-feedback-form__hint" id={returnNoteHintId}>
                    {translate(locale, "Explain what needs to change before this entry can be resubmitted.")}
                  </p>
                  <textarea
                    ref={returnNoteRef}
                    id={returnNoteId}
                    className="review-feedback-form__input"
                    value={returnNote}
                    rows={4}
                    aria-label={translate(locale, "Reviewer feedback")}
                    placeholder={translate(locale, "Write clear, specific feedback for the contributor.")}
                    aria-required="true"
                    aria-invalid={returnNoteError}
                    aria-describedby={`${returnNoteHintId} ${returnNoteError ? returnNoteErrorId : `${returnNoteId}-count`}`}
                    onChange={(event) => {
                      const nextNote = Array.from(event.target.value)
                        .slice(0, REVIEW_FEEDBACK_MAX_LENGTH)
                        .join("");
                      setReturnNote(nextNote);
                      if (nextNote.trim()) setReturnNoteError(false);
                    }}
                  />
                  <div className="review-feedback-form__footer">
                    <span id={`${returnNoteId}-count`} className="review-feedback-form__count">
                      {Array.from(returnNote).length}/{REVIEW_FEEDBACK_MAX_LENGTH}
                    </span>
                    {returnNoteError ? (
                      <small className="review-feedback-form__error" id={returnNoteErrorId} role="alert">
                        {translate(locale, "Please add a note for the contributor.")}
                      </small>
                    ) : null}
                    <div className="review-feedback-form__actions">
                      <button
                        className="review-feedback-form__cancel"
                        type="button"
                        disabled={pendingEntryId !== null}
                        onClick={cancelReturnForm}
                      >
                        {translate(locale, "Cancel")}
                      </button>
                      <button
                        className="review-decision review-decision--publish review-feedback-form__submit"
                        type="submit"
                        disabled={pendingEntryId !== null}
                      >
                        {translate(locale, "Send Feedback")}
                      </button>
                    </div>
                  </div>
                </form>
              ) : (
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
                    aria-expanded={isReturnFormOpen}
                    aria-controls={isReturnFormOpen ? returnFormId : undefined}
                    disabled={pendingEntryId !== null}
                    onClick={() => openReturnForm(entry.id)}
                  >
                    <span>{translate(locale, "Return for edits")}</span>
                  </button>
                </div>
              )}

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
