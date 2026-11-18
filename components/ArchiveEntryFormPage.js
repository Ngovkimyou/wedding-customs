import Link from "next/link";
import ContributionForm from "./ContributionForm.js";
import LocaleText from "./LocaleText.js";

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
      summary: entry.summary,
      description: entry.content,
      period_label: entry.period,
      location: entry.location,
    }
    : undefined;

  return (
    <main className="contribute-page" aria-labelledby="contribute-title">
      <section className="contribute-card">
        <h1 id="contribute-title">
          <LocaleText>{isEditing ? "Edit archive entry" : "Contribute an archive entry"}</LocaleText>
        </h1>
        {isEditing ? (
          <p className="contribute-card__intro">
            <LocaleText>Update the story and its details. Leave the photo field empty to keep the current photograph.</LocaleText>
          </p>
        ) : null}

        {isEditing || isAuthenticated ? (
          <ContributionForm
            mode={mode}
            entryId={entry?.dbId}
            initialValues={initialValues}
            existingThumbnailUrl={entry?.images?.[0]?.src ?? null}
          />
        ) : (
          <div className="contribute-login-prompt">
            <p><LocaleText>Log in to add an entry to the archive.</LocaleText></p>
            <Link className="contribute-submit" href="/login"><LocaleText>Log in to contribute</LocaleText></Link>
          </div>
        )}
      </section>
    </main>
  );
}
