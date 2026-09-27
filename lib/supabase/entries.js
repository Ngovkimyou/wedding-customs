import { mapSupabaseEntries } from "../archive-entry-mapper.mjs";
import { sortArchiveEntries } from "../archive-entry-order.mjs";
import { resolveArchiveThumbnail } from "../archive-thumbnail-assets.js";
import { createClient } from "./server.js";

/**
 * The order is part of the page contract: the newest record is shown first.
 * `select("*")` keeps this helper forward-compatible with harmless metadata
 * columns added to the worksheet table while the adapter controls what the UI
 * receives.
 */
export async function getArchiveEntries() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("entries")
      .select("*")
      .order("created_at", { ascending: false })
      .order("slug", { ascending: true });

    if (error) {
      console.error("[archive] Supabase entries query failed.");
      return { entries: [], status: "error" };
    }

    const entries = sortArchiveEntries(mapSupabaseEntries(data, {
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
