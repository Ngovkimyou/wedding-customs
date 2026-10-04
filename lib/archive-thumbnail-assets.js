import archive001Image from "../assets/images/archive-001.avif";
import archive002Image from "../assets/images/archive-002.avif";
import archive003Image from "../assets/images/archive-003.avif";
import archive004Image from "../assets/images/archive-004.avif";
import archive005Image from "../assets/images/archive-005.avif";
import wp05Image from "../assets/images/wp-05.avif";

const thumbnailAssets = new Map([
  ["archive-001.avif", archive001Image],
  ["archive-002.avif", archive002Image],
  ["archive-003.avif", archive003Image],
  ["archive-004.avif", archive004Image],
  ["archive-005.avif", archive005Image],
  ["wp-05.avif", wp05Image],
]);

const thumbnailStems = new Map([
  ["archive-001", archive001Image],
  ["archive-002", archive002Image],
  ["archive-003", archive003Image],
  ["archive-004", archive004Image],
  ["archive-005", archive005Image],
  ["wp-05", wp05Image],
]);

const thumbnailAssetsBySlug = new Map([
  ["how-my-parents-met", archive001Image],
  ["courtship-and-family-involvement", archive002Image],
  ["engagement-traditions", archive003Image],
  ["wedding-preparation", archive004Image],
  ["traditional-khmer-wedding-ceremonies", archive005Image],
  ["wedding-ceremonies-afternoon", wp05Image],
]);

function normalizeThumbnailPath(value) {
  return String(value ?? "")
    .trim()
    .replace(/\\/gu, "/")
    .split(/[?#]/u, 1)[0]
    .split("/")
    .pop()
    ?.toLowerCase() ?? "";
}

function getThumbnailStem(value) {
  return value.replace(/\.[a-z0-9]+$/iu, "");
}

/**
 * Resolve the repo-relative thumbnail paths currently stored in Supabase to
 * the imported image objects used by Next/Image. Absolute URLs are preserved
 * so the table can later move to a Supabase Storage bucket without changing
 * the archive card interface.
 */
export function resolveArchiveThumbnail(value, fallbackSlug = "") {
  const path = String(value ?? "").trim();

  if (!path) {
    return null;
  }

  const filename = normalizeThumbnailPath(path);

  const importedAsset = thumbnailAssets.get(filename)
    ?? thumbnailStems.get(getThumbnailStem(filename))
    ?? thumbnailAssetsBySlug.get(String(fallbackSlug).trim().toLowerCase());

  if (importedAsset) {
    return importedAsset;
  }

  try {
    const configuredUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const configuredOrigin = configuredUrl ? new URL(configuredUrl).origin : null;
    const thumbnailUrl = new URL(path);

    if (
      configuredOrigin
      && thumbnailUrl.origin === configuredOrigin
      && thumbnailUrl.pathname.startsWith("/storage/v1/object/public/photos/")
    ) {
      return thumbnailUrl.href;
    }
  } catch {
    // A malformed or non-Storage URL is not an acceptable archive thumbnail.
  }

  return null;
}
