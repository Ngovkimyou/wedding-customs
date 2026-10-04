"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath, revalidateTag } from "next/cache";
import {
  CONTRIBUTION_LIMITS,
  CONTRIBUTION_FIELDS,
  detectSupportedPhoto,
  validateContributionFields,
} from "../../lib/contribution-validation.mjs";
import { createClient } from "../../lib/supabase/server.js";

const PHOTO_BUCKET = "photos";
const GENERIC_SAVE_ERROR = "The entry could not be saved. Please try again.";
const UUID_FILENAME_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.(?:jpg|png|webp)$/iu;

function getTextFields(formData) {
  return Object.fromEntries(
    CONTRIBUTION_FIELDS.map((field) => {
      const value = formData.get(field);
      return [field, typeof value === "string" ? value : ""];
    }),
  );
}

function getUserPhotoFilename(storagePath, userId) {
  if (typeof storagePath !== "string") {
    return null;
  }

  const separator = storagePath.indexOf("/");
  if (separator < 0 || storagePath.slice(0, separator) !== userId) {
    return null;
  }

  const filename = storagePath.slice(separator + 1);
  if (filename.includes("/") || !UUID_FILENAME_PATTERN.test(filename)) {
    return null;
  }

  return filename;
}

async function removeUploadedPhoto(supabase, storagePath) {
  const { error } = await supabase.storage.from(PHOTO_BUCKET).remove([storagePath]);
  if (error) {
    console.error("[contribute] Could not remove an unreferenced uploaded photo.", error);
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

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError) {
    console.error("[contribute] Could not validate the contributor session.", authError);
  }
  if (!user) {
    return { ok: false, message: "Your session has expired. Please log in and try again." };
  }

  const storagePath = formData.get("storagePath");
  const filename = getUserPhotoFilename(storagePath, user.id);
  if (!filename) {
    return { ok: false, fieldErrors: { photo: "Please choose and upload a valid photograph." } };
  }

  let mayHaveInserted = false;

  try {
    const { data: photoBlob, error: downloadError } = await supabase.storage
      .from(PHOTO_BUCKET)
      .download(storagePath);

    if (downloadError) {
      console.error("[contribute] Uploaded photo could not be verified.", downloadError);
      await removeUploadedPhoto(supabase, storagePath);
      return { ok: false, fieldErrors: { photo: "The uploaded photo could not be verified. Please upload it again." } };
    }

    if (!photoBlob || photoBlob.size <= 0 || photoBlob.size > CONTRIBUTION_LIMITS.photoMaxBytes) {
      await removeUploadedPhoto(supabase, storagePath);
      return { ok: false, fieldErrors: { photo: "Choose an image that is no larger than 5 MB." } };
    }

    const signature = new Uint8Array(await photoBlob.slice(0, 12).arrayBuffer());
    const photoFormat = detectSupportedPhoto(signature);
    const extension = filename.split(".").at(-1)?.toLowerCase();

    if (!photoFormat || photoFormat.extension !== extension) {
      await removeUploadedPhoto(supabase, storagePath);
      return { ok: false, fieldErrors: { photo: "Use a valid JPEG, PNG, or WebP image." } };
    }

    const { data: { publicUrl } } = supabase.storage.from(PHOTO_BUCKET).getPublicUrl(storagePath);
    const entry = {
      owner: user.id,
      slug: makeSlug(values.title_en),
      title_en: values.title_en,
      title_kh: values.title_kh,
      thumbnail_path: publicUrl,
      description: values.description,
      ...(values.period_label ? { period_label: values.period_label } : {}),
      ...(values.location ? { location: values.location } : {}),
    };

    mayHaveInserted = true;
    const { data, error: insertError } = await supabase
      .from("entries")
      .insert(entry)
      .select("slug")
      .single();

    if (insertError) {
      mayHaveInserted = false;
      console.error("[contribute] Entry insert failed.", insertError);
      await removeUploadedPhoto(supabase, storagePath);
      return { ok: false, message: GENERIC_SAVE_ERROR };
    }

    try {
      revalidateTag("public-archive-entries");
      revalidatePath("/", "page");
      revalidatePath("/search", "page");
      revalidatePath(`/archive/${data.slug}`, "page");
    } catch (revalidationError) {
      console.error("[contribute] Saved entry cache could not be refreshed.", revalidationError);
    }

    return { ok: true, slug: data.slug };
  } catch (error) {
    console.error("[contribute] Submission failed.", error);
    if (!mayHaveInserted) {
      await removeUploadedPhoto(supabase, storagePath);
    }
    return { ok: false, message: GENERIC_SAVE_ERROR };
  }
}
