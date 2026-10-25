import { notFound, redirect } from "next/navigation";
import ArchiveEntryFormPage from "../../../../components/ArchiveEntryFormPage.js";
import {
  isCommunityArchiveEntry,
  mapSupabaseEntry,
} from "../../../../lib/archive-entry-mapper.mjs";
import { resolveArchiveThumbnail } from "../../../../lib/archive-thumbnail-assets.js";
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

  const { data: row, error: entryError } = await supabase
    .from("entries")
    .select("*")
    .eq("slug", slug)
    .eq("owner", user.id)
    .maybeSingle();

  if (entryError) {
    console.error("[archive-entry] Could not load the contributor's own entry for editing.", entryError);
  }

  const entry = row
    ? mapSupabaseEntry(row, { resolveThumbnail: resolveArchiveThumbnail })
    : null;
  if (!entry?.dbId || !entry.ownerId || !isCommunityArchiveEntry(entry)) {
    notFound();
  }

  if (entry.ownerId !== user.id) {
    redirect(`/archive/${encodeURIComponent(entry.slug)}`);
  }

  return <ArchiveEntryFormPage mode="edit" entry={entry} />;
}
