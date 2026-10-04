"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath, revalidateTag } from "next/cache";
import {
  CONTRIBUTION_FIELDS,
  validateContributionFields,
} from "../../lib/contribution-validation.mjs";
import { createClient } from "../../lib/supabase/server.js";
import { deleteOwnedContributionEntry } from "../../lib/supabase/delete-contribution-entry.mjs";
import {
  removeOwnedContributionPhotoIfUnused,
  removeUnreferencedContributionPhoto,
  verifyContributionPhoto,
} from "../../lib/supabase/contribution-photo-storage.mjs";

const GENERIC_SAVE_ERROR = "The entry could not be saved. Please try again.";
const GENERIC_UPDATE_ERROR = "That change wasn't saved.";
const SESSION_ERROR = "Your session has expired. Please log in and try again.";
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;
const ARCHIVE_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/u;

function getTextField(formData, name) {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

function getTextFields(formData) {
  return Object.fromEntries(
    CONTRIBUTION_FIELDS.map((field) => [field, getTextField(formData, field)]),
  );
}

async function getAuthenticatedUser(supabase) {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) {
      console.error("[archive-entry] Could not validate the current session.", error);
    }
    return user ?? null;
  } catch (error) {
    console.error("[archive-entry] Could not validate the current session.", error);
    return null;
  }
}

async function getActionClient(operation) {
  try {
    return await createClient();
  } catch (error) {
    console.error(`[archive-entry] Could not initialize the ${operation} client.`, error);
    return null;
  }
}

async function getActionContext(operation, failureMessage) {
  const supabase = await getActionClient(operation);
  if (!supabase) {
    return { ok: false, message: failureMessage };
  }

  const user = await getAuthenticatedUser(supabase);
  if (!user) {
    return { ok: false, message: SESSION_ERROR };
  }

  return { ok: true, supabase, user };
}

function revalidateArchive(slug) {
  try {
    revalidateTag("public-archive-entries");
    revalidatePath("/", "page");
    revalidatePath("/search", "page");
    if (typeof slug === "string" && ARCHIVE_SLUG_PATTERN.test(slug)) {
      revalidatePath(`/archive/${slug}`, "page");
    }
  } catch (error) {
    console.error("[archive-entry] Saved entry cache could not be refreshed.", error);
  }
}

function makeSlug(title) {
  const base = title
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/gu, "-")
    .replace(/^-+|-+$/gu, "")
    .slice(0, 48)
    .replace(/-+$/gu, "");

  return `${base || "archive-entry"}-${randomUUID()}`;
}

export async function createArchiveEntry(formData) {
  const { values, errors: fieldErrors } = validateContributionFields(getTextFields(formData));
  if (Object.keys(fieldErrors).length) {
    return { ok: false, fieldErrors, message: "Please fix the highlighted fields." };
  }

  const context = await getActionContext("create", GENERIC_SAVE_ERROR);
  if (!context.ok) return context;
  const { supabase, user } = context;

  const storagePath = formData.get("storagePath");
  let insertMayHaveSucceeded = false;

  try {
    const photo = await verifyContributionPhoto(supabase, storagePath, user.id);
    if (!photo.ok) {
      return photo;
    }

    const entry = {
      owner: user.id,
      slug: makeSlug(values.title_en),
      title_en: values.title_en,
      title_kh: values.title_kh,
      summary: values.summary || null,
      // The database trigger copies the authenticated account email into the
      // public author field; never accept it from form data.
      thumbnail_path: photo.publicUrl,
      description: values.description,
      ...(values.period_label ? { period_label: values.period_label } : {}),
      ...(values.location ? { location: values.location } : {}),
    };

    insertMayHaveSucceeded = true;
    const { data, error } = await supabase
      .from("entries")
      .insert(entry)
      .select("slug")
      .single();

    if (error) {
      insertMayHaveSucceeded = false;
      console.error("[archive-entry] Entry insert failed.", error);
      await removeUnreferencedContributionPhoto(supabase, storagePath);
      return { ok: false, message: GENERIC_SAVE_ERROR };
    }

    if (!data?.slug) {
      insertMayHaveSucceeded = false;
      console.error("[archive-entry] Supabase returned no inserted entry.");
      await removeUnreferencedContributionPhoto(supabase, storagePath);
      return { ok: false, message: GENERIC_SAVE_ERROR };
    }

    revalidateArchive(data.slug);
    return { ok: true, slug: data.slug };
  } catch (error) {
    console.error("[archive-entry] Entry creation failed.", error);
    if (!insertMayHaveSucceeded) {
      await removeUnreferencedContributionPhoto(supabase, storagePath);
    }
    return { ok: false, message: GENERIC_SAVE_ERROR };
  }
}

