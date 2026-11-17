import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "../../lib/supabase/server.js";

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
    .select("id, slug, title_en, status")
    .eq("owner", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[my-entries] Could not load the current user's entries.", error);
  }

  const entries = error ? [] : data ?? [];

  return (
    <main className="contribute-page my-entries-page" aria-labelledby="my-entries-title">
      <section className="contribute-card my-entries-card">
        <p className="contribute-card__eyebrow">Contributor space</p>
        <h1 id="my-entries-title">My Entries</h1>
        <p className="contribute-card__intro">
          Check each story’s review status. New and updated entries wait for review before they appear publicly.
        </p>

        {error ? (
          <p className="my-entries-message" role="alert">
            Your entries could not be loaded right now. Please try again later.
          </p>
        ) : entries.length ? (
          <ul className="my-entries-list">
            {entries.map((entry) => {
              const statusVariant = STATUS_LABELS[entry.status] ? entry.status : "unknown";
              const status = STATUS_LABELS[statusVariant] ?? "Status unavailable";

              return (
                <li className={`my-entries-list__item my-entries-list__item--${statusVariant}`} key={entry.id}>
                  <div className="my-entries-list__story">
                    <h2>{entry.title_en}</h2>
                  </div>
                  <div className={`my-entries-list__status my-entries-list__status--${statusVariant}`}>
                    <span>{status}</span>
                  </div>
                  <Link
                    className="my-entries-list__edit"
                    href={`/archive/${encodeURIComponent(entry.slug)}/edit`}
                  >
                    Edit entry
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="my-entries-message">You haven’t contributed an entry yet.</p>
        )}

        <Link className="my-entries-contribute" href="/contribute">
          Add an entry
        </Link>
      </section>
    </main>
  );
}
