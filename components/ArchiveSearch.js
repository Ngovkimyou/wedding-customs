"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import searchBackground from "../assets/search-background.avif";
import {
  getArchiveDescriptionBlocks,
  getArchiveSearchMatchFlags,
  getArchiveDescriptionSnippets,
  getArchiveDescriptionText,
  keepKhmerSearchText,
  normalizeSearchText,
} from "../lib/archive-search.mjs";
import { limitCodePoints, SEARCH_QUERY_MAX_LENGTH } from "../lib/security.mjs";
import {
  isCommunityArchiveEntry,
  splitArchiveDescriptionParagraphs,
} from "../lib/archive-entry-mapper.mjs";
import {
  translateArchiveContent,
  translateArchiveSearchSnippet,
  translateArchiveSearchText,
} from "../lib/archive-content-km.js";
import HighlightedTitle from "./HighlightedTitle.js";
import KhmerScriptText from "./KhmerScriptText.js";
import ScrollIndicator from "./ScrollIndicator.js";
import { getLocalizedTitles, translate } from "../lib/locale.js";
import { useLocale } from "./LocaleProvider.js";

const KHMER_SCRIPT_PATTERN = /[\u1780-\u17ff\u19e0-\u19ff]/u;

function splitCommunityDescription(value) {
  return splitArchiveDescriptionParagraphs(value)
    .map((text) => ({ sectionTitle: "Story", text }));
}