export async function updateArchiveEntry(formData) {
  const { values, errors: fieldErrors } = validateContributionFields(getTextFields(formData));
  if (Object.keys(fieldErrors).length) {
    return { ok: false, fieldErrors, message: "Please fix the highlighted fields." };
  }

  const entryId = getTextField(formData, "entryId");
  if (!UUID_PATTERN.test(entryId)) {
    return { ok: false, message: GENERIC_UPDATE_ERROR };
  }

  const context = await getActionContext("update", GENERIC_UPDATE_ERROR);
  if (!context.ok) return context;
  const { supabase, user } = context;

  const rawStoragePath = formData.get("storagePath");
  if (rawStoragePath !== null && typeof rawStoragePath !== "string") {
    return { ok: false, fieldErrors: { photo: "Please choose a valid photograph." } };
  }

  const storagePath = typeof rawStoragePath === "string" ? rawStoragePath.trim() : "";
  let photo = null;
  if (storagePath) {
    photo = await verifyContributionPhoto(supabase, storagePath, user.id);
    if (!photo.ok) {
      return photo;
    }
  }

  let previousPhotoUrl = null;
  if (photo) {
    try {
      const { data, error } = await supabase
        .from("entries")
        .select("thumbnail_path")
        .eq("id", entryId)
        .eq("owner", user.id)
        .maybeSingle();

      if (error || !data) {
        if (error) {
          console.error("[archive-entry] Could not read the previous photograph.", error);
        }
        await removeUnreferencedContributionPhoto(supabase, storagePath);
        return { ok: false, message: GENERIC_UPDATE_ERROR };
      }
      previousPhotoUrl = data.thumbnail_path ?? null;
    } catch (error) {
      console.error("[archive-entry] Could not read the previous photograph.", error);
      await removeUnreferencedContributionPhoto(supabase, storagePath);
      return { ok: false, message: GENERIC_UPDATE_ERROR };
    }
  }

  const updates = {
    title_en: values.title_en,
    title_kh: values.title_kh,
    summary: values.summary || null,
    description: values.description,
    period_label: values.period_label || null,
    location: values.location || null,
    ...(photo ? { thumbnail_path: photo.publicUrl } : {}),
  };

  let updateMayHaveSucceeded = false;
  try {
    updateMayHaveSucceeded = true;
    const { data, error } = await supabase
      .from("entries")
      .update(updates)
      .eq("id", entryId)
      .eq("owner", user.id)
      .select("id, slug")
      .maybeSingle();

    if (error) {
      updateMayHaveSucceeded = false;
      console.error("[archive-entry] Entry update failed.", error);
      if (storagePath) await removeUnreferencedContributionPhoto(supabase, storagePath);
      return { ok: false, message: GENERIC_UPDATE_ERROR };
    }

    if (!data) {
      updateMayHaveSucceeded = false;
      console.error("[archive-entry] Supabase returned no updated row; RLS may have refused the update.");
      if (storagePath) await removeUnreferencedContributionPhoto(supabase, storagePath);
      return { ok: false, message: GENERIC_UPDATE_ERROR };
    }

    revalidateArchive(data.slug);
    if (previousPhotoUrl && previousPhotoUrl !== photo?.publicUrl) {
      await removeOwnedContributionPhotoIfUnused(supabase, previousPhotoUrl, user.id);
    }
    return { ok: true, slug: data.slug };
  } catch (error) {
    console.error("[archive-entry] Entry update failed.", error);
    if (!updateMayHaveSucceeded && storagePath) {
      await removeUnreferencedContributionPhoto(supabase, storagePath);
    }
    return { ok: false, message: GENERIC_UPDATE_ERROR };
  }
}

export async function deleteArchiveEntry(entryId) {
  if (typeof entryId !== "string" || !UUID_PATTERN.test(entryId)) {
    return { ok: false, message: GENERIC_UPDATE_ERROR };
  }

  const context = await getActionContext("delete", GENERIC_UPDATE_ERROR);
  if (!context.ok) return context;

  try {
    const result = await deleteOwnedContributionEntry(context.supabase, entryId, context.user.id);
    if (!result.ok) {
      return { ok: false, message: GENERIC_UPDATE_ERROR };
    }

    revalidateArchive(result.slug);
    return { ok: true };
  } catch (error) {
    console.error("[archive-entry] Entry deletion failed.", error);
    return { ok: false, message: GENERIC_UPDATE_ERROR };
  }
}
