const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function validateImages(images, label, errors) {
  if (!Array.isArray(images)) {
    errors.push(`${label}: images must be an array.`);
    return;
  }

  images.forEach((image, imageIndex) => {
    if (!image || typeof image !== "object" || !image.src) {
      errors.push(`${label}: image ${imageIndex + 1} must include a src.`);
    }
  });
}

function validateGalleryConfig(config, label, errors) {
  if (!config) {
    return;
  }

  if (Array.isArray(config)) {
    validateImages(config, label, errors);
    return;
  }

  if (typeof config !== "object") {
    errors.push(`${label}: gallery configuration must be an object or image array.`);
    return;
  }

  if (config.images !== undefined) {
    validateImages(config.images, label, errors);
  }

  if (config.galleries !== undefined) {
    if (!Array.isArray(config.galleries)) {
      errors.push(`${label}: galleries must be an array.`);
    } else {
      config.galleries.forEach((gallery, index) => {
        validateGalleryConfig(gallery, `${label}, gallery ${index + 1}`, errors);
      });
    }
  }
}

function validateGalleryMap(galleries, label, errors) {
  if (galleries === undefined) {
    return;
  }

  if (!galleries || typeof galleries !== "object" || Array.isArray(galleries)) {
    errors.push(`${label}: imagesAfterParagraph must be an object.`);
    return;
  }

  Object.values(galleries).forEach((gallery, index) => {
    validateGalleryConfig(gallery, `${label}, gallery ${index + 1}`, errors);
  });
}

function validateParagraph(paragraph, context, slugs, sectionIds, errors) {
  const parts = Array.isArray(paragraph) ? paragraph : [paragraph];

  parts.forEach((part) => {
    if (typeof part === "string") {
      return;
    }

    if (!part || typeof part !== "object" || typeof part.text !== "string" || !part.text) {
      errors.push(`${context}: paragraph parts must contain text.`);
      return;
    }

    if (part.archiveSlug && !slugs.has(part.archiveSlug)) {
      errors.push(`${context}: archive link points to unknown slug "${part.archiveSlug}".`);
    }

    if (part.anchorId && !sectionIds.has(part.anchorId)) {
      errors.push(`${context}: anchor link points to unknown section "${part.anchorId}".`);
    }
  });
}

function validateParagraphs(paragraphs, context, slugs, sectionIds, errors) {
  if (paragraphs === undefined) {
    return;
  }

  if (!Array.isArray(paragraphs)) {
    errors.push(`${context}: paragraphs must be an array.`);
    return;
  }

  paragraphs.forEach((paragraph, paragraphIndex) => {
    validateParagraph(
      paragraph,
      `${context}, paragraph ${paragraphIndex + 1}`,
      slugs,
      sectionIds,
      errors,
    );
  });
}

function validateDescriptionContent(entry, slugs, errors) {
  if (entry.descriptionSections === undefined) {
    return;
  }

  const label = entry.id || entry.slug || "Archive entry";

  if (!Array.isArray(entry.descriptionSections)) {
    errors.push(`${label}: descriptionSections must be an array.`);
    return;
  }

  const sectionIds = new Set();

  entry.descriptionSections.forEach((section, sectionIndex) => {
    if (!section?.id) {
      return;
    }

    if (sectionIds.has(section.id)) {
      errors.push(`${label}, description section ${sectionIndex + 1}: duplicate id "${section.id}".`);
    } else {
      sectionIds.add(section.id);
    }
  });

  entry.descriptionSections.forEach((section, sectionIndex) => {
    const sectionLabel = `${label}, description section ${sectionIndex + 1}`;

    if (!section || typeof section !== "object" || !section.title) {
      errors.push(`${sectionLabel}: title is required.`);
      return;
    }

    validateGalleryMap(section.imagesAfterParagraph, sectionLabel, errors);
    validateParagraphs(section.paragraphs, sectionLabel, slugs, sectionIds, errors);

    if (section.subsections !== undefined && !Array.isArray(section.subsections)) {
      errors.push(`${sectionLabel}: subsections must be an array.`);
      return;
    }

    (section.subsections || []).forEach((subsection, subsectionIndex) => {
      const subsectionLabel = `${sectionLabel}, subsection ${subsectionIndex + 1}`;

      if (!subsection?.title) {
        errors.push(`${subsectionLabel}: title is required.`);
      }

      if (subsection?.images !== undefined) {
        validateImages(subsection.images, subsectionLabel, errors);
      }

      validateGalleryMap(subsection?.imagesAfterParagraph, subsectionLabel, errors);
      validateParagraphs(
        subsection?.paragraphs,
        subsectionLabel,
        slugs,
        sectionIds,
        errors,
      );
    });
  });
}

export function validateArchiveEntries(entries) {
  const errors = [];
  const ids = new Set();
  const slugs = new Set();

  if (!Array.isArray(entries)) {
    return ["Archive entries must be an array."];
  }

  entries.forEach((entry, index) => {
    const label = entry?.id || `entry ${index + 1}`;
    const summary = typeof entry?.summary === "string" ? entry.summary.trim() : "";
    const images = Array.isArray(entry?.images) ? entry.images : [];
    const isIntentionalPlaceholder = summary === "" && images.length === 0;

    if (!entry || typeof entry !== "object") {
      errors.push(`${label}: entry must be an object.`);
      return;
    }

    if (typeof entry.id !== "string" || !entry.id.trim()) {
      errors.push(`${label}: id is required.`);
    } else if (ids.has(entry.id)) {
      errors.push(`${label}: duplicate id "${entry.id}".`);
    } else {
      ids.add(entry.id);
    }

    if (typeof entry.slug !== "string" || !SLUG_PATTERN.test(entry.slug)) {
      errors.push(`${label}: slug must use lowercase words separated by hyphens.`);
    } else if (slugs.has(entry.slug)) {
      errors.push(`${label}: duplicate slug "${entry.slug}".`);
    } else {
      slugs.add(entry.slug);
    }

    if (typeof entry.title !== "string" || !entry.title.trim()) {
      errors.push(`${label}: title is required.`);
    }

    // Empty summary/image pairs are the intentional placeholders used by
    // future records. Populated records must provide both fields.
    if (!isIntentionalPlaceholder) {
      if (!summary) {
        errors.push(`${label}: summary is required for a populated record.`);
      }

      if (images.length === 0) {
        errors.push(`${label}: at least one image is required for a populated record.`);
      }
    }

    validateImages(entry.images, label, errors);
  });

  entries.forEach((entry) => {
    if (entry && typeof entry === "object") {
      validateDescriptionContent(entry, slugs, errors);
    }
  });

  return errors;
}

export function assertValidArchiveEntries(entries) {
  const errors = validateArchiveEntries(entries);

  if (errors.length > 0) {
    throw new Error(`Invalid archive data:\n- ${errors.join("\n- ")}`);
  }

  return entries;
}
