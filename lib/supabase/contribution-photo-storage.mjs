import {
  CONTRIBUTION_LIMITS,
  detectSupportedPhoto,
} from "../contribution-validation.mjs";

const PHOTO_BUCKET = "photos";
const UUID_FILENAME_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.(?:jpg|png|webp|avif)$/iu;
const STORAGE_PATH_PREFIX = `/storage/v1/object/public/${PHOTO_BUCKET}/`;

function getUserPhotoFilename(storagePath, userId) {
  if (typeof storagePath !== "string") {
    return null;
  }

  const separator = storagePath.indexOf("/");
  if (separator < 0 || storagePath.slice(0, separator) !== userId) {
    return null;
  }

  const filename = storagePath.slice(separator + 1);
  return filename.includes("/") || !UUID_FILENAME_PATTERN.test(filename)
    ? null
    : filename;
}

export function getOwnedContributionPhotoPath(
  publicUrl,
  userId,
  supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL,
) {
  try {
    const configuredOrigin = new URL(supabaseUrl).origin;
    const photoUrl = new URL(publicUrl);

    if (photoUrl.origin !== configuredOrigin || !photoUrl.pathname.startsWith(STORAGE_PATH_PREFIX)) {
      return null;
    }

    const storagePath = photoUrl.pathname.slice(STORAGE_PATH_PREFIX.length);
    return getUserPhotoFilename(storagePath, userId) ? storagePath : null;
  } catch {
    return null;
  }
}

export async function removeUnreferencedContributionPhoto(
  supabase,
  storagePath,
  publicUrl = null,
  { ignoreEntryId = null, preserveForRollback = false } = {},
) {
  try {
    const photoUrl = publicUrl
      ?? supabase.storage.from(PHOTO_BUCKET).getPublicUrl(storagePath).data.publicUrl;
    let referenceQuery = supabase
      .from("entries")
      .select("id")
      .eq("thumbnail_path", photoUrl)
      .limit(1);

    if (ignoreEntryId) {
      referenceQuery = referenceQuery.neq("id", ignoreEntryId);
    }

    const { data: references, error: lookupError } = await referenceQuery;
    if (lookupError) {
      console.error("[archive-entry] Could not check whether a photo is still in use.", lookupError);
      return { ok: false, removed: false };
    }
    if (references?.length) {
      return { ok: true, removed: false, referenced: true };
    }

    let backup = null;
    if (preserveForRollback) {
      const result = await downloadContributionPhotoBackup(supabase, storagePath);
      if (!result.ok) {
        return { ok: false, removed: false };
      }
      backup = result.blob;
    }

    const { error } = await supabase.storage.from(PHOTO_BUCKET).remove([storagePath]);
    if (error) {
      console.error("[archive-entry] Could not remove an unreferenced photo from storage.", error);
      return { ok: false, removed: false };
    }
    return { ok: true, removed: true, ...(preserveForRollback ? { backup } : {}) };
  } catch (error) {
    console.error("[archive-entry] Could not remove an unreferenced photo from storage.", error);
    return { ok: false, removed: false };
  }
}

export async function verifyContributionPhoto(supabase, storagePath, userId) {
  const filename = getUserPhotoFilename(storagePath, userId);
  if (!filename) {
    return {
      ok: false,
      fieldErrors: { photo: "Please choose and upload a valid photograph." },
    };
  }

  try {
    const { data: photoBlob, error } = await supabase.storage
      .from(PHOTO_BUCKET)
      .download(storagePath);

    if (error) {
      console.error("[archive-entry] Uploaded photo could not be verified.", error);
      await removeUnreferencedContributionPhoto(supabase, storagePath);
      return {
        ok: false,
        fieldErrors: { photo: "The uploaded photo could not be verified. Please upload it again." },
      };
    }

    if (!photoBlob || photoBlob.size <= 0 || photoBlob.size > CONTRIBUTION_LIMITS.photoMaxBytes) {
      await removeUnreferencedContributionPhoto(supabase, storagePath);
      return {
        ok: false,
        fieldErrors: { photo: "Choose an image that is no larger than 10 MB." },
      };
    }

    const signature = new Uint8Array(await photoBlob.slice(0, 64).arrayBuffer());
    const photoFormat = detectSupportedPhoto(signature);
    const extension = filename.split(".").at(-1)?.toLowerCase();
    const declaredMimeType = (photoBlob.type || "").toLowerCase();

    if (!photoFormat
      || photoFormat.extension !== extension
      || (declaredMimeType && declaredMimeType !== photoFormat.mimeType)) {
      await removeUnreferencedContributionPhoto(supabase, storagePath);
      return {
        ok: false,
        fieldErrors: { photo: "Use a valid JPEG, PNG, WebP, or AVIF image with a matching file type." },
      };
    }

    const { data: { publicUrl } } = supabase.storage.from(PHOTO_BUCKET).getPublicUrl(storagePath);
    return { ok: true, publicUrl };
  } catch (error) {
    console.error("[archive-entry] Uploaded photo verification failed.", error);
    await removeUnreferencedContributionPhoto(supabase, storagePath);
    return {
      ok: false,
      fieldErrors: { photo: "The uploaded photo could not be verified. Please upload it again." },
    };
  }
}

export async function removeOwnedContributionPhotoIfUnused(supabase, publicUrl, userId) {
  const storagePath = getOwnedContributionPhotoPath(publicUrl, userId);
  if (storagePath) {
    return removeUnreferencedContributionPhoto(supabase, storagePath, publicUrl);
  }
  return { ok: !publicUrl, removed: false };
}

export async function downloadContributionPhotoBackup(supabase, storagePath) {
  try {
    const { data, error } = await supabase.storage.from(PHOTO_BUCKET).download(storagePath);
    if (error) {
      if (Number(error.statusCode) === 404 || Number(error.status) === 404) {
        return { ok: true, blob: null };
      }
      console.error("[archive-entry] Could not preserve the photograph before deletion.", error);
      return { ok: false, blob: null };
    }
    return { ok: true, blob: data ?? null };
  } catch (error) {
    console.error("[archive-entry] Could not preserve the photograph before deletion.", error);
    return { ok: false, blob: null };
  }
}

export async function restoreContributionPhoto(supabase, storagePath, photoBlob) {
  if (!photoBlob) {
    return true;
  }

  const extension = storagePath.split(".").at(-1)?.toLowerCase();
  const contentType = photoBlob.type
    || ({
      jpg: "image/jpeg",
      png: "image/png",
      webp: "image/webp",
      avif: "image/avif",
    })[extension];

  try {
    const { error } = await supabase.storage.from(PHOTO_BUCKET).upload(storagePath, photoBlob, {
      contentType,
      upsert: false,
    });
    if (error) {
      console.error("[archive-entry] Could not restore the photograph after the entry delete failed.", error);
      return false;
    }
    return true;
  } catch (error) {
    console.error("[archive-entry] Could not restore the photograph after the entry delete failed.", error);
    return false;
  }
}
