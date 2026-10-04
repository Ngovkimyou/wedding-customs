import {
  getOwnedContributionPhotoPath,
  removeUnreferencedContributionPhoto,
  restoreContributionPhoto,
} from "./contribution-photo-storage.mjs";

async function reconcileFailedDelete(supabase, entry, userId, photoCleanup, photoPath, photoBackup) {
  try {
    const { data, error } = await supabase
      .from("entries")
      .select("id")
      .eq("id", entry.id)
      .eq("owner", userId)
      .maybeSingle();

    if (!error && !data) {
      // The delete may have reached Supabase even if its response was lost.
      return { ok: true, slug: entry.slug };
    }
    if (error) {
      console.error("[archive-entry] Could not confirm whether the entry delete completed.", error);
    }
  } catch (error) {
    console.error("[archive-entry] Could not confirm whether the entry delete completed.", error);
  }

  if (photoCleanup.removed && photoPath) {
    await restoreContributionPhoto(supabase, photoPath, photoBackup);
  }
  return { ok: false };
}

/** Delete an owned entry and its unshared, user-owned photo. */
export async function deleteOwnedContributionEntry(
  supabase,
  entryId,
  userId,
  supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL,
) {
  let entry;
  try {
    const { data, error } = await supabase
      .from("entries")
      .select("id, slug, thumbnail_path")
      .eq("id", entryId)
      .eq("owner", userId)
      .maybeSingle();

    if (error) {
      console.error("[archive-entry] Entry could not be checked before deletion.", error);
      return { ok: false };
    }
    if (!data) {
      console.error("[archive-entry] No owned entry was found for deletion.");
      return { ok: false };
    }
    entry = data;
  } catch (error) {
    console.error("[archive-entry] Entry could not be checked before deletion.", error);
    return { ok: false };
  }

  let photoPath = null;
  let photoBackup = null;
  let photoCleanup = { removed: false };
  if (entry.thumbnail_path) {
    photoPath = getOwnedContributionPhotoPath(entry.thumbnail_path, userId, supabaseUrl);
    if (!photoPath) {
      console.error("[archive-entry] Refusing to delete an entry with an unmanaged or non-owned photo path.");
      return { ok: false };
    }

    photoCleanup = await removeUnreferencedContributionPhoto(
      supabase,
      photoPath,
      entry.thumbnail_path,
      { ignoreEntryId: entry.id, preserveForRollback: true },
    );
    if (!photoCleanup.ok) {
      return { ok: false };
    }
    photoBackup = photoCleanup.backup ?? null;
  }

  try {
    const { data, error } = await supabase
      .from("entries")
      .delete()
      .eq("id", entryId)
      .eq("owner", userId)
      .select("id, slug")
      .maybeSingle();

    if (error || !data) {
      if (error) {
        console.error("[archive-entry] Entry deletion failed.", error);
      } else {
        console.error("[archive-entry] Supabase returned no deleted row; RLS may have refused the delete.");
      }
      return reconcileFailedDelete(supabase, entry, userId, photoCleanup, photoPath, photoBackup);
    }

    return { ok: true, slug: data.slug };
  } catch (error) {
    console.error("[archive-entry] Entry deletion failed.", error);
    return reconcileFailedDelete(supabase, entry, userId, photoCleanup, photoPath, photoBackup);
  }
}
