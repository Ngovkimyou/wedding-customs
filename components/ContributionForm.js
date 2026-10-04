"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createArchiveEntry } from "../app/contribute/actions.js";
import { createClient } from "../lib/supabase/client.js";
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
  description: "",
  period_label: "",
  location: "",
};

const FIELD_LABELS = {
  title_en: "English title",
  title_kh: "Khmer title",
  description: "Description",
  period_label: "Period",
  location: "Location",
  photo: "Photograph",
};

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
  const firstField = ["title_en", "title_kh", "photo", "description", "period_label", "location"]
    .find((field) => errors[field]);
  if (firstField) {
    document.getElementById(`contribute-${firstField}`)?.focus();
  }
}

export default function ContributionForm() {
  const router = useRouter();
  const photoInputRef = useRef(null);
  const submittingRef = useRef(false);
  const [fields, setFields] = useState(INITIAL_FIELDS);
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

    if (!selectedPhoto) {
      nextErrors.photo = "Choose a photograph to upload.";
    } else if (selectedPhoto.size <= 0 || selectedPhoto.size > CONTRIBUTION_LIMITS.photoMaxBytes) {
      nextErrors.photo = "Choose an image that is no larger than 5 MB.";
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
      const photoHeader = new Uint8Array(await selectedPhoto.slice(0, 12).arrayBuffer());
      const photoFormat = detectSupportedPhoto(photoHeader);

      if (!photoFormat) {
        setErrors({ photo: "Use a valid JPEG, PNG, or WebP image." });
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

      const storagePath = `${user.id}/${createPhotoId()}.${photoFormat.extension}`;
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

      const formData = new FormData();
      Object.entries(validation.values).forEach(([field, value]) => formData.set(field, value));
      formData.set("storagePath", storagePath);

      const result = await createArchiveEntry(formData);
      if (!result?.ok) {
        if (result?.fieldErrors) {
          setErrors(result.fieldErrors);
          focusFirstInvalid(result.fieldErrors);
        }
        setMessage(result?.message || "The entry could not be saved. Please try again.");
        return;
      }

      router.push(`/archive/${encodeURIComponent(result.slug)}`);
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
        <span>{FIELD_LABELS.title_en}<span className="contribute-required">Required</span></span>
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
        <span>{FIELD_LABELS.title_kh}<span className="contribute-required">Required</span></span>
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

      <label className="contribute-field" htmlFor="contribute-description">
        <span>{FIELD_LABELS.description}<span className="contribute-required">Required</span></span>
        <textarea
          {...getFieldProps("description")}
          rows={7}
          maxLength={CONTRIBUTION_LIMITS.descriptionMax}
          minLength={CONTRIBUTION_LIMITS.descriptionMin}
          placeholder="Write the story or tradition you want to preserve."
          required
        />
        <span className="contribute-field__hint">{Array.from(fields.description).length}/{CONTRIBUTION_LIMITS.descriptionMax} characters</span>
        {errors.description ? <small className="contribute-field__error" id="contribute-description-error">{errors.description}</small> : null}
      </label>

      <div className="contribute-form__row">
        <label className="contribute-field" htmlFor="contribute-period_label">
          <span>{FIELD_LABELS.period}<span className="contribute-optional">Optional</span></span>
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
          <span>{FIELD_LABELS.location}<span className="contribute-optional">Optional</span></span>
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
        <span>{FIELD_LABELS.photo}<span className="contribute-required">Required</span></span>
        <input
          ref={photoInputRef}
          id="contribute-photo"
          name="photo"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          disabled={isSubmitting}
          aria-invalid={Boolean(errors.photo)}
          aria-describedby={errors.photo ? "contribute-photo-error" : "contribute-photo-hint"}
          onChange={updatePhoto}
          required
        />
        <span className="contribute-field__hint" id="contribute-photo-hint">
          JPEG, PNG, or WebP · 5 MB maximum. Photos are publicly viewable with the archive entry.
        </span>
        {errors.photo ? <small className="contribute-field__error" id="contribute-photo-error">{errors.photo}</small> : null}
      </label>

      <div className="contribute-form__status" aria-live="polite">
        {message ? <p role="alert">{message}</p> : null}
      </div>

      <button className="contribute-submit" type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Uploading and saving…" : "Add to the archive"}
      </button>
    </form>
  );
}
