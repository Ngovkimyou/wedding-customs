import Link from "next/link";
import ReviewQueue from "../../components/ReviewQueue.js";
import { createClient } from "../../lib/supabase/server.js";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Review Queue",
  description: "Review pending community archive entries.",
};

function formatSubmittedAt(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Phnom_Penh",
  }).format(date);
}

function AccessNotice() {
  return (
    <main className="contribute-page review-page" aria-labelledby="review-title">
      <section className="contribute-card review-card review-card--notice">
        <p className="contribute-card__eyebrow review-card__eyebrow">Reviewer access</p>
        <h1 id="review-title">Review Queue</h1>
        <p className="review-notice" role="status">You don’t have permission to review entries.</p>
        <Link className="review-notice__link" href="/">Back to the archive</Link>
      </section>
    </main>
  );
}

export default async function ReviewPage() {
  let supabase;
  try {
    supabase = await createClient();
  } catch (error) {
    console.error("[review] Supabase could not be initialized.", error);
    return <AccessNotice />;
  }

  let isReviewer = false;
  try {
    const { data, error } = await supabase.rpc("is_reviewer");
    if (error) {
      console.error("[review] Reviewer access could not be checked.", error);
    } else {
      isReviewer = data === true;
    }
  } catch (error) {
    console.error("[review] Reviewer access could not be checked.", error);
  }

  if (!isReviewer) {
    return <AccessNotice />;
  }

  let entries = null;
  let loadError = false;
  try {
    const { data, error } = await supabase
      .from("entries")
      .select("id, title_en, title_kh, summary, description, thumbnail_path, period_label, location, created_at")
      .eq("status", "pending")
      .order("created_at", { ascending: true });

    if (error) {
      console.error("[review] Pending entries could not be loaded.", error);
      loadError = true;
    } else {
      entries = (data ?? []).map((entry) => ({
        ...entry,
        submittedAtLabel: formatSubmittedAt(entry.created_at),
      }));
    }
  } catch (error) {
    console.error("[review] Pending entries could not be loaded.", error);
    loadError = true;
  }

  return (
    <main className="contribute-page review-page" aria-labelledby="review-title">
      <section className="contribute-card review-card">
        <p className="contribute-card__eyebrow review-card__eyebrow">Community archive</p>
        <h1 id="review-title">Review Queue</h1>
        <p className="contribute-card__intro review-card__intro">
          Review community stories in the order they were submitted.
        </p>

        {loadError ? (
          <p className="review-page__error" role="alert">
            The review queue couldn’t be loaded. Please try again later.
          </p>
        ) : (
          <ReviewQueue entries={entries ?? []} />
        )}
      </section>
    </main>
  );
}
