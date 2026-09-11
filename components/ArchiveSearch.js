"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import searchBackground from "../assets/search-background.avif";
import {
  getArchiveDescriptionSnippets,
  getArchiveDescriptionText,
  normalizeSearchText,
} from "../lib/archive-search.mjs";
import HighlightedTitle from "./HighlightedTitle.js";
import KhmerScriptText from "./KhmerScriptText.js";
import ScrollIndicator from "./ScrollIndicator.js";

export default function ArchiveSearch({ entries = [] }) {
  const [query, setQuery] = useState("");
  const searchRef = useRef(null);
  const inputRef = useRef(null);
  const resultRefs = useRef([]);
  const normalizedQuery = normalizeSearchText(query);
  const displayQuery = query.trim().replace(/\s+/gu, " ");
  const searchIndex = useMemo(
    () => entries.map((entry) => ({
      ...entry,
      searchTitle: normalizeSearchText(entry.title),
      searchKhmerTitle: normalizeSearchText(entry.khmerTitle),
      searchDescription: normalizeSearchText(getArchiveDescriptionText(entry)),
    })),
    [entries],
  );
  const matches = useMemo(() => {
    if (!normalizedQuery) {
      return [];
    }

    return searchIndex.flatMap((entry) => {
      const titleMatches = entry.searchTitle.includes(normalizedQuery);
      const khmerTitleMatches = entry.searchKhmerTitle.includes(normalizedQuery);
      const descriptionMatches = entry.searchDescription.includes(normalizedQuery);

      if (!titleMatches && !khmerTitleMatches && !descriptionMatches) {
        return [];
      }

      return [{
        ...entry,
        descriptionSnippets: descriptionMatches
          ? getArchiveDescriptionSnippets(entry, normalizedQuery)
          : [],
      }];
    });
  }, [normalizedQuery, searchIndex]);

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

  return (
    <section className="archive-search" ref={searchRef} aria-labelledby="archive-search-title">
      <ScrollIndicator scrollRef={searchRef} className="archive-search__scrollbar" />
      <div className="archive-search__inner">
        <p className="eyebrow">Explore the collection</p>
        <h1 id="archive-search-title">Search the archive</h1>
        <div className="archive-search__input-wrap">
          <span className="archive-search__input-icon" aria-hidden="true" />
          <input
            ref={inputRef}
            id="archive-search-input"
            className="archive-search__input"
            type="search"
            aria-label="Search archive titles and descriptions"
            aria-controls="archive-search-results"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={handleSearchKeyDown}
            placeholder="Type a title or phrase…"
            autoComplete="off"
            autoFocus
          />
          {query ? (
            <button className="archive-search__clear" type="button" onClick={clearSearch}>
              Clear
            </button>
          ) : null}
        </div>
        <p className="archive-search__status" role="status">
          {normalizedQuery
            ? `${matches.length} ${matches.length === 1 ? "record" : "records"} found`
            : "Start typing to search the archive."}
        </p>
        {normalizedQuery && matches.length === 0 ? (
          <p className="archive-search__empty">No match found for “{displayQuery}”.</p>
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
          {matches.map((entry, index) => (
            <Link
              className="archive-search__result ornate-frame"
              href={`/archive/${entry.slug}?from=search`}
              prefetch={true}
              key={entry.id}
              ref={(element) => { resultRefs.current[index] = element; }}
              onKeyDown={(event) => handleResultKeyDown(event, index)}
            >
              <span className="archive-search__result-meta">{entry.id}</span>
              <h2><HighlightedTitle title={entry.title} query={normalizedQuery} /></h2>
              {entry.khmerTitle ? (
                <p className="archive-search__result-khmer-title">
                  <HighlightedTitle title={entry.khmerTitle} query={normalizedQuery} />
                </p>
              ) : null}
              {entry.descriptionSnippets?.length ? (
                <div className="archive-search__description-matches">
                  {entry.descriptionSnippets.map((snippet, snippetIndex) => (
                    <div className="archive-search__description-match" key={`${snippet.sectionTitle}-${snippetIndex}`}>
                      {snippet.sectionTitle ? (
                        <span className="archive-search__description-context">
                          {snippet.sectionTitle}
                        </span>
                      ) : null}
                      <p>
                        <HighlightedTitle
                          title={snippet.text}
                          query={normalizedQuery}
                          useKhmerScript
                        />
                      </p>
                    </div>
                  ))}
                </div>
              ) : entry.summary ? (
                <p><KhmerScriptText>{entry.summary}</KhmerScriptText></p>
              ) : null}
              <span className="archive-search__result-action">Open record <span aria-hidden="true">→</span></span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
