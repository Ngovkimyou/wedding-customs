"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { createClient } from "../../lib/supabase/server.js";

const ENTRY_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;
const REVIEW_DECISIONS = new Set(["published", "returned"]);

export async function decideReviewEntry(entryId, decision) {
  if (
    typeof entryId !== "string"
    || !ENTRY_ID_PATTERN.test(entryId)
    || !REVIEW_DECISIONS.has(decision)
  ) {
    return { ok: false };
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("review_entry", {
      entry_id: entryId,
      decision,
    });

    if (error) {
      console.error("[review] The review decision could not be saved.", error);
      return { ok: false };
    }

    if (data !== true) {
      return { ok: false };
    }

    try {
      revalidatePath("/review", "page");
      revalidatePath("/my-entries", "page");
      revalidateTag("public-archive-entries");
      revalidatePath("/", "page");
      revalidatePath("/search", "page");
    } catch (error) {
      console.error("[review] The decision was saved but cached pages could not be refreshed.", error);
    }

    return { ok: true };
  } catch (error) {
    console.error("[review] The review request could not be completed.", error);
    return { ok: false };
  }
}
