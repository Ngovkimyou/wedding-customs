"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import ScrollIndicator from "./ScrollIndicator.js";
import FullScreenPhotoPreview from "./FullScreenPhotoPreview.js";
import InteractionLock from "./InteractionLock.js";
import { useLocale } from "./LocaleProvider.js";
import { createArchiveEntry, updateArchiveEntry } from "../app/contribute/actions.js";
import { createClient } from "../lib/supabase/client.js";
import { countCodePoints } from "../lib/security.mjs";
import { translate } from "../lib/locale.js";
import {
  CAMBODIAN_PROVINCES,
  CONTRIBUTION_LIMITS,
  countDescriptionCharacters,
  detectSupportedPhoto,
  isValidPeriodForMode,
  normalizePeriodLabel,
  normalizeContributionFields,
  padPeriodDatePart,
  parsePeriodDateParts,
  sanitizePeriodDatePart,
  sanitizePeriodYear,
  sanitizeDescriptionInput,
  serializePeriodDateParts,
  validateContributionFields,
} from "../lib/contribution-validation.mjs";

const INITIAL_FIELDS = {
  title_en: "",
  title_kh: "",
  summary: "",
  description_en: "",
  description_kh: "",
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
const CONTRIBUTION_FIELD_KEYBOARD_ORDER = {
  title_en: 10,
  title_kh: 20,
  description_en: 30,
  description_kh: 30,
  photo: 40,
  summary: 50,
  period_label: 60,
  location: 70,
};

function focusAdjacentContributionField(form, field, direction, focusSubmitAtEnd = false) {
  const fields = Array.from(form.querySelectorAll(KEYBOARD_NAVIGATION_FIELD_SELECTOR))
    .filter((candidate) => !candidate.disabled && candidate.type !== "radio")
    .sort((first, second) => Number(first.dataset.contributionKeyboardOrder)
      - Number(second.dataset.contributionKeyboardOrder));
  const currentIndex = fields.indexOf(field);
  if (currentIndex < 0) return;

  const nextField = fields[currentIndex + direction];
  if (nextField) {
    const firstPeriodInput = fields.find((candidate) => candidate.hasAttribute("data-contribution-period-input"));
    const isEnteringPeriod = direction > 0
      && nextField === firstPeriodInput
      && !field.hasAttribute("data-contribution-period-input");
    if (isEnteringPeriod) {
      focusPeriodMode(form, "year");
    } else {
      nextField.focus();
    }
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

function isCaretAtTextAreaStart(textarea) {
  return textarea.selectionStart === 0 && textarea.selectionEnd === 0;
}

function FieldLabel({ children, required = false }) {
  const { locale } = useLocale();
  return (
    <span className="contribute-field__label">
      <span className="contribute-field__label-text">
        {translate(locale, children)}
        {required ? <span className="contribute-required" aria-hidden="true">*</span> : null}
        {!required ? <span className="contribute-optional">{translate(locale, "(Optional)")}</span> : null}
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

function focusFirstInvalid(errors, descriptionLanguage, setDescriptionLanguage) {
  const activeDescriptionField = `description_${descriptionLanguage}`;
  const alternateDescriptionField = descriptionLanguage === "km" ? "description_en" : "description_kh";
  const descriptionErrorField = errors[activeDescriptionField]
    ? activeDescriptionField
    : errors[alternateDescriptionField]
      ? alternateDescriptionField
      : errors.description
        ? activeDescriptionField
        : null;

  if (descriptionErrorField) {
    const nextLanguage = descriptionErrorField === "description_kh" ? "km" : "en";
    setDescriptionLanguage(nextLanguage);
    window.requestAnimationFrame(() => {
      document.getElementById(`contribute-${descriptionErrorField}`)?.focus();
    });
    return;
  }

  const firstField = [
    "title_en", "title_kh", "summary", "period_label", "location", "photo",
  ].find((field) => errors[field]);
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
  const { locale } = useLocale();
  const isEditing = mode === "edit";
  const {
    description: legacyDescription = "",
    ...localizedInitialValues
  } = initialValues ?? {};
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
    ...localizedInitialValues,
    description_en: typeof localizedInitialValues.description_en === "string"
      ? localizedInitialValues.description_en
      : typeof legacyDescription === "string"
        ? legacyDescription
        : "",
    description_kh: typeof localizedInitialValues.description_kh === "string"
      ? localizedInitialValues.description_kh
      : "",
    period_label: initialPeriodValue,
  }));
  const [descriptionLanguage, setDescriptionLanguage] = useState(locale === "km" ? "km" : "en");
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
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState("");
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState("");
  const [isSubmissionComplete, setIsSubmissionComplete] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isSubmissionComplete) {
      titleEnRef.current?.focus({ preventScroll: true });
    }
  }, [isSubmissionComplete]);

  useEffect(() => {
    setDescriptionLanguage(locale === "km" ? "km" : "en");
  }, [locale]);

  // Fast Refresh can preserve pre-bilingual form state while developing.
  // Migrate its single legacy description into the currently selected version.
  useEffect(() => {
    setFields((current) => {
      const legacyDescriptionDraft = typeof current.description === "string"
        ? current.description
        : "";
      const descriptionEn = typeof current.description_en === "string"
        ? current.description_en
        : descriptionLanguage === "en" ? legacyDescriptionDraft : "";
      const descriptionKh = typeof current.description_kh === "string"
        ? current.description_kh
        : descriptionLanguage === "km" ? legacyDescriptionDraft : "";

      if (
        current.description_en === descriptionEn
        && current.description_kh === descriptionKh
      ) {
        return current;
      }

      return {
        ...current,
        description_en: descriptionEn,
        description_kh: descriptionKh,
      };
    });
  }, [descriptionLanguage]);

  useEffect(() => {
    if (!photo) {
      setPhotoPreviewUrl("");
      return undefined;
    }

    const previewUrl = URL.createObjectURL(photo);
    setPhotoPreviewUrl(previewUrl);
    return () => URL.revokeObjectURL(previewUrl);
  }, [photo]);

  const updateField = (event) => {
    const { name, value } = event.currentTarget;
    const safeValue = name.startsWith("description_") ? sanitizeDescriptionInput(value) : value;
    setFields((current) => ({ ...current, [name]: safeValue }));
    setErrors((current) => ({
      ...current,
      [name]: "",
      ...(name.startsWith("description_") ? { description: "" } : {}),
    }));
    setMessage("");
  };

  const updatePeriodValue = (value) => {
    setFields((current) => ({ ...current, period_label: value }));
    setErrors((current) => ({ ...current, period_label: "" }));
    setMessage("");
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
  };

  const removeSelectedPhoto = () => {
    setPhoto(null);
    if (photoInputRef.current) {
      photoInputRef.current.value = "";
    }
    setErrors((current) => ({ ...current, photo: "" }));
    setMessage("");
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
      if (field.hasAttribute("data-description-language-option")
        && (event.key === "ArrowLeft" || event.key === "ArrowRight")) {
        event.preventDefault();
        const options = ["km", "en"];
        const currentIndex = options.indexOf(field.dataset.descriptionLanguageOption);
        const direction = event.key === "ArrowRight" ? 1 : -1;
        const nextLanguage = options[(currentIndex + direction + options.length) % options.length];
        setDescriptionLanguage(nextLanguage);
        window.requestAnimationFrame(() => {
          document.getElementById(`contribute-description-language-${nextLanguage}`)?.focus();
        });
        return;
      }
      if (event.key === "ArrowUp" || event.key === "ArrowDown") {
        event.preventDefault();
        const direction = event.key === "ArrowDown" ? 1 : -1;
        if (field.type !== "submit" || direction < 0) {
          focusAdjacentContributionField(form, field, direction, direction > 0);
        }
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
        const firstPeriodInput = form.querySelector("[data-contribution-period-input]:not(:disabled)");
        if (firstPeriodInput) focusAdjacentContributionField(form, firstPeriodInput, -1);
      }
      return;
    }

    const isMultiline = field.tagName === "TEXTAREA";
    const hasNativeSuggestions = field.hasAttribute("list");
    if ((event.key === "ArrowDown" || event.key === "ArrowUp") && !isMultiline) {
      // Keep arrow keys in the form flow instead of moving through browser
      // autofill or datalist suggestion panels.
      event.preventDefault();
      const periodInputs = Array.from(form.querySelectorAll("[data-contribution-period-input]:not(:disabled)"));
      if (field.hasAttribute("data-contribution-period-input")
        && event.key === "ArrowUp"
        && field === periodInputs[0]) {
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
      // Keep normal caret movement and paragraph breaks. At either text edge,
      // the arrow key can move to the adjacent field in the displayed order.
      if (event.key === "ArrowDown" && isCaretAtTextAreaEnd(field)) {
        event.preventDefault();
        focusAdjacentContributionField(form, field, 1, true);
        return;
      }
      if (event.key === "ArrowUp" && isCaretAtTextAreaStart(field)) {
        event.preventDefault();
        focusAdjacentContributionField(form, field, -1);
        return;
      }
      if (event.ctrlKey || event.metaKey) {
        if (event.key === "Enter") {
          event.preventDefault();
          focusAdjacentContributionField(form, field, 1, true);
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
    const normalizedFields = normalizeContributionFields({
      ...fields,
      description_en: sanitizeDescriptionInput(fields.description_en),
      description_kh: sanitizeDescriptionInput(fields.description_kh),
    });
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
      focusFirstInvalid(nextErrors, descriptionLanguage, setDescriptionLanguage);
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
          focusFirstInvalid(result.fieldErrors, descriptionLanguage, setDescriptionLanguage);
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
        setIsSubmissionComplete(true);
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
    value: typeof fields[field] === "string" ? fields[field] : "",
    onChange: updateField,
    disabled: isSubmitting,
    "data-contribution-keyboard-field": "true",
    "data-contribution-keyboard-order": CONTRIBUTION_FIELD_KEYBOARD_ORDER[field] ?? 100,
    "aria-invalid": Boolean(errors[field]),
    "aria-describedby": errors[field] ? `contribute-${field}-error` : undefined,
  });
  const titleEnAtLimit = fields.title_en.length >= CONTRIBUTION_LIMITS.titleEnMax;
  const titleKhAtLimit = fields.title_kh.length >= CONTRIBUTION_LIMITS.titleKhMax;
  const summaryAtLimit = fields.summary.length >= CONTRIBUTION_LIMITS.summaryMax;
  const descriptionField = descriptionLanguage === "km" ? "description_kh" : "description_en";
  const descriptionFieldError = errors[descriptionField] || errors.description;
  const descriptionLengths = {
    en: countDescriptionCharacters(fields.description_en),
    km: countDescriptionCharacters(fields.description_kh),
  };
  const descriptionLength = descriptionLengths[descriptionLanguage];
  const descriptionAtLimit = descriptionLength >= CONTRIBUTION_LIMITS.descriptionMax;
  const descriptionCounterLanguages = [
    { value: descriptionLanguage, label: descriptionLanguage === "km" ? "Khmer" : "English" },
    {
      value: descriptionLanguage === "km" ? "en" : "km",
      label: descriptionLanguage === "km" ? "English" : "Khmer",
    },
  ].filter((option, index) => (
    index === 0 || descriptionLengths[option.value] > 0
  ));
  const locationAtLimit = fields.location.length >= CONTRIBUTION_LIMITS.locationMax;
  const getFieldDescriptionIds = (field, additionalId) => [
    errors[field] ? `contribute-${field}-error` : null,
    additionalId,
  ].filter(Boolean).join(" ") || undefined;

  if (isSubmissionComplete) {
    return (
      <section
        className="contribution-success"
        lang={locale}
        aria-labelledby="contribution-success-title"
      >
        <span className="contribution-success__mark" aria-hidden="true">✓</span>
        <h1 id="contribution-success-title">{translate(locale, "Thank you for sharing your story")}</h1>
        <p className="contribution-success__message" role="status">
          {translate(locale, "Your entry is waiting for review and will appear in the public archive if approved.")}
        </p>
        <div className="contribution-success__actions">
          <Link className="contribution-success__action contribution-success__action--status" href="/my-entries">
            <span className="contribution-success__action-title">{translate(locale, "Check your status")}</span>
          </Link>
          <button
            className="contribution-success__action contribution-success__action--another"
            type="button"
            onClick={() => setIsSubmissionComplete(false)}
          >
            <span className="contribution-success__action-title">{translate(locale, "Contribute another story")}</span>
          </button>
        </div>
      </section>
    );
  }

  return (
    <>
      <form
        className="contribute-form"
        onSubmit={handleSubmit}
        onKeyDown={handleKeyboardNavigation}
        noValidate
        aria-busy={isSubmitting}
        inert={isSubmitting}
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
          placeholder={translate(locale, "A short English title")}
          required
          aria-describedby={getFieldDescriptionIds(
            "title_en",
            titleEnAtLimit ? "contribute-title_en-limit" : null,
          )}
        />
        {titleEnAtLimit ? (
          <small className="contribute-field__limit-reached" id="contribute-title_en-limit" role="status">
            {translate(locale, `Maximum of ${CONTRIBUTION_LIMITS.titleEnMax} characters reached.`)}
          </small>
        ) : null}
        {errors.title_en ? <small className="contribute-field__error" id="contribute-title_en-error">{translate(locale, errors.title_en)}</small> : null}
      </label>

      <label className="contribute-field" htmlFor="contribute-title_kh">
        <FieldLabel required>{FIELD_LABELS.title_kh}</FieldLabel>
        <input
          {...getFieldProps("title_kh")}
          className={titleKhAtLimit ? "contribute-field__input--limit-reached" : undefined}
          type="text"
          lang="km"
          maxLength={CONTRIBUTION_LIMITS.titleKhMax}
          placeholder={translate(locale, "Enter the title in Khmer")}
          required
          aria-describedby={getFieldDescriptionIds(
            "title_kh",
            titleKhAtLimit ? "contribute-title_kh-limit" : null,
          )}
        />
        {titleKhAtLimit ? (
          <small className="contribute-field__limit-reached" id="contribute-title_kh-limit" role="status">
            {translate(locale, `Maximum of ${CONTRIBUTION_LIMITS.titleKhMax} characters reached.`)}
          </small>
        ) : null}
        {errors.title_kh ? <small className="contribute-field__error" id="contribute-title_kh-error">{translate(locale, errors.title_kh)}</small> : null}
      </label>

      <label className="contribute-field contribute-form__optional-summary" htmlFor="contribute-summary">
        <FieldLabel>{FIELD_LABELS.summary}</FieldLabel>
        <input
          {...getFieldProps("summary")}
          className={summaryAtLimit ? "contribute-field__input--limit-reached" : undefined}
          type="text"
          maxLength={CONTRIBUTION_LIMITS.summaryMax}
          placeholder={translate(locale, "A short preview of the story")}
        />
        <span className={`contribute-field__hint${summaryAtLimit ? " contribute-field__hint--limit-reached" : ""}`}>
          {countCodePoints(fields.summary)}/{CONTRIBUTION_LIMITS.summaryMax} {translate(locale, "characters")}
          {summaryAtLimit ? ` — ${translate(locale, "maximum reached")}` : ""}
        </span>
        {errors.summary ? <small className="contribute-field__error" id="contribute-summary-error">{translate(locale, errors.summary)}</small> : null}
      </label>

      <div className="contribute-field contribute-form__required-description">
        <div className="contribute-description__header">
          <label htmlFor={`contribute-${descriptionField}`}>
            <FieldLabel required>{FIELD_LABELS.description}</FieldLabel>
            <span className="contribute-description__active-language">
              {translate(locale, descriptionLanguage === "km" ? "Khmer version" : "English version")}
            </span>
          </label>
          <div className="contribute-description__languages" role="group" aria-label={translate(locale, "Description language")}>
            {[{ value: "km", label: "Khmer" }, { value: "en", label: "English" }].map((option) => (
              <button
                className={`contribute-description__language${descriptionLanguage === option.value ? " contribute-description__language--selected" : ""}`}
                type="button"
                key={option.value}
                id={`contribute-description-language-${option.value}`}
                data-description-language-option={option.value}
                data-contribution-keyboard-field={descriptionLanguage === option.value ? "true" : undefined}
                data-contribution-keyboard-order={CONTRIBUTION_FIELD_KEYBOARD_ORDER.description_en}
                aria-pressed={descriptionLanguage === option.value}
                disabled={isSubmitting}
                onClick={() => setDescriptionLanguage(option.value)}
              >
                {translate(locale, option.label)}
              </button>
            ))}
          </div>
        </div>
        <p className="contribute-description__hint">
          {translate(locale, "Add a description in either language or both. Each version must contain 20 to 2,000 characters.")}
        </p>
        <div className="contribute-field__textarea-wrap">
          <textarea
            {...getFieldProps(descriptionField)}
            ref={descriptionRef}
            lang={descriptionLanguage}
            dir="auto"
            className={descriptionAtLimit ? "contribute-field__input--limit-reached" : undefined}
            rows={7}
            maxLength={CONTRIBUTION_LIMITS.descriptionMax}
            minLength={CONTRIBUTION_LIMITS.descriptionMin}
            placeholder={translate(locale, "Write the story or tradition you want to preserve.")}
            aria-invalid={Boolean(descriptionFieldError)}
            aria-required={!fields.description_en && !fields.description_kh}
            aria-describedby={descriptionFieldError ? `contribute-${descriptionField}-error` : undefined}
          />
          <ScrollIndicator
            scrollRef={descriptionRef}
            className="contribute-field__textarea-scrollbar"
          />
        </div>
        <div
          className="contribute-description__counters"
          role="group"
          aria-label={translate(locale, "Description character counts")}
        >
          {descriptionCounterLanguages.map((option) => {
            const length = descriptionLengths[option.value];
            const atLimit = length >= CONTRIBUTION_LIMITS.descriptionMax;
            return (
              <span
                className={`contribute-description__counter${atLimit ? " contribute-description__counter--limit-reached" : ""}`}
                data-current-language={option.value === descriptionLanguage || undefined}
                key={option.value}
              >
                {translate(locale, option.label)}: {length}/{CONTRIBUTION_LIMITS.descriptionMax}
                {atLimit ? ` — ${translate(locale, "maximum reached")}` : ""}
              </span>
            );
          })}
        </div>
        {descriptionFieldError ? (
          <small className="contribute-field__error" id={`contribute-${descriptionField}-error`}>
            {translate(locale, descriptionFieldError)}
          </small>
        ) : null}
      </div>

      <div className={`contribute-field contribute-field--photo ${isEditing ? "contribute-form__optional-photo" : "contribute-form__required-photo"}`}>
        <label className="contribute-field__label" htmlFor="contribute-photo">
          <FieldLabel required={!isEditing}>
            {translate(locale, isEditing ? "Replace photograph" : FIELD_LABELS.photo)}
          </FieldLabel>
        </label>
        {isEditing && existingThumbnailUrl ? (
          <figure className="contribute-current-photo">
            <Image
              src={existingThumbnailUrl}
              alt={`${translate(locale, "Photograph for")} ${fields.title_en}`}
              width={800}
              height={560}
              unoptimized
            />
            <figcaption>{translate(locale, "Current photograph. Choose a new file only if you want to replace it.")}</figcaption>
          </figure>
        ) : null}
        <div className="contribute-photo-picker" data-invalid={Boolean(errors.photo)}>
          <input
            ref={photoInputRef}
            className="contribute-photo-picker__input"
            id="contribute-photo"
            data-contribution-keyboard-field
            data-contribution-keyboard-order={isEditing ? "75" : CONTRIBUTION_FIELD_KEYBOARD_ORDER.photo}
            name="photo"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            disabled={isSubmitting}
            aria-invalid={Boolean(errors.photo)}
            aria-required={!isEditing}
            aria-describedby={errors.photo
              ? "contribute-photo-error"
              : isEditing ? "contribute-photo-hint" : undefined}
            onChange={updatePhoto}
          />
          <label className="contribute-photo-picker__button" htmlFor="contribute-photo" lang={locale}>
            {translate(locale, "Choose File")}
          </label>
          <span className="contribute-photo-picker__name" aria-live="polite" lang={locale}>
            {photo?.name || translate(locale, "No file chosen")}
          </span>
        </div>
        {photo && photoPreviewUrl ? (
          <figure className="contribute-selected-photo">
            <FullScreenPhotoPreview
              src={photoPreviewUrl}
              alt={`${translate(locale, "Photograph")} ${photo.name}`}
              className="contribute-selected-photo__open"
              disabled={isSubmitting}
              triggerProps={{
                "data-contribution-keyboard-field": "true",
                "data-contribution-keyboard-order": isEditing ? "76" : "45",
              }}
            >
              <Image
                src={photoPreviewUrl}
                alt=""
                width={800}
                height={560}
                unoptimized
              />
            </FullScreenPhotoPreview>
            <button
              className="contribute-selected-photo__remove"
              type="button"
              data-contribution-keyboard-field="true"
              data-contribution-keyboard-order={isEditing ? "77" : "46"}
              aria-label={translate(locale, "Remove selected photograph")}
              title={translate(locale, "Remove selected photograph")}
              disabled={isSubmitting}
              onClick={removeSelectedPhoto}
            >
              <svg viewBox="0 0 20 20" aria-hidden="true">
                <path d="m5 5 10 10M15 5 5 15" />
              </svg>
            </button>
          </figure>
        ) : null}
        {isEditing ? (
          <span className="contribute-field__hint" id="contribute-photo-hint">
            {translate(locale, "Choose a JPEG, PNG, WebP, or AVIF photo up to 10 MB. Leave this empty to keep the current photograph.")}
          </span>
        ) : null}
        {errors.photo ? <small className="contribute-field__error" id="contribute-photo-error">{translate(locale, errors.photo)}</small> : null}
      </div>

      <div className="contribute-form__row contribute-form__optional-row">
        <div className="contribute-field">
          <label htmlFor="contribute-period_label">
            <FieldLabel>{FIELD_LABELS.period_label}</FieldLabel>
          </label>
          <fieldset
            className="contribute-period-mode"
            aria-label={translate(locale, "Period format")}
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
                  data-contribution-keyboard-order={CONTRIBUTION_FIELD_KEYBOARD_ORDER.period_label}
                  value={option.value}
                  checked={periodMode === option.value}
                  onChange={() => selectPeriodMode(option.value)}
                />
                <span>{translate(locale, option.label)}</span>
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
              placeholder={translate(locale, "e.g. 2003")}
            />
          ) : (
            <div
              className="contribute-period-date"
              role="group"
              aria-label={translate(locale, "Exact date: day, month, and year")}
            >
              <input
                id="contribute-period_label"
                data-contribution-keyboard-field
                data-contribution-keyboard-order="60"
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
                aria-label={translate(locale, "Day")}
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
                data-contribution-keyboard-order="61"
                name="period-month"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={2}
                value={periodDateParts.month}
                onChange={(event) => updatePeriodDatePart("month", event)}
                onBlur={(event) => padPeriodDateInput("month", event)}
                onPaste={pastePeriodDate}
                aria-label={translate(locale, "Month")}
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
                data-contribution-keyboard-order="62"
                name="period-year"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={4}
                value={periodDateParts.year}
                onChange={(event) => updatePeriodDatePart("year", event)}
                onPaste={pastePeriodDate}
                aria-label={translate(locale, "Year")}
                aria-invalid={Boolean(errors.period_label)}
                aria-describedby={errors.period_label ? "contribute-period_label-error" : undefined}
                autoComplete="off"
                disabled={isSubmitting}
                placeholder="YYYY"
              />
            </div>
          )}
          {errors.period_label ? <small className="contribute-field__error" id="contribute-period_label-error">{translate(locale, errors.period_label)}</small> : null}
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
            placeholder={translate(locale, "Choose or enter a location")}
            aria-describedby={getFieldDescriptionIds(
              "location",
              locationAtLimit ? "contribute-location-limit" : null,
            )}
          />
          {locationAtLimit ? (
            <small className="contribute-field__limit-reached" id="contribute-location-limit" role="status">
              {translate(locale, `Maximum of ${CONTRIBUTION_LIMITS.locationMax} characters reached.`)}
            </small>
          ) : null}
          <datalist id="cambodian-provinces">
            {CAMBODIAN_PROVINCES.map((province) => <option value={province} key={province} />)}
          </datalist>
          {errors.location ? <small className="contribute-field__error" id="contribute-location-error">{translate(locale, errors.location)}</small> : null}
        </label>

      </div>

      <div className="contribute-form__status" aria-live="polite">
        {message ? <p role="alert">{translate(locale, message)}</p> : null}
      </div>

      <button
        className="contribute-submit"
        type="submit"
        data-contribution-keyboard-field="true"
        data-contribution-keyboard-order="80"
        disabled={isSubmitting}
      >
        {isSubmitting
          ? translate(locale, isEditing ? "Saving changes…" : "Uploading and saving…")
          : translate(locale, isEditing ? "Save changes" : "Add to the archive")}
      </button>
      </form>
      {isSubmitting ? (
        <InteractionLock
          message={translate(locale, isEditing ? "Saving changes..." : "Uploading and saving...")}
        />
      ) : null}
    </>
  );
}
