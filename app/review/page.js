import Link from "next/link";
import ReviewQueue from "../../components/ReviewQueue.js";
import { createClient } from "../../lib/supabase/server.js";
import LocaleText from "../../components/LocaleText.js";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Review Queue",
  description: "Review pending community archive entries.",
};

function AccessNotice({ unavailable = false }) {
  return (
    <main className="contribute-page review-page" aria-labelledby="review-title">
      <section className="contribute-card review-card review-card--notice">
        <p className="contribute-card__eyebrow review-card__eyebrow"><LocaleText>Reviewer access</LocaleText></p>
        <h1 id="review-title"><LocaleText>Review Queue</LocaleText></h1>
        <p className="review-notice" role={unavailable ? "alert" : "status"}>
          <LocaleText>
            {unavailable
              ? "Reviewer access could not be checked. Please try again later."
              : "You don’t have permission to review entries."}
          </LocaleText>
        </p>
        <Link className="review-notice__link" href="/"><LocaleText>Back to the archive</LocaleText></Link>
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
    return <AccessNotice unavailable />;
  }

  let isReviewer = false;
  let reviewerCheckFailed = false;
  try {
    const { data, error } = await supabase.rpc("is_reviewer");
    if (error) {
      console.error("[review] Reviewer access could not be checked.", error);
      reviewerCheckFailed = true;
    } else {
      isReviewer = data === true;
    }
  } catch (error) {
    console.error("[review] Reviewer access could not be checked.", error);
    reviewerCheckFailed = true;
  }

  if (reviewerCheckFailed) {
    return <AccessNotice unavailable />;
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
      entries = data ?? [];
    }
  } catch (error) {
    console.error("[review] Pending entries could not be loaded.", error);
    loadError = true;
  }

  return (
    <main className="contribute-page review-page" aria-labelledby="review-title">
      <section className="contribute-card review-card">
        <p className="contribute-card__eyebrow review-card__eyebrow"><LocaleText>Community archive</LocaleText></p>
        <h1 id="review-title"><LocaleText>Review Queue</LocaleText></h1>
        <p className="contribute-card__intro review-card__intro">
          <LocaleText>Review community stories in the order they were submitted.</LocaleText>
        </p>

        {loadError ? (
          <p className="review-page__error" role="alert">
            <LocaleText>The review queue couldn’t be loaded. Please try again later.</LocaleText>
          </p>
        ) : (
          <ReviewQueue entries={entries ?? []} />
        )}
      </section>
    </main>
  );
}
