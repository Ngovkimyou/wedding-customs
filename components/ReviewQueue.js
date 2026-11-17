"use client";

import { useRef, useState } from "react";
import ProgressiveImage from "./ProgressiveImage.js";
import FullScreenPhotoPreview from "./FullScreenPhotoPreview.js";
import InteractionLock from "./InteractionLock.js";
import { decideReviewEntry } from "../app/review/actions.js";

const FAILURE_MESSAGE =
  "That decision was not saved. The entry may have already been reviewed. Refresh the queue to see its current status.";
const SAVING_MESSAGE = "Saving review decision...";

function ReviewEmptyState() {
  return <p className="review-empty" role="status">No entries are waiting for review.</p>;
}

export default function ReviewQueue({ entries: initialEntries }) {
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
        <ReviewEmptyState />
        {isSaving ? <InteractionLock message={SAVING_MESSAGE} /> : null}
      </>
    );
  }

  return (
    <>
      <ol className="review-queue" aria-busy={isSaving} inert={isSaving}>
        {entries.map((entry) => (
          <li
            className="review-entry"
            key={entry.id}
            aria-busy={pendingEntryId === entry.id}
          >
            <div className="review-entry__photo">
              {entry.thumbnail_path ? (
                <FullScreenPhotoPreview
                  src={entry.thumbnail_path}
                  alt={`Photograph for ${entry.title_en}`}
                  className="review-entry__image-trigger"
                  sizes="(max-width: 760px) 100vw, 30rem"
                >
                  <ProgressiveImage
                    className="review-entry__image"
                    src={entry.thumbnail_path}
                    alt={`Photograph for ${entry.title_en}`}
                    fill
                    sizes="(max-width: 760px) 100vw, 30rem"
                    fallbackContent="Image unavailable"
                  />
                </FullScreenPhotoPreview>
              ) : (
                <span className="review-entry__photo-fallback">Photograph unavailable</span>
              )}
            </div>

            <div className="review-entry__content">
              <p className="review-entry__submitted">
                <span className="review-entry__submitted-label">Submitted</span>
                <time dateTime={entry.created_at || undefined}>
                  {entry.submittedAtLabel ?? "Time unavailable"}
                </time>
              </p>
              <h2>{entry.title_en}</h2>
              {entry.title_kh ? (
                <p className="review-entry__khmer-title" lang="km" dir="auto">
                  {entry.title_kh}
                </p>
              ) : null}
              {entry.summary ? (
                <div className="review-entry__summary-block">
                  <p className="review-entry__field-label">
                    <span>Summary</span>
                  </p>
                  <p className="review-entry__summary">{entry.summary}</p>
                </div>
              ) : null}
              <div className="review-entry__description">
                <p className="review-entry__field-label">
                  <span>Story</span>
                </p>
                <p>{entry.description}</p>
              </div>

              {entry.period_label || entry.location ? (
                <dl className="review-entry__metadata">
                  {entry.period_label ? (
                    <div>
                      <dt><span>Period</span></dt>
                      <dd>{entry.period_label}</dd>
                    </div>
                  ) : null}
                  {entry.location ? (
                    <div>
                      <dt><span>Location</span></dt>
                      <dd>{entry.location}</dd>
                    </div>
                  ) : null}
                </dl>
              ) : null}

              <div
                className="review-entry__actions"
                role="group"
                aria-label="Review decision"
              >
                <button
                  className="review-decision review-decision--publish"
                  type="button"
                  disabled={pendingEntryId !== null}
                  onClick={() => handleDecision(entry.id, "published")}
                >
                  <span>Publish</span>
                </button>
                <button
                  className="review-decision review-decision--return"
                  type="button"
                  disabled={pendingEntryId !== null}
                  onClick={() => handleDecision(entry.id, "returned")}
                >
                  <span>Return for edits</span>
                </button>
              </div>

              {pendingEntryId === entry.id ? (
                <p className="review-entry__saving" role="status">
                  <span>Saving decision...</span>
                </p>
              ) : null}
              {failedEntryIds[entry.id] ? (
                <p className="review-entry__error" role="alert">
                  <span>{FAILURE_MESSAGE}</span>
                </p>
              ) : null}
            </div>
          </li>
        ))}
      </ol>
      {isSaving ? <InteractionLock message={SAVING_MESSAGE} /> : null}
    </>
  );
}
