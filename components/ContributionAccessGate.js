"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "../lib/supabase/client.js";
import LocaleText from "./LocaleText.js";

export default function ContributionAccessGate({ children }) {
  const [hasSession, setHasSession] = useState(null);

  useEffect(() => {
    const supabase = createClient();
    let isMounted = true;
    let authRevision = 0;

    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (isMounted && authRevision === 0) {
        setHasSession(!error && Boolean(session?.user));
      }
    }).catch(() => {
      if (isMounted && authRevision === 0) {
        setHasSession(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      authRevision += 1;
      if (isMounted) {
        setHasSession(Boolean(session?.user));
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  if (hasSession === null) {
    return (
      <p className="contribute-card__intro" role="status" aria-live="polite">
        <LocaleText>Checking your sign-in…</LocaleText>
      </p>
    );
  }

  if (hasSession) {
    return children;
  }

  return (
    <div className="contribute-login-prompt">
      <p><LocaleText>Log in to add an entry to the archive.</LocaleText></p>
      <Link className="contribute-submit" href="/login" prefetch={false}>
        <LocaleText>Log in to contribute</LocaleText>
      </Link>
    </div>
  );
}
