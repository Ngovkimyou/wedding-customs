"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import searchBackground from "../assets/search-background.avif";
import { normalizeSearchText } from "../lib/archive-search.mjs";
import HighlightedTitle from "./HighlightedTitle.js";
import ScrollIndicator from "./ScrollIndicator.js";

export default function ArchiveSearch({ entries = [] }) {
  const [query, setQuery] = useState("");
  const searchRef = useRef(null);
  const inputRef = useRef(null);
  const resultRefs = useRef([]);
  const normalizedQuery = normalizeSearchText(query.trim());
  const searchIndex = useMemo(
    () => entries.map((entry) => ({ ...entry, searchTitle: normalizeSearchText(entry.title) })),
    [entries],
  );
  const matches = useMemo(
    () =>
      normalizedQuery
        ? searchIndex.filter((entry) => entry.searchTitle.includes(normalizedQuery))
        : [],
    [normalizedQuery, searchIndex],
  );

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
            aria-label="Search archive titles"
            aria-controls="archive-search-results"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={handleSearchKeyDown}
            placeholder="Type a title…"
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
          <p className="archive-search__empty">No archive titles match “{query}”.</p>
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
              key={entry.id}
              ref={(element) => { resultRefs.current[index] = element; }}
              onKeyDown={(event) => handleResultKeyDown(event, index)}
            >
              <span className="archive-search__result-meta">{entry.id}</span>
              <h2><HighlightedTitle title={entry.title} query={normalizedQuery} /></h2>
              {entry.summary ? <p>{entry.summary}</p> : null}
              <span className="archive-search__result-action">Open record <span aria-hidden="true">→</span></span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
