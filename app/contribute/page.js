import Link from "next/link";
import ContributionForm from "../../components/ContributionForm.js";
import { createClient } from "../../lib/supabase/server.js";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Contribute",
  description: "Add a story and photograph to the Khmer Wedding Tradition Archive.",
};

export default async function ContributePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <main className="contribute-page" aria-labelledby="contribute-title">
      <section className="contribute-card">
        <p className="contribute-card__eyebrow">Grow the collection</p>
        <h1 id="contribute-title">Contribute an archive entry</h1>
        <p className="contribute-card__intro">
          Share a family story and a photograph. New entries are added to the public archive.
        </p>

        {user ? (
          <ContributionForm />
        ) : (
          <div className="contribute-login-prompt">
            <p>Log in to add an entry to the archive.</p>
            <Link className="contribute-submit" href="/login">Log in to contribute</Link>
          </div>
        )}
      </section>
    </main>
  );
}
