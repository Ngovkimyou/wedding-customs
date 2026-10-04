import Link from "next/link";
import ContributionForm from "./ContributionForm.js";

export default function ArchiveEntryFormPage({
  isAuthenticated = false,
  mode = "create",
  entry = null,
}) {
  const isEditing = mode === "edit";
  const initialValues = entry
    ? {
      title_en: entry.title,
      title_kh: entry.khmerTitle,
      description: entry.content,
      period_label: entry.period,
      location: entry.location,
    }
    : undefined;

  return (
    <main className="contribute-page" aria-labelledby="contribute-title">
      <section className="contribute-card">
        <p className="contribute-card__eyebrow">
          {isEditing ? "Update your story" : "Grow the collection"}
        </p>
        <h1 id="contribute-title">
          {isEditing ? "Edit archive entry" : "Contribute an archive entry"}
        </h1>
        <p className="contribute-card__intro">
          {isEditing
            ? "Update the story and its details. Leave the photo field empty to keep the current photograph."
            : "Share a family story and a photograph. New entries are added to the public archive."}
        </p>

        {isEditing || isAuthenticated ? (
          <ContributionForm
            mode={mode}
            entryId={entry?.dbId}
            entrySlug={entry?.slug}
            initialValues={initialValues}
            existingThumbnailUrl={entry?.images?.[0]?.src ?? null}
          />
        ) : (
          <div className="contribute-login-prompt">
            <p>Log in to add an entry to the archive.</p>
            <Link className="contribute-submit" href="/login">Log in to contribute</Link>
          </div>
        )}
      </section>
    </main>
  );
}
