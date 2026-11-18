"use client";

import { useEffect, useState } from "react";
import { createClient } from "../lib/supabase/client.js";
import ArchiveCard from "./ArchiveCard.js";

export default function CommunityArchiveCards({ entries = [] }) {
  const [ownedEntryIds, setOwnedEntryIds] = useState(() => new Set());

  useEffect(() => {
    const supabase = createClient();
    let isMounted = true;
    let authStateChanged = false;
    let sessionLookupTimer = null;
    let ownershipRevision = 0;

    const loadOwnedEntryIds = async (userId, revision) => {
      if (!userId) {
        if (isMounted && revision === ownershipRevision) {
          setOwnedEntryIds(new Set());
        }
        return;
      }

      try {
        const { data, error } = await supabase
          .from("entries")
          .select("id")
          .eq("owner", userId);

        if (error) {
          console.error("[archive] Could not load the current user's contribution ids.", error);
          return;
        }
        if (isMounted && revision === ownershipRevision) {
          setOwnedEntryIds(new Set((data ?? []).map((entry) => entry.id)));
        }
      } catch (error) {
        console.error("[archive] Could not load the current user's contribution ids.", error);
      }
    };

    const syncSession = (session) => {
      const revision = ++ownershipRevision;
      const userId = session?.user?.id ?? null;
      setOwnedEntryIds(new Set());
      void loadOwnedEntryIds(userId, revision);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      authStateChanged = true;
      window.clearTimeout(sessionLookupTimer);
      sessionLookupTimer = window.setTimeout(() => syncSession(session), 0);
    });

    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error("[archive] Could not read the current session for community ownership labels.", error);
      }
      if (isMounted && !authStateChanged) {
        syncSession(session);
      }
    }).catch((error) => {
      console.error("[archive] Could not read the current session for community ownership labels.", error);
    });

    return () => {
      isMounted = false;
      window.clearTimeout(sessionLookupTimer);
      subscription.unsubscribe();
    };
  }, []);

  return entries.map((entry) => (
    <ArchiveCard
      entry={entry}
      isOwnedByCurrentUser={ownedEntryIds.has(entry.dbId)}
      key={entry.dbId ?? entry.slug}
    />
  ));
}
