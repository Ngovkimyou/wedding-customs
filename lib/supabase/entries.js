import { unstable_cache } from "next/cache";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { mapSupabaseEntries, mapSupabaseEntry } from "../archive-entry-mapper.mjs";
import { sortArchiveEntries } from "../archive-entry-order.mjs";
import { resolveArchiveThumbnail } from "../archive-thumbnail-assets.js";

const ARCHIVE_CACHE_SECONDS = 60;
const ARCHIVE_QUERY_TIMEOUT_MS = 2500;
let publicClient;

function getPublicClient() {
  if (publicClient) {
    return publicClient;
  }

  publicClient = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        detectSessionInUrl: false,
        persistSession: false,
      },
    },
  );

  return publicClient;
}

async function fetchPublicArchiveRows() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ARCHIVE_QUERY_TIMEOUT_MS);

  try {
    const { data, error } = await getPublicClient()
      .from("entries")
      .select("*")
      .order("created_at", { ascending: false })
      .abortSignal(controller.signal);

    if (error) {
      throw error;
    }

    return data ?? [];
  } finally {
    clearTimeout(timeout);
  }
}

// Archive records are public and shared by the home and search pages. A short
// cache avoids making both pages wait on the same Supabase request during each
// navigation while still picking up edits promptly.
const getCachedPublicArchiveRows = unstable_cache(
  fetchPublicArchiveRows,
  ["public-archive-entries"],
  { revalidate: ARCHIVE_CACHE_SECONDS, tags: ["public-archive-entries"] },
);

/**
 * The order is part of the page contract: numbered curator records are shown
 * first, followed by unnumbered records newest-first.
 * `select("*")` keeps this helper forward-compatible with harmless metadata
 * columns added to the worksheet table while the adapter controls what the UI
 * receives.
 */
export async function getArchiveEntries() {
  try {
    const rows = await getCachedPublicArchiveRows();
    const entries = sortArchiveEntries(mapSupabaseEntries(rows, {
      resolveThumbnail: resolveArchiveThumbnail,
    }));

    return {
      entries,
      status: entries.length > 0 ? "ready" : "empty",
    };
  } catch {
    // Do not expose connection details or provider errors to the browser.
    console.error("[archive] Supabase entries query could not be completed.");
    return { entries: [], status: "error" };
  }
}

/** Load one public record for the archive detail route, including contributed rows. */
export async function getPublicArchiveEntryBySlug(slug) {
  if (typeof slug !== "string" || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(slug)) {
    return null;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ARCHIVE_QUERY_TIMEOUT_MS);

  try {
    const { data, error } = await getPublicClient()
      .from("entries")
      .select("*")
      .eq("slug", slug)
      .maybeSingle()
      .abortSignal(controller.signal);

    if (error) {
      throw error;
    }

    const entry = data
      ? mapSupabaseEntry(data, { resolveThumbnail: resolveArchiveThumbnail })
      : null;

    return entry
      ? { ...entry, ownerId: typeof data.owner === "string" ? data.owner : null }
      : null;
  } finally {
    clearTimeout(timeout);
  }
}
