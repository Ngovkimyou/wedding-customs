import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "../../lib/supabase/server.js";
import LocaleText from "../../components/LocaleText.js";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "My Entries",
  description: "Check the review status of your archive contributions.",
};

const STATUS_LABELS = {
  pending: "Pending review",
  published: "Published",
  returned: "Changes requested",
};

export default async function MyEntriesPage() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError) {
    console.error("[my-entries] Could not verify the current session.", authError);
  }
  if (!user) {
    redirect("/login");
  }

  const { data, error } = await supabase
    .from("entries")
    .select("id, slug, title_en, title_kh, status")
    .eq("owner", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[my-entries] Could not load the current user's entries.", error);
  }

  const entries = error ? [] : data ?? [];
  const returnedEntryIds = entries
    .filter((entry) => entry.status === "returned")
    .map((entry) => entry.id);
  let feedbackByEntryId = new Map();
  let feedbackError = false;

  if (returnedEntryIds.length > 0) {
    try {
      const { data: feedbackRows, error: noteError } = await supabase
        .from("entry_review_feedback")
        .select("entry_id, note")
        .in("entry_id", returnedEntryIds);

      if (noteError) {
        console.error("[my-entries] Reviewer feedback could not be loaded.", noteError);
        feedbackError = true;
      } else {
        feedbackByEntryId = new Map((feedbackRows ?? []).map((row) => [row.entry_id, row.note]));
      }
    } catch (noteError) {
      console.error("[my-entries] Reviewer feedback could not be loaded.", noteError);
      feedbackError = true;
    }
  }

  return (
    <main className="contribute-page my-entries-page" aria-labelledby="my-entries-title">
      <section className="contribute-card my-entries-card">
        <p className="contribute-card__eyebrow"><LocaleText>Contributor space</LocaleText></p>
        <h1 id="my-entries-title"><LocaleText>My Entries</LocaleText></h1>
        <p className="contribute-card__intro">
          <LocaleText>Check each story’s review status. New and updated entries wait for review before they appear publicly.</LocaleText>
        </p>

        <div className={error || entries.length ? "my-entries-content" : "my-entries-empty"}>
          {error ? (
            <p className="my-entries-message" role="alert">
              <LocaleText>Your entries could not be loaded right now. Please try again later.</LocaleText>
            </p>
          ) : entries.length ? (
            <ul className="my-entries-list">
              {entries.map((entry) => {
                const statusVariant = STATUS_LABELS[entry.status] ? entry.status : "unknown";
                const status = STATUS_LABELS[statusVariant] ?? "Status unavailable";

                return (
                  <li className={`my-entries-list__item my-entries-list__item--${statusVariant}`} key={entry.id}>
                    <div className="my-entries-list__story">
                      <LocaleText as="h2" en={entry.title_en} km={entry.title_kh} />
                    </div>
                    <div className={`my-entries-list__status my-entries-list__status--${statusVariant}`}>
                      <span><LocaleText>{status}</LocaleText></span>
                    </div>
                    <Link
                      className="my-entries-list__edit"
                      href={`/archive/${encodeURIComponent(entry.slug)}/edit`}
                    >
                      <LocaleText>Edit entry</LocaleText>
                    </Link>
                    {statusVariant === "returned" ? (
                      <aside className="my-entries-list__feedback">
                        <h3><LocaleText>Reviewer feedback</LocaleText></h3>
                        <p dir="auto">
                          {feedbackError
                            ? <LocaleText>Reviewer feedback could not be loaded. Please refresh the page.</LocaleText>
                            : feedbackByEntryId.get(entry.id)
                              || <LocaleText>This requested change has no feedback.</LocaleText>}
                        </p>
                      </aside>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="my-entries-message"><LocaleText>You haven’t contributed an entry yet.</LocaleText></p>
          )}

          <Link className="my-entries-contribute" href="/contribute" prefetch={false}>
            <LocaleText>Add an entry</LocaleText>
          </Link>
        </div>
      </section>
    </main>
  );
}
