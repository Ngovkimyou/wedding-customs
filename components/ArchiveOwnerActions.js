"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { deleteArchiveEntry } from "../app/contribute/actions.js";
import { createClient } from "../lib/supabase/client.js";

export default function ArchiveOwnerActions({ entryId, ownerId, slug, title }) {
  const router = useRouter();
  const [isOwner, setIsOwner] = useState(false);
  const [resolvedEntryId, setResolvedEntryId] = useState(entryId ?? null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [message, setMessage] = useState("");

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

  const handleDelete = async () => {
    const confirmed = window.confirm(`Delete “${title}”? This cannot be undone.`);
    if (!confirmed || isDeleting) {
      return;
    }

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
      setMessage("That change wasn't saved.");
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isOwner) {
    return null;
  }

  return (
    <div
      className="archive-entry__owner-actions"
      role="group"
      aria-label="Entry owner actions"
      aria-busy={isDeleting}
    >
      {isDeleting ? (
        <span className="archive-entry__owner-pending" role="status">Deleting…</span>
      ) : (
        <>
          <Link
            className="archive-entry__owner-action"
            href={`/archive/${encodeURIComponent(slug)}/edit`}
            prefetch={true}
          >
            Edit
          </Link>
          <button
            className="archive-entry__owner-action archive-entry__owner-action--delete"
            type="button"
            onClick={handleDelete}
          >
            Delete
          </button>
        </>
      )}
      {message ? <p className="archive-entry__owner-message" role="alert">{message}</p> : null}
    </div>
  );
}
