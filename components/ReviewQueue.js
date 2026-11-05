"use client";

import { useRef, useState } from "react";
import ProgressiveImage from "./ProgressiveImage.js";
import { decideReviewEntry } from "../app/review/actions.js";

const FAILURE_MESSAGE = {
  english: "That decision wasn’t saved. The entry may have already been reviewed. Refresh the queue to see its current status.",
  khmer: "មិនអាចរក្សាទុកការសម្រេចនេះបានទេ។ ធាតុនេះអាចត្រូវបានពិនិត្យរួចហើយ។ សូមផ្ទុកទំព័រឡើងវិញ ដើម្បីមើលស្ថានភាពបច្ចុប្បន្ន។",
};

function ReviewEmptyState() {
  return (
    <p className="review-empty" role="status">
      <span>No entries are waiting for review.</span>
      <span lang="km" dir="auto">គ្មានធាតុដែលកំពុងរង់ចាំការពិនិត្យទេ។</span>
    </p>
  );
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

  if (entries.length === 0) {
    return <ReviewEmptyState />;
  }

  return (
    <ol className="review-queue">
      {entries.map((entry) => (
        <li
          className="review-entry"
          key={entry.id}
          aria-busy={pendingEntryId === entry.id}
        >
          <div className="review-entry__photo">
            {entry.thumbnail_path ? (
              <ProgressiveImage
                className="review-entry__image"
                src={entry.thumbnail_path}
                alt={"Photograph for " + entry.title_en + (entry.title_kh
                  ? " / រូបថតសម្រាប់ " + entry.title_kh
                  : "")}
                fill
                sizes="(max-width: 760px) 100vw, 30rem"
                fallbackContent={(
                  <>
                    <span>Image unavailable</span>
                    <span lang="km" dir="auto">មិនអាចបង្ហាញរូបថតបានទេ។</span>
                  </>
                )}
              />
            ) : (
              <span className="review-entry__photo-fallback">
                <span>Photograph unavailable</span>
                <span lang="km" dir="auto">មិនមានរូបថតទេ។</span>
              </span>
            )}
          </div>

          <div className="review-entry__content">
            <p className="review-entry__submitted">
              <span className="review-entry__submitted-label">
                <span>Submitted</span>
                <span lang="km" dir="auto">ថ្ងៃដាក់ស្នើ</span>
              </span>
              <time dateTime={entry.created_at || undefined}>
                {entry.submittedAtLabel ? (
                  entry.submittedAtLabel
                ) : (
                  <>
                    <span>Time unavailable</span>
                    <span lang="km" dir="auto">មិនមានពេលវេលាទេ។</span>
                  </>
                )}
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
                  <span lang="km" dir="auto">សេចក្តីសង្ខេប</span>
                </p>
                <p className="review-entry__summary">{entry.summary}</p>
              </div>
            ) : null}
            <div className="review-entry__description">
              <p className="review-entry__field-label">
                <span>Story</span>
                <span lang="km" dir="auto">សាច់រឿង</span>
              </p>
              <p>{entry.description}</p>
            </div>

            {entry.period_label || entry.location ? (
              <dl className="review-entry__metadata">
                {entry.period_label ? (
                  <div>
                    <dt><span>Period</span><span lang="km" dir="auto">សម័យកាល</span></dt>
                    <dd>{entry.period_label}</dd>
                  </div>
                ) : null}
                {entry.location ? (
                  <div>
                    <dt><span>Location</span><span lang="km" dir="auto">ទីតាំង</span></dt>
                    <dd>{entry.location}</dd>
                  </div>
                ) : null}
              </dl>
            ) : null}

            <div
              className="review-entry__actions"
              role="group"
              aria-label="Review decision / ការសម្រេចលើការពិនិត្យ"
            >
              <button
                className="review-decision review-decision--publish"
                type="button"
                disabled={pendingEntryId !== null}
                onClick={() => handleDecision(entry.id, "published")}
              >
                <span>Publish</span>
                <span lang="km" dir="auto">បោះពុម្ពផ្សាយ</span>
              </button>
              <button
                className="review-decision review-decision--return"
                type="button"
                disabled={pendingEntryId !== null}
                onClick={() => handleDecision(entry.id, "returned")}
              >
                <span>Return for edits</span>
                <span lang="km" dir="auto">ត្រឡប់ទៅកែសម្រួល</span>
              </button>
            </div>

            {pendingEntryId === entry.id ? (
              <p className="review-entry__saving" role="status">
                <span>Saving decision…</span>
                <span lang="km" dir="auto">កំពុងរក្សាទុកការសម្រេច…</span>
              </p>
            ) : null}
            {failedEntryIds[entry.id] ? (
              <p className="review-entry__error" role="alert">
                <span>{FAILURE_MESSAGE.english}</span>
                <span lang="km" dir="auto">{FAILURE_MESSAGE.khmer}</span>
              </p>
            ) : null}
          </div>
        </li>
      ))}
    </ol>
  );
}
