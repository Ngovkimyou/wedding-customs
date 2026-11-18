"use client";

import Link from "next/link";
import { translate } from "../lib/locale.js";
import { useLocale } from "./LocaleProvider.js";

export default function HeaderAccountControls({
  user,
  isReviewer = false,
  isSigningOut,
  onSignOut,
}) {
  const { locale } = useLocale();
  const username = String(user?.user_metadata?.username ?? "").trim() || translate(locale, "Account");

  const controls = user ? (
    <>
      {isReviewer ? (
        <Link className="site-header__auth-link site-header__auth-review" href="/review">
          <span>{translate(locale, "Review Queue")}</span>
        </Link>
      ) : null}
      <Link className="site-header__auth-link site-header__auth-my-entries" href="/my-entries">
        {translate(locale, "My Entries")}
      </Link>
      <button
        className="site-header__auth-button"
        type="button"
        onClick={onSignOut}
        disabled={isSigningOut}
        aria-label={`${translate(locale, "Log out")} ${username}`}
      >
        <span className="site-header__auth-username" title={username}>{username}</span>
        <span className="site-header__auth-action">
          {translate(locale, isSigningOut ? "Logging out" : "Log out")}
        </span>
        <span className="site-header__auth-divider" aria-hidden="true" />
      </button>
    </>
  ) : (
    <>
      <Link className="site-header__auth-link" href="/login">{translate(locale, "Log in")}</Link>
      <Link className="site-header__auth-link" href="/signup">{translate(locale, "Sign up")}</Link>
    </>
  );

  return controls;
}
