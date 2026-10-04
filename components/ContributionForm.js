"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createArchiveEntry, updateArchiveEntry } from "../app/contribute/actions.js";
import { createClient } from "../lib/supabase/client.js";
import { countCodePoints } from "../lib/security.mjs";
import {
  CAMBODIAN_PROVINCES,
  CONTRIBUTION_LIMITS,
  detectSupportedPhoto,
  normalizeContributionFields,
  validateContributionFields,
} from "../lib/contribution-validation.mjs";

const INITIAL_FIELDS = {
  title_en: "",
  title_kh: "",
  summary: "",
  description: "",
  period_label: "",
  location: "",
};

const FIELD_LABELS = {
  title_en: "English title",
  title_kh: "Khmer title",
  summary: "Summary",
  description: "Description",
  period_label: "Period",
  location: "Location",
  photo: "Photograph",
};

function FieldLabel({ children, required = false }) {
  return (
    <span className="contribute-field__label">
      <span className="contribute-field__label-text">
        {children}
        {required ? <span className="contribute-required" aria-hidden="true">*</span> : null}
      </span>
      {!required ? <span className="contribute-optional">Optional</span> : null}
    </span>
  );
}

function createPhotoId() {
  if (window.crypto?.randomUUID) {
    return window.crypto.randomUUID();
  }

  const bytes = new Uint8Array(16);
  window.crypto.getRandomValues(bytes);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function focusFirstInvalid(errors) {
  const firstField = [
    "title_en", "title_kh", "summary", "description", "period_label", "location", "photo",
  ]
    .find((field) => errors[field]);
  if (firstField) {
    document.getElementById(`contribute-${firstField}`)?.focus();
  }
}

export default function ContributionForm({
  mode = "create",
  entryId,
  entrySlug,
  initialValues,
  existingThumbnailUrl = null,
}) {
  const isEditing = mode === "edit";
  const router = useRouter();
  const photoInputRef = useRef(null);
  const submittingRef = useRef(false);
  const [fields, setFields] = useState(() => ({ ...INITIAL_FIELDS, ...initialValues }));
  const [photo, setPhoto] = useState(null);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateField = (event) => {
    const { name, value } = event.currentTarget;
    setFields((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: "" }));
    setMessage("");
  };

  const updatePhoto = (event) => {
    setPhoto(event.currentTarget.files?.[0] ?? null);
    setErrors((current) => ({ ...current, photo: "" }));
    setMessage("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submittingRef.current) return;

    setMessage("");
    const normalizedFields = normalizeContributionFields(fields);
    setFields(normalizedFields);
    const validation = validateContributionFields(normalizedFields);
    const nextErrors = { ...validation.errors };
    const selectedPhoto = photoInputRef.current?.files?.[0] ?? photo;

    if (!selectedPhoto && !isEditing) {
      nextErrors.photo = "Choose a photograph to upload.";
    } else if (selectedPhoto && (
      selectedPhoto.size <= 0 || selectedPhoto.size > CONTRIBUTION_LIMITS.photoMaxBytes
    )) {
      nextErrors.photo = "Choose an image that is no larger than 10 MB.";
    }

    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      focusFirstInvalid(nextErrors);
      return;
    }

    submittingRef.current = true;
    setIsSubmitting(true);
    setErrors({});

    try {
      let storagePath = "";
      if (selectedPhoto) {
        const photoHeader = new Uint8Array(await selectedPhoto.slice(0, 64).arrayBuffer());
        const photoFormat = detectSupportedPhoto(photoHeader);
        const declaredMimeType = selectedPhoto.type.toLowerCase();
        const isMimeTypeCompatible = !declaredMimeType
          || declaredMimeType === photoFormat?.mimeType
          || (photoFormat?.extension === "jpg" && declaredMimeType === "image/jpg");

        if (!photoFormat || !isMimeTypeCompatible) {
          setErrors({ photo: "Use a JPEG, PNG, WebP, or AVIF photo with a matching file type." });
          photoInputRef.current?.focus();
          return;
        }

        const supabase = createClient();
        const { data: { user }, error: sessionError } = await supabase.auth.getUser();
        if (sessionError) {
          console.error("[contribute] Could not verify the contributor session.", sessionError);
        }
        if (!user) {
          setMessage("Your session has expired. Please log in and try again.");
          return;
        }

        storagePath = `${user.id}/${createPhotoId()}.${photoFormat.extension}`;
        const { error: uploadError } = await supabase.storage.from("photos").upload(
          storagePath,
          selectedPhoto,
          { contentType: photoFormat.mimeType, upsert: false },
        );

        if (uploadError) {
          console.error("[contribute] Photo upload failed.", uploadError);
          setMessage("The photo could not be uploaded. Please try another image.");
          return;
        }
      }

      const formData = new FormData();
      Object.entries(validation.values).forEach(([field, value]) => formData.set(field, value));
      if (isEditing) {
        formData.set("entryId", entryId ?? "");
      }
      if (storagePath) {
        formData.set("storagePath", storagePath);
      }

      const result = isEditing
        ? await updateArchiveEntry(formData)
        : await createArchiveEntry(formData);
      if (!result?.ok) {
        if (result?.fieldErrors) {
          setErrors(result.fieldErrors);
          focusFirstInvalid(result.fieldErrors);
        }
        setMessage(result?.message || "The entry could not be saved. Please try again.");
        return;
      }

      const destination = `/archive/${encodeURIComponent(result.slug || entrySlug)}`;
      if (isEditing) {
        router.replace(destination);
      } else {
        router.push(destination);
      }
    } catch (error) {
      console.error("[contribute] Submission could not be completed.", error);
      setMessage("The entry could not be saved. Please check your connection and try again.");
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  const getFieldProps = (field) => ({
    id: `contribute-${field}`,
    name: field,
    value: fields[field],
    onChange: updateField,
    disabled: isSubmitting,
    "aria-invalid": Boolean(errors[field]),
    "aria-describedby": errors[field] ? `contribute-${field}-error` : undefined,
  });

  return (
    <form className="contribute-form" onSubmit={handleSubmit} noValidate aria-busy={isSubmitting}>
      <label className="contribute-field" htmlFor="contribute-title_en">
        <FieldLabel required>{FIELD_LABELS.title_en}</FieldLabel>
        <input
          {...getFieldProps("title_en")}
          type="text"
          autoComplete="off"
          maxLength={CONTRIBUTION_LIMITS.titleEnMax}
          minLength={CONTRIBUTION_LIMITS.titleEnMin}
          placeholder="A short English title"
          required
        />
        {errors.title_en ? <small className="contribute-field__error" id="contribute-title_en-error">{errors.title_en}</small> : null}
      </label>

      <label className="contribute-field" htmlFor="contribute-title_kh">
        <FieldLabel required>{FIELD_LABELS.title_kh}</FieldLabel>
        <input
          {...getFieldProps("title_kh")}
          type="text"
          lang="km"
          maxLength={CONTRIBUTION_LIMITS.titleKhMax}
          placeholder="Enter the title in Khmer"
          required
        />
        {errors.title_kh ? <small className="contribute-field__error" id="contribute-title_kh-error">{errors.title_kh}</small> : null}
      </label>

      <label className="contribute-field" htmlFor="contribute-summary">
        <FieldLabel>{FIELD_LABELS.summary}</FieldLabel>
        <input
          {...getFieldProps("summary")}
          type="text"
          maxLength={CONTRIBUTION_LIMITS.summaryMax}
          placeholder="A short preview of the story"
        />
        <span className="contribute-field__hint">
          {countCodePoints(fields.summary)}/{CONTRIBUTION_LIMITS.summaryMax} characters
        </span>
        {errors.summary ? <small className="contribute-field__error" id="contribute-summary-error">{errors.summary}</small> : null}
      </label>

      <label className="contribute-field" htmlFor="contribute-description">
        <FieldLabel required>{FIELD_LABELS.description}</FieldLabel>
        <textarea
          {...getFieldProps("description")}
          rows={7}
          maxLength={CONTRIBUTION_LIMITS.descriptionMax}
          minLength={CONTRIBUTION_LIMITS.descriptionMin}
          placeholder="Write the story or tradition you want to preserve."
          required
        />
        <span className="contribute-field__hint">{countCodePoints(fields.description)}/{CONTRIBUTION_LIMITS.descriptionMax} characters</span>
        {errors.description ? <small className="contribute-field__error" id="contribute-description-error">{errors.description}</small> : null}
      </label>

      <div className="contribute-form__row">
        <label className="contribute-field" htmlFor="contribute-period_label">
          <FieldLabel>{FIELD_LABELS.period_label}</FieldLabel>
          <input
            {...getFieldProps("period_label")}
            type="text"
            inputMode="text"
            maxLength={CONTRIBUTION_LIMITS.periodMax}
            placeholder="2003 or DD/MM/YY"
          />
          {errors.period_label ? <small className="contribute-field__error" id="contribute-period_label-error">{errors.period_label}</small> : null}
        </label>

        <label className="contribute-field" htmlFor="contribute-location">
          <FieldLabel>{FIELD_LABELS.location}</FieldLabel>
          <input
            {...getFieldProps("location")}
            type="text"
            maxLength={CONTRIBUTION_LIMITS.locationMax}
            list="cambodian-provinces"
            autoComplete="address-level1"
            placeholder="Choose or enter a location"
          />
          <datalist id="cambodian-provinces">
            {CAMBODIAN_PROVINCES.map((province) => <option value={province} key={province} />)}
          </datalist>
          {errors.location ? <small className="contribute-field__error" id="contribute-location-error">{errors.location}</small> : null}
        </label>

      </div>

      <label className="contribute-field contribute-field--photo" htmlFor="contribute-photo">
        <FieldLabel required={!isEditing}>
          {isEditing ? "Replace photograph" : FIELD_LABELS.photo}
        </FieldLabel>
        {isEditing && existingThumbnailUrl ? (
          <figure className="contribute-current-photo">
            <Image
              src={existingThumbnailUrl}
              alt={`Current photograph for ${fields.title_en}`}
              width={800}
              height={560}
              unoptimized
            />
            <figcaption>Current photograph. Choose a new file only if you want to replace it.</figcaption>
          </figure>
        ) : null}
        <input
          ref={photoInputRef}
          id="contribute-photo"
          name="photo"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          disabled={isSubmitting}
          aria-invalid={Boolean(errors.photo)}
          aria-describedby={errors.photo
            ? "contribute-photo-error"
            : isEditing ? "contribute-photo-hint" : undefined}
          onChange={updatePhoto}
          required={!isEditing}
        />
        {isEditing ? (
          <span className="contribute-field__hint" id="contribute-photo-hint">
            Choose a JPEG, PNG, WebP, or AVIF photo up to 10 MB. Leave this empty to keep the current photograph.
          </span>
        ) : null}
        {errors.photo ? <small className="contribute-field__error" id="contribute-photo-error">{errors.photo}</small> : null}
      </label>

      <div className="contribute-form__status" aria-live="polite">
        {message ? <p role="alert">{message}</p> : null}
      </div>

      <button className="contribute-submit" type="submit" disabled={isSubmitting}>
        {isSubmitting
          ? (isEditing ? "Saving changes…" : "Uploading and saving…")
          : (isEditing ? "Save changes" : "Add to the archive")}
      </button>
    </form>
  );
}
