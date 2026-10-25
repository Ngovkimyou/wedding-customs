"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import ScrollIndicator from "./ScrollIndicator.js";
import { createArchiveEntry, updateArchiveEntry } from "../app/contribute/actions.js";
import { createClient } from "../lib/supabase/client.js";
import { countCodePoints } from "../lib/security.mjs";
import {
  CAMBODIAN_PROVINCES,
  CONTRIBUTION_LIMITS,
  detectSupportedPhoto,
  isValidPeriodForMode,
  normalizePeriodLabel,
  normalizeContributionFields,
  padPeriodDatePart,
  parsePeriodDateParts,
  sanitizePeriodDatePart,
  sanitizePeriodYear,
  serializePeriodDateParts,
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

const KEYBOARD_NAVIGATION_FIELD_SELECTOR = "[data-contribution-keyboard-field]";

function focusAdjacentContributionField(form, field, direction, focusSubmitAtEnd = false) {
  const fields = Array.from(form.querySelectorAll(KEYBOARD_NAVIGATION_FIELD_SELECTOR))
    .filter((candidate) => !candidate.disabled && candidate.type !== "radio");
  const currentIndex = fields.indexOf(field);
  if (currentIndex < 0) return;

  const nextField = fields[currentIndex + direction];
  if (nextField) {
    nextField.focus();
  } else if (focusSubmitAtEnd && direction > 0) {
    form.querySelector(".contribute-submit:not(:disabled)")?.focus();
  }
}

function focusPeriodInput(form) {
  form.querySelector("[data-contribution-period-input]:not(:disabled)")?.focus();
}

function focusPeriodMode(form, mode) {
  form.querySelector(`input[name="period-mode"][value="${mode}"]:not(:disabled)`)?.focus();
}

function focusSelectedPeriodMode(form) {
  form.querySelector('input[name="period-mode"]:checked:not(:disabled)')?.focus();
}

function isCaretAtTextAreaEnd(textarea) {
  return textarea.selectionStart === textarea.value.length
    && textarea.selectionEnd === textarea.value.length;
}

function FieldLabel({ children, required = false }) {
  return (
    <span className="contribute-field__label">
      <span className="contribute-field__label-text">
        {children}
        {required ? <span className="contribute-required" aria-hidden="true">*</span> : null}
        {!required ? <span className="contribute-optional">(Optional)</span> : null}
      </span>
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
  initialValues,
  existingThumbnailUrl = null,
}) {
  const isEditing = mode === "edit";
  const initialPeriodValue = normalizePeriodLabel(initialValues?.period_label);
  const router = useRouter();
  const titleEnRef = useRef(null);
  const descriptionRef = useRef(null);
  const photoInputRef = useRef(null);
  const periodMonthRef = useRef(null);
  const periodYearRef = useRef(null);
  const submittingRef = useRef(false);
  const pendingListEnterRef = useRef(null);
  const [fields, setFields] = useState(() => ({
    ...INITIAL_FIELDS,
    ...initialValues,
    period_label: initialPeriodValue,
  }));
  const [periodMode, setPeriodMode] = useState(() => (
    /^\d{4}$/u.test(initialPeriodValue)
      ? "year"
      : initialPeriodValue
        ? "date"
        : "year"
  ));
  const [periodYear, setPeriodYear] = useState(() => (
    /^\d{4}$/u.test(initialPeriodValue) ? initialPeriodValue : ""
  ));
  const [periodDateParts, setPeriodDateParts] = useState(
    () => parsePeriodDateParts(initialPeriodValue),
  );
  const [photo, setPhoto] = useState(null);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    titleEnRef.current?.focus({ preventScroll: true });
  }, []);

  const updateField = (event) => {
    const { name, value } = event.currentTarget;
    setFields((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: "" }));
    setMessage("");
    setSuccessMessage("");
  };

  const updatePeriodValue = (value) => {
    setFields((current) => ({ ...current, period_label: value }));
    setErrors((current) => ({ ...current, period_label: "" }));
    setMessage("");
    setSuccessMessage("");
  };

  const updatePeriodYear = (event) => {
    const value = sanitizePeriodYear(event.currentTarget.value);
    setPeriodYear(value);
    updatePeriodValue(value);
  };

  const updatePeriodDatePart = (part, event) => {
    const value = sanitizePeriodDatePart(event.currentTarget.value, part === "year" ? 4 : 2);
    const nextParts = { ...periodDateParts, [part]: value };
    setPeriodDateParts(nextParts);
    updatePeriodValue(serializePeriodDateParts(nextParts));

    if (value.length === 2 && part === "day") {
      periodMonthRef.current?.focus();
    } else if (value.length === 2 && part === "month") {
      periodYearRef.current?.focus();
    }
  };

  const padPeriodDateInput = (part, event) => {
    const value = event.currentTarget.value;
    if (value.length !== 1 || (part !== "day" && part !== "month")) return;

    const nextParts = {
      ...periodDateParts,
      [part]: padPeriodDatePart(value),
    };
    setPeriodDateParts(nextParts);
    updatePeriodValue(serializePeriodDateParts(nextParts));
  };

  const pastePeriodDate = (event) => {
    const nextParts = parsePeriodDateParts(event.clipboardData.getData("text"));
    if (!nextParts.day) return;

    event.preventDefault();
    setPeriodDateParts(nextParts);
    updatePeriodValue(serializePeriodDateParts(nextParts));
    periodYearRef.current?.focus();
  };

  const selectPeriodMode = (nextMode) => {
    setPeriodMode(nextMode);
    updatePeriodValue(
      nextMode === "year" ? periodYear : serializePeriodDateParts(periodDateParts),
    );
  };

  const updatePhoto = (event) => {
    setPhoto(event.currentTarget.files?.[0] ?? null);
    setErrors((current) => ({ ...current, photo: "" }));
    setMessage("");
    setSuccessMessage("");
  };

  const handleKeyboardNavigation = (event) => {
    const field = event.target;
    const form = event.currentTarget;
    if (!field.matches?.(KEYBOARD_NAVIGATION_FIELD_SELECTOR)) return;
    // Do not steal Enter or arrow keys while an IME is composing Khmer text.
    if (event.isComposing || event.keyCode === 229) return;

    if (event.key === "Escape") {
      event.preventDefault();
      field.blur();
      return;
    }

    if (field.tagName === "BUTTON") {
      if (event.key === "ArrowUp") {
        event.preventDefault();
        focusAdjacentContributionField(form, field, -1);
      } else if (event.key === "ArrowDown") {
        event.preventDefault();
      }
      return;
    }

    if (field.type === "radio" && field.name === "period-mode") {
      if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        event.preventDefault();
        const radios = Array.from(form.querySelectorAll('input[name="period-mode"]:not(:disabled)'));
        const currentIndex = radios.indexOf(field);
        if (radios.length && currentIndex >= 0) {
          const direction = event.key === "ArrowRight" ? 1 : -1;
          const nextIndex = (currentIndex + direction + radios.length) % radios.length;
          radios[nextIndex].click();
          radios[nextIndex].focus();
        }
      } else if (event.key === "ArrowDown" || event.key === "Enter") {
        event.preventDefault();
        focusPeriodInput(form);
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        form.querySelector("#contribute-description")?.focus();
      }
      return;
    }

    const isMultiline = field.tagName === "TEXTAREA";
    const hasNativeSuggestions = field.hasAttribute("list");
    if ((event.key === "ArrowDown" || event.key === "ArrowUp") && !isMultiline) {
      // Keep arrow keys in the form flow instead of moving through browser
      // autofill or datalist suggestion panels.
      event.preventDefault();
      if (field.hasAttribute("data-contribution-period-input") && event.key === "ArrowUp") {
        focusSelectedPeriodMode(form);
        return;
      }
      focusAdjacentContributionField(
        form,
        field,
        event.key === "ArrowDown" ? 1 : -1,
        event.key === "ArrowDown",
      );
      return;
    }

    if (isMultiline) {
      // Keep normal caret movement and paragraph breaks. At the end of the
      // story, Down moves into the period controls; Ctrl/Cmd+Enter also advances.
      if (event.key === "ArrowDown" && isCaretAtTextAreaEnd(field)) {
        event.preventDefault();
        focusPeriodMode(form, "year");
        return;
      }
      if (event.ctrlKey || event.metaKey) {
        if (event.key === "Enter") {
          event.preventDefault();
          focusPeriodMode(form, "year");
        }
      }
      return;
    }

    if (event.key !== "Enter") return;

    // Enter on a file input should open the native file picker.
    if (field.type === "file") return;

    if (hasNativeSuggestions) {
      // Let the browser accept a highlighted province first. If Enter also
      // causes implicit form submission, handleSubmit below turns it into
      // field navigation instead of saving the form prematurely.
      const pendingEnter = { field };
      pendingListEnterRef.current = pendingEnter;
      window.setTimeout(() => {
        if (pendingListEnterRef.current !== pendingEnter) return;
        pendingListEnterRef.current = null;
        focusAdjacentContributionField(form, field, 1, true);
      }, 0);
      return;
    }

    event.preventDefault();
    focusAdjacentContributionField(form, field, 1, true);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (pendingListEnterRef.current) {
      const { field } = pendingListEnterRef.current;
      pendingListEnterRef.current = null;
      focusAdjacentContributionField(event.currentTarget, field, 1, true);
      return;
    }
    if (submittingRef.current) return;

    setMessage("");
    setSuccessMessage("");
    const normalizedFields = normalizeContributionFields(fields);
    setFields(normalizedFields);
    const validation = validateContributionFields(normalizedFields);
    const nextErrors = { ...validation.errors };
    const selectedPhoto = photoInputRef.current?.files?.[0] ?? photo;

    if (!isValidPeriodForMode(normalizedFields.period_label, periodMode)) {
      nextErrors.period_label = periodMode === "year"
        ? "Enter a four-digit year, such as 2003."
        : "Enter a valid calendar date as DD/MM/YYYY, such as 15/08/2026.";
    }

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

      if (isEditing) {
        router.replace("/my-entries");
      } else {
        setFields({ ...INITIAL_FIELDS });
        setPeriodMode("year");
        setPeriodYear("");
        setPeriodDateParts(parsePeriodDateParts(""));
        setPhoto(null);
        setErrors({});
        if (photoInputRef.current) {
          photoInputRef.current.value = "";
        }
        setSuccessMessage("Thank you for sharing your story. Your entry is waiting for review and will appear in the public archive if approved.");
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
    "data-contribution-keyboard-field": "true",
    "aria-invalid": Boolean(errors[field]),
    "aria-describedby": errors[field] ? `contribute-${field}-error` : undefined,
  });
  const titleEnAtLimit = fields.title_en.length >= CONTRIBUTION_LIMITS.titleEnMax;
  const titleKhAtLimit = fields.title_kh.length >= CONTRIBUTION_LIMITS.titleKhMax;
  const summaryAtLimit = fields.summary.length >= CONTRIBUTION_LIMITS.summaryMax;
  const descriptionAtLimit = fields.description.length >= CONTRIBUTION_LIMITS.descriptionMax;
  const locationAtLimit = fields.location.length >= CONTRIBUTION_LIMITS.locationMax;
  const getFieldDescriptionIds = (field, additionalId) => [
    errors[field] ? `contribute-${field}-error` : null,
    additionalId,
  ].filter(Boolean).join(" ") || undefined;

  return (
    <form
      className="contribute-form"
      onSubmit={handleSubmit}
      onKeyDown={handleKeyboardNavigation}
      noValidate
      aria-busy={isSubmitting}
    >
      <label className="contribute-field" htmlFor="contribute-title_en">
        <FieldLabel required>{FIELD_LABELS.title_en}</FieldLabel>
        <input
          {...getFieldProps("title_en")}
          ref={titleEnRef}
          className={titleEnAtLimit ? "contribute-field__input--limit-reached" : undefined}
          type="text"
          autoComplete="off"
          maxLength={CONTRIBUTION_LIMITS.titleEnMax}
          minLength={CONTRIBUTION_LIMITS.titleEnMin}
          placeholder="A short English title"
          required
          aria-describedby={getFieldDescriptionIds(
            "title_en",
            titleEnAtLimit ? "contribute-title_en-limit" : null,
          )}
        />
        {titleEnAtLimit ? (
          <small className="contribute-field__limit-reached" id="contribute-title_en-limit" role="status">
            Maximum of {CONTRIBUTION_LIMITS.titleEnMax} characters reached.
          </small>
        ) : null}
        {errors.title_en ? <small className="contribute-field__error" id="contribute-title_en-error">{errors.title_en}</small> : null}
      </label>

      <label className="contribute-field" htmlFor="contribute-title_kh">
        <FieldLabel required>{FIELD_LABELS.title_kh}</FieldLabel>
        <input
          {...getFieldProps("title_kh")}
          className={titleKhAtLimit ? "contribute-field__input--limit-reached" : undefined}
          type="text"
          lang="km"
          maxLength={CONTRIBUTION_LIMITS.titleKhMax}
          placeholder="Enter the title in Khmer"
          required
          aria-describedby={getFieldDescriptionIds(
            "title_kh",
            titleKhAtLimit ? "contribute-title_kh-limit" : null,
          )}
        />
        {titleKhAtLimit ? (
          <small className="contribute-field__limit-reached" id="contribute-title_kh-limit" role="status">
            Maximum of {CONTRIBUTION_LIMITS.titleKhMax} characters reached.
          </small>
        ) : null}
        {errors.title_kh ? <small className="contribute-field__error" id="contribute-title_kh-error">{errors.title_kh}</small> : null}
      </label>

      <label className="contribute-field" htmlFor="contribute-summary">
        <FieldLabel>{FIELD_LABELS.summary}</FieldLabel>
        <input
          {...getFieldProps("summary")}
          className={summaryAtLimit ? "contribute-field__input--limit-reached" : undefined}
          type="text"
          maxLength={CONTRIBUTION_LIMITS.summaryMax}
          placeholder="A short preview of the story"
        />
        <span className={`contribute-field__hint${summaryAtLimit ? " contribute-field__hint--limit-reached" : ""}`}>
          {countCodePoints(fields.summary)}/{CONTRIBUTION_LIMITS.summaryMax} characters
          {summaryAtLimit ? " — maximum reached" : ""}
        </span>
        {errors.summary ? <small className="contribute-field__error" id="contribute-summary-error">{errors.summary}</small> : null}
      </label>

      <div className="contribute-field">
        <label htmlFor="contribute-description">
          <FieldLabel required>{FIELD_LABELS.description}</FieldLabel>
        </label>
        <div className="contribute-field__textarea-wrap">
          <textarea
            {...getFieldProps("description")}
            ref={descriptionRef}
            className={descriptionAtLimit ? "contribute-field__input--limit-reached" : undefined}
            rows={7}
            maxLength={CONTRIBUTION_LIMITS.descriptionMax}
            minLength={CONTRIBUTION_LIMITS.descriptionMin}
            placeholder="Write the story or tradition you want to preserve."
            required
          />
          <ScrollIndicator
            scrollRef={descriptionRef}
            className="contribute-field__textarea-scrollbar"
          />
        </div>
        <span className={`contribute-field__hint${descriptionAtLimit ? " contribute-field__hint--limit-reached" : ""}`}>
          {countCodePoints(fields.description)}/{CONTRIBUTION_LIMITS.descriptionMax} characters
          {descriptionAtLimit ? " — maximum reached" : ""}
        </span>
        {errors.description ? <small className="contribute-field__error" id="contribute-description-error">{errors.description}</small> : null}
      </div>

      <div className="contribute-form__row">
        <div className="contribute-field">
          <label htmlFor="contribute-period_label">
            <FieldLabel>{FIELD_LABELS.period_label}</FieldLabel>
          </label>
          <fieldset
            className="contribute-period-mode"
            aria-label="Period format"
            disabled={isSubmitting}
          >
            {[
              { value: "year", label: "Year only" },
              { value: "date", label: "Exact date" },
            ].map((option) => (
              <label
                className={`contribute-period-mode__option${periodMode === option.value ? " contribute-period-mode__option--selected" : ""}`}
                key={option.value}
              >
                <input
                  type="radio"
                  name="period-mode"
                  data-contribution-keyboard-field="true"
                  value={option.value}
                  checked={periodMode === option.value}
                  onChange={() => selectPeriodMode(option.value)}
                />
                <span>{option.label}</span>
              </label>
            ))}
          </fieldset>
          {periodMode === "year" ? (
            <input
              {...getFieldProps("period_label")}
              data-contribution-period-input="true"
              value={periodYear}
              onChange={updatePeriodYear}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={4}
              placeholder="e.g. 2003"
            />
          ) : (
            <div
              className="contribute-period-date"
              role="group"
              aria-label="Exact date: day, month, and year"
            >
              <input
                id="contribute-period_label"
                data-contribution-keyboard-field
                data-contribution-period-input="true"
                name="period-day"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={2}
                value={periodDateParts.day}
                onChange={(event) => updatePeriodDatePart("day", event)}
                onBlur={(event) => padPeriodDateInput("day", event)}
                onPaste={pastePeriodDate}
                aria-label="Day"
                aria-invalid={Boolean(errors.period_label)}
                aria-describedby={errors.period_label ? "contribute-period_label-error" : undefined}
                autoComplete="off"
                disabled={isSubmitting}
                placeholder="DD"
              />
              <span aria-hidden="true">/</span>
              <input
                ref={periodMonthRef}
                id="contribute-period-month"
                data-contribution-keyboard-field
                name="period-month"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={2}
                value={periodDateParts.month}
                onChange={(event) => updatePeriodDatePart("month", event)}
                onBlur={(event) => padPeriodDateInput("month", event)}
                onPaste={pastePeriodDate}
                aria-label="Month"
                aria-invalid={Boolean(errors.period_label)}
                aria-describedby={errors.period_label ? "contribute-period_label-error" : undefined}
                autoComplete="off"
                disabled={isSubmitting}
                placeholder="MM"
              />
              <span aria-hidden="true">/</span>
              <input
                ref={periodYearRef}
                id="contribute-period-year"
                data-contribution-keyboard-field
                name="period-year"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={4}
                value={periodDateParts.year}
                onChange={(event) => updatePeriodDatePart("year", event)}
                onPaste={pastePeriodDate}
                aria-label="Year"
                aria-invalid={Boolean(errors.period_label)}
                aria-describedby={errors.period_label ? "contribute-period_label-error" : undefined}
                autoComplete="off"
                disabled={isSubmitting}
                placeholder="YYYY"
              />
            </div>
          )}
          {errors.period_label ? <small className="contribute-field__error" id="contribute-period_label-error">{errors.period_label}</small> : null}
        </div>

        <label className="contribute-field contribute-form__location" htmlFor="contribute-location">
          <FieldLabel>{FIELD_LABELS.location}</FieldLabel>
          <input
            {...getFieldProps("location")}
            className={locationAtLimit ? "contribute-field__input--limit-reached" : undefined}
            type="text"
            maxLength={CONTRIBUTION_LIMITS.locationMax}
            list="cambodian-provinces"
            autoComplete="address-level1"
            placeholder="Choose or enter a location"
            aria-describedby={getFieldDescriptionIds(
              "location",
              locationAtLimit ? "contribute-location-limit" : null,
            )}
          />
          {locationAtLimit ? (
            <small className="contribute-field__limit-reached" id="contribute-location-limit" role="status">
              Maximum of {CONTRIBUTION_LIMITS.locationMax} characters reached.
            </small>
          ) : null}
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
          data-contribution-keyboard-field
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
        {successMessage ? (
          <p className="contribute-form__success" role="status">
            {successMessage} <Link href="/my-entries">Check its status in My Entries.</Link>
            <span lang="km" className="contribute-form__success-khmer">
              សូមអរគុណដែលបានចែករំលែករឿងរ៉ាវរបស់អ្នក។ សាច់រឿងរបស់អ្នកកំពុងរង់ចាំការពិនិត្យ ហើយនឹងបង្ហាញក្នុងបណ្ណសារសាធារណៈ ប្រសិនបើត្រូវបានអនុម័ត។
            </span>
          </p>
        ) : null}
      </div>

      <button
        className="contribute-submit"
        type="submit"
        data-contribution-keyboard-field="true"
        disabled={isSubmitting}
      >
        {isSubmitting
          ? (isEditing ? "Saving changes…" : "Uploading and saving…")
          : (isEditing ? "Save changes" : "Add to the archive")}
      </button>
    </form>
  );
}
