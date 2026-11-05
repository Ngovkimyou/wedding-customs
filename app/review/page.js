import Link from "next/link";
import ReviewQueue from "../../components/ReviewQueue.js";
import { createClient } from "../../lib/supabase/server.js";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Review Queue | ជួរពិនិត្យ",
  description: "Review pending community archive entries. ពិនិត្យធាតុសហគមន៍ដែលកំពុងរង់ចាំការពិនិត្យ។",
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
        <p className="contribute-card__eyebrow review-card__eyebrow">
          <span>Reviewer access</span>
          <span lang="km" dir="auto">សិទ្ធិអ្នកពិនិត្យ</span>
        </p>
        <h1 id="review-title">
          <span>Review Queue</span>
          <span className="review-card__khmer-title" lang="km" dir="auto">ជួរពិនិត្យ</span>
        </h1>
        <p className="review-notice" role="status">
          <span>You don’t have permission to review entries.</span>
          <span lang="km" dir="auto">អ្នកមិនមានសិទ្ធិចូលប្រើជួរពិនិត្យទេ។</span>
        </p>
        <Link className="review-notice__link" href="/">
          <span>Back to the archive</span>
          <span lang="km" dir="auto">ត្រឡប់ទៅបណ្ណសារ</span>
        </Link>
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
        <p className="contribute-card__eyebrow review-card__eyebrow">
          <span>Community archive</span>
          <span lang="km" dir="auto">បណ្ណសារសហគមន៍</span>
        </p>
        <h1 id="review-title">
          <span>Review Queue</span>
          <span className="review-card__khmer-title" lang="km" dir="auto">ជួរពិនិត្យ</span>
        </h1>
        <p className="contribute-card__intro review-card__intro">
          <span>Review community stories in the order they were submitted.</span>
          <span lang="km" dir="auto">ពិនិត្យសាច់រឿងសហគមន៍តាមលំដាប់ពេលដាក់ស្នើ។</span>
        </p>

        {loadError ? (
          <p className="review-page__error" role="alert">
            <span>The review queue couldn’t be loaded. Please try again later.</span>
            <span lang="km" dir="auto">មិនអាចបើកជួរពិនិត្យបានទេ។ សូមព្យាយាមម្ដងទៀតពេលក្រោយ។</span>
          </p>
        ) : (
          <ReviewQueue entries={entries ?? []} />
        )}
      </section>
    </main>
  );
}
