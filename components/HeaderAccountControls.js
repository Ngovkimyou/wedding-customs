"use client";

import Link from "next/link";

export default function HeaderAccountControls({
  user,
  isReviewer = false,
  isSigningOut,
  onSignOut,
}) {
  const username = String(user?.user_metadata?.username ?? "").trim() || "Account";

  const controls = user ? (
    <>
      {isReviewer ? (
        <Link className="site-header__auth-link site-header__auth-review" href="/review">
          <span>Review Queue</span>
        </Link>
      ) : null}
      <Link className="site-header__auth-link site-header__auth-my-entries" href="/my-entries">
        My Entries
      </Link>
      <button
        className="site-header__auth-button"
        type="button"
        onClick={onSignOut}
        disabled={isSigningOut}
        aria-label={`Log out ${username}`}
      >
        <span className="site-header__auth-username" title={username}>{username}</span>
        <span className="site-header__auth-action">
          {isSigningOut ? "Logging out" : "Log out"}
        </span>
        <span className="site-header__auth-divider" aria-hidden="true" />
      </button>
    </>
  ) : (
    <>
      <Link className="site-header__auth-link" href="/login">Log in</Link>
      <Link className="site-header__auth-link" href="/signup">Sign up</Link>
    </>
  );

  return controls;
}
