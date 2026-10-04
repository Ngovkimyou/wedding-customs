import { notFound, redirect } from "next/navigation";
import ArchiveEntryFormPage from "../../../../components/ArchiveEntryFormPage.js";
import { getPublicArchiveEntryBySlug } from "../../../../lib/supabase/entries.js";
import { createClient } from "../../../../lib/supabase/server.js";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Edit archive entry",
  description: "Update your contributed archive story.",
};

export default async function EditArchiveEntryPage({ params }) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error) {
    console.error("[archive-entry] Could not verify the user for entry editing.", error);
  }
  if (!user) {
    redirect("/login");
  }

  const entry = await getPublicArchiveEntryBySlug(slug);
  if (!entry?.dbId || !entry.ownerId) {
    notFound();
  }

  if (entry.ownerId !== user.id) {
    redirect(`/archive/${encodeURIComponent(entry.slug)}`);
  }

  return <ArchiveEntryFormPage mode="edit" entry={entry} />;
}
