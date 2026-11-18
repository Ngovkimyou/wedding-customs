"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { deleteArchiveEntry } from "../app/contribute/actions.js";
import { createClient } from "../lib/supabase/client.js";
import { translate } from "../lib/locale.js";
import InteractionLock from "./InteractionLock.js";
import { useLocale } from "./LocaleProvider.js";

export default function ArchiveOwnerActions({ entryId, ownerId, slug, title }) {
  const { locale } = useLocale();
  const router = useRouter();
  const [isOwner, setIsOwner] = useState(false);
  const [resolvedEntryId, setResolvedEntryId] = useState(entryId ?? null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [message, setMessage] = useState("");
  const deleteDialogRef = useRef(null);
  const cancelDeleteRef = useRef(null);
  const deleteInProgressRef = useRef(false);
  const deleteDialogTitleId = useId();
  const deleteDialogDescriptionId = useId();

  useEffect(() => {
    const supabase = createClient();
    let isMounted = true;
    let authStateChanged = false;
    let lookupTimer = null;

    const resolveOwner = async (userId) => {
      if (!userId) {
        if (isMounted) {
          setIsOwner(false);
          setResolvedEntryId(entryId ?? null);
        }
        return;
      }

      let recordId = entryId;
      let recordOwnerId = ownerId;
      if (!recordId || !recordOwnerId) {
        try {
          const { data, error } = await supabase
            .from("entries")
            .select("id, owner")
            .eq("slug", slug)
            .maybeSingle();

          if (error) {
            console.error("[archive-entry] Could not load entry ownership.", error);
          }
          recordId = data?.id ?? null;
          recordOwnerId = data?.owner ?? null;
        } catch (error) {
          console.error("[archive-entry] Could not load entry ownership.", error);
          if (isMounted) {
            setIsOwner(false);
            setResolvedEntryId(null);
          }
          return;
        }
      }

      if (isMounted) {
        setResolvedEntryId(recordId);
        setIsOwner(Boolean(recordId && recordOwnerId && recordOwnerId === userId));
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      authStateChanged = true;
      window.clearTimeout(lookupTimer);
      lookupTimer = window.setTimeout(() => {
        void resolveOwner(session?.user?.id ?? null);
      }, 0);
    });

    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error("[archive-entry] Could not read the current session.", error);
      }
      if (isMounted && !authStateChanged) {
        void resolveOwner(session?.user?.id ?? null);
      }
    }).catch((error) => {
      console.error("[archive-entry] Could not read the current session.", error);
    });

    return () => {
      isMounted = false;
      window.clearTimeout(lookupTimer);
      subscription.unsubscribe();
    };
  }, [entryId, ownerId, slug]);

  const openDeleteConfirmation = () => {
    const dialog = deleteDialogRef.current;
    if (!dialog || dialog.open || isDeleting || deleteInProgressRef.current) {
      return;
    }

    setMessage("");
    dialog.showModal();
    window.requestAnimationFrame(() => {
      cancelDeleteRef.current?.focus({ preventScroll: true });
    });
  };

  const confirmDelete = async () => {
    if (isDeleting || deleteInProgressRef.current) {
      return;
    }

    deleteInProgressRef.current = true;
    deleteDialogRef.current?.close();
    setIsDeleting(true);
    setMessage("");

    try {
      const result = await deleteArchiveEntry(resolvedEntryId);
      if (!result?.ok) {
        setMessage(result?.message || "That change wasn't saved.");
        return;
      }

      router.replace("/");
    } catch (error) {
      console.error("[archive-entry] Delete request could not be completed.", error);
      setMessage(translate(locale, "That change wasn't saved."));
    } finally {
      deleteInProgressRef.current = false;
      setIsDeleting(false);
    }
  };

  if (!isOwner) {
    return null;
  }

  return (
    <>
      <div
        className="archive-entry__owner-actions"
        role="group"
        aria-label={translate(locale, "Entry owner actions")}
        aria-busy={isDeleting}
      >
        {isDeleting ? (
          <span className="archive-entry__owner-pending" role="status">{translate(locale, "Deleting…")}</span>
        ) : (
          <>
            <Link
              className="archive-entry__owner-action"
              href={`/archive/${encodeURIComponent(slug)}/edit`}
              prefetch={true}
            >
              <svg
                aria-hidden="true"
                className="archive-entry__owner-icon"
                focusable="false"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L8 18l-4 1 1-4Z" />
              </svg>
              {translate(locale, "Edit")}
            </Link>
            <button
              className="archive-entry__owner-action archive-entry__owner-action--delete"
              type="button"
              onClick={openDeleteConfirmation}
            >
              <svg
                aria-hidden="true"
                className="archive-entry__owner-icon"
                focusable="false"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 6h18" />
                <path d="M8 6V4h8v2" />
                <path d="m19 6-1 14H6L5 6" />
                <path d="M10 11v5M14 11v5" />
              </svg>
              {translate(locale, "Delete")}
            </button>
          </>
        )}
        {message ? <p className="archive-entry__owner-message" role="alert">{translate(locale, message)}</p> : null}
      </div>

      <dialog
        ref={deleteDialogRef}
        className="archive-delete-dialog"
        aria-labelledby={deleteDialogTitleId}
        aria-describedby={deleteDialogDescriptionId}
        onClick={(event) => {
          if (event.target === event.currentTarget) {
            event.currentTarget.close();
          }
        }}
      >
        <div className="archive-delete-dialog__panel">
          <h2 className="archive-delete-dialog__title" id={deleteDialogTitleId}>
            {translate(locale, "Delete entry")}
          </h2>
          <p className="archive-delete-dialog__description" id={deleteDialogDescriptionId}>
            {translate(locale, "Delete this archive entry? This cannot be undone.")}
          </p>
          <p className="archive-delete-dialog__entry-title">{title}</p>
          <div className="archive-delete-dialog__actions">
            <button
              ref={cancelDeleteRef}
              className="archive-delete-dialog__button archive-delete-dialog__button--cancel"
              type="button"
              onClick={() => deleteDialogRef.current?.close()}
            >
              {translate(locale, "Cancel")}
            </button>
            <button
              className="archive-delete-dialog__button archive-delete-dialog__button--confirm"
              type="button"
              onClick={confirmDelete}
            >
              {translate(locale, "Delete")}
            </button>
          </div>
        </div>
      </dialog>
      {isDeleting ? <InteractionLock message={translate(locale, "Deleting…")} /> : null}
    </>
  );
}