export default function ArchiveSearch({ entries = [], dataStatus = "ready" }) {
  const { locale } = useLocale();
  const [query, setQuery] = useState("");
  const searchRef = useRef(null);
  const inputRef = useRef(null);
  const resultRefs = useRef([]);
  const normalizedQuery = normalizeSearchText(query);
  const displayQuery = query.trim().replace(/\s+/gu, " ");
  const searchIndex = useMemo(
    () => entries.map((entry) => {
      const isCommunityEntry = isCommunityArchiveEntry(entry);
      const existingDescriptionBlocks = getArchiveDescriptionBlocks(entry);
      const englishDescriptionBlocks = isCommunityEntry && entry.descriptionEn
        ? splitCommunityDescription(entry.descriptionEn)
        : existingDescriptionBlocks;
      const khmerDescriptionBlocks = isCommunityEntry
        ? (entry.descriptionKh
          ? splitCommunityDescription(entry.descriptionKh)
          : existingDescriptionBlocks)
          .map((block) => ({
            sectionTitle: keepKhmerSearchText(block.sectionTitle),
            text: keepKhmerSearchText(block.text),
          }))
          .filter((block) => block.text && KHMER_SCRIPT_PATTERN.test(block.text))
        : existingDescriptionBlocks
          .map((block) => ({
            sectionTitle: translate("km", translateArchiveContent("km", block.sectionTitle)),
            text: translateArchiveSearchText("km", block.text),
          }))
          .filter((block) => block.text && KHMER_SCRIPT_PATTERN.test(block.text));
      const khmerSearchBlocks = isCommunityEntry && entry.descriptionKh
        ? khmerDescriptionBlocks
        : khmerDescriptionBlocks.map((block) => ({
          ...block,
          text: keepKhmerSearchText(block.text),
        })).filter((block) => block.text);

      return {
        ...entry,
        isCommunityEntry,
        descriptionBlocks: englishDescriptionBlocks,
        khmerDescriptionBlocks,
        searchTitle: normalizeSearchText(entry.title),
        searchKhmerTitle: normalizeSearchText(keepKhmerSearchText(entry.khmerTitle)),
        searchDescription: normalizeSearchText(getArchiveDescriptionText({
          ...entry,
          descriptionBlocks: englishDescriptionBlocks,
        })),
        searchKhmerDescription: normalizeSearchText(getArchiveDescriptionText({
          ...entry,
          descriptionBlocks: khmerSearchBlocks,
        })),
      };
    }),
    [entries],
  );
  const matches = useMemo(() => {
    if (!normalizedQuery) {
      return [];
    }

    return searchIndex.flatMap((entry) => {
      const { titleMatches, descriptionMatches } = getArchiveSearchMatchFlags(
        entry,
        normalizedQuery,
        locale,
      );

      if (!titleMatches && !descriptionMatches) {
        return [];
      }

      return [{
        ...entry,
        useKhmerDescription: KHMER_SCRIPT_PATTERN.test(normalizedQuery)
          && entry.searchKhmerDescription.includes(normalizedQuery),
        descriptionSnippets: descriptionMatches
          ? getArchiveDescriptionSnippets(
            KHMER_SCRIPT_PATTERN.test(normalizedQuery)
              ? { ...entry, descriptionBlocks: entry.khmerDescriptionBlocks }
              : entry,
            normalizedQuery,
          )
          : [],
      }];
    });
  }, [locale, normalizedQuery, searchIndex]);

  const focusResult = (index) => {
    const result = resultRefs.current[index];
    if (result) {
      result.focus();
    }
  };

  const handleSearchKeyDown = (event) => {
    if (event.key === "ArrowDown" && matches.length && !event.nativeEvent.isComposing) {
      event.preventDefault();
      focusResult(0);
    }
  };

  const handleResultKeyDown = (event, index) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      focusResult(Math.min(matches.length - 1, index + 1));
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      focusResult(Math.max(0, index - 1));
    }
    if (event.key === " ") {
      event.preventDefault();
      if (!event.repeat) event.currentTarget.click();
    }
  };

  const clearSearch = () => {
    setQuery("");
    inputRef.current?.focus();
  };

  const handleQueryChange = (event) => {
    setQuery(limitCodePoints(event.target.value, SEARCH_QUERY_MAX_LENGTH));
  };

  return (
      <section className="archive-search" ref={searchRef} aria-labelledby="archive-search-title">
      <ScrollIndicator scrollRef={searchRef} className="archive-search__scrollbar" />
      <div className="archive-search__inner">
        <p className="eyebrow">{translate(locale, "Explore the collection")}</p>
        <h1 id="archive-search-title" lang={locale}>{translate(locale, "Search the archive")}</h1>
        <div className="archive-search__input-wrap">
          <span className="archive-search__input-icon" aria-hidden="true" />
          <input
            ref={inputRef}
            id="archive-search-input"
            className="archive-search__input"
            lang={locale}
            type="search"
            aria-label={translate(locale, "Search archive titles and descriptions")}
            aria-controls="archive-search-results"
            value={query}
            onChange={handleQueryChange}
            onKeyDown={handleSearchKeyDown}
            placeholder={translate(locale, "Type a title or phrase…")}
            autoComplete="off"
            maxLength={SEARCH_QUERY_MAX_LENGTH}
            autoFocus
          />
          {query ? (
            <button className="archive-search__clear" type="button" onClick={clearSearch}>
              {translate(locale, "Clear")}
            </button>
          ) : null}
        </div>
        <p className="archive-search__status" role="status">
          {dataStatus === "loading"
            ? translate(locale, "Loading archive records…")
            : dataStatus === "error"
              ? translate(locale, "Search is temporarily unavailable. Please try again shortly.")
              : dataStatus === "empty"
                ? translate(locale, "No archive records are available yet.")
                : displayQuery
                  ? `${matches.length} ${translate(locale, matches.length === 1 ? "record" : "records")} ${translate(locale, "found")}`
                  : translate(locale, "Start typing to search the archive.")}
        </p>
        {dataStatus === "error" ? (
          <p className="archive-search__empty" role="alert">
            {translate(locale, "The archive could not be loaded right now.")}
          </p>
        ) : displayQuery && matches.length === 0 ? (
          <p className="archive-search__empty">{translate(locale, "No match found for")} “{displayQuery}”.</p>
        ) : null}
        {matches.length === 0 ? (
          <div className="archive-search__empty-art" aria-hidden="true">
            <img
              src={searchBackground.src}
              width={searchBackground.width}
              height={searchBackground.height}
              decoding="async"
              alt=""
            />
          </div>
        ) : null}
        <div className="archive-search__results" id="archive-search-results">
          {matches.map((entry, index) => {
            const isCommunityEntry = entry.isCommunityEntry;
            const descriptionSnippets = entry.descriptionSnippets?.map((snippet) => ({
              ...snippet,
              localizedContext: isCommunityEntry
                ? translate(locale, snippet.sectionTitle)
                : translate(locale, translateArchiveContent(locale, snippet.sectionTitle)),
              localizedText: isCommunityEntry || entry.useKhmerDescription
                ? snippet.text
                : translateArchiveSearchSnippet(locale, snippet.text),
            })).filter((snippet) => (
              locale !== "km"
              || isCommunityEntry
              || KHMER_SCRIPT_PATTERN.test(snippet.localizedText)
            ));
            const localizedSummary = isCommunityEntry
              ? entry.summary
              : translateArchiveSearchText(locale, entry.summary);
            const {
              primaryTitle,
              alternateTitle,
              primaryLocale,
              alternateLocale,
            } = getLocalizedTitles(locale, entry.title, entry.khmerTitle);

            return (
              <Link
                className="archive-search__result ornate-frame"
                href={`/archive/${entry.slug}?from=search`}
                prefetch={true}
                key={entry.dbId ?? entry.id}
                ref={(element) => { resultRefs.current[index] = element; }}
                onKeyDown={(event) => handleResultKeyDown(event, index)}
              >
                <span className="archive-search__result-meta">{entry.id}</span>
                <h2 lang={primaryLocale}>
                  <HighlightedTitle title={primaryTitle} query={normalizedQuery} />
                </h2>
                {alternateTitle ? (
                  <p className="archive-search__result-khmer-title" lang={alternateLocale}>
                    <HighlightedTitle title={alternateTitle} query={normalizedQuery} />
                  </p>
                ) : null}
                {descriptionSnippets?.length ? (
                  <div className="archive-search__description-matches">
                    {descriptionSnippets.map((snippet, snippetIndex) => (
                      <div className="archive-search__description-match" key={`${snippet.sectionTitle}-${snippetIndex}`}>
                        {snippet.sectionTitle
                          && (locale !== "km" || isCommunityEntry || KHMER_SCRIPT_PATTERN.test(snippet.localizedContext)) ? (
                            <span className="archive-search__description-context">
                              {snippet.localizedContext}
                            </span>
                          ) : null}
                        <p lang={KHMER_SCRIPT_PATTERN.test(snippet.localizedText) ? "km" : "en"}>
                          <HighlightedTitle
                            title={snippet.localizedText}
                            query={normalizedQuery}
                            useKhmerScript
                          />
                        </p>
                      </div>
                    ))}
                  </div>
                ) : localizedSummary ? (
                  <p lang={locale}>
                    <KhmerScriptText>{localizedSummary}</KhmerScriptText>
                  </p>
                ) : null}
                <span className="archive-search__result-action">{translate(locale, "Open record")} <span aria-hidden="true">→</span></span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
