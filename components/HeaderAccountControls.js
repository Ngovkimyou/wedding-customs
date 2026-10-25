"use client";

import Link from "next/link";

export default function HeaderAccountControls({
  user,
  isSigningOut,
  onSignOut,
  mobile = false,
}) {
  const placementClass = mobile ? "site-header__auth--mobile" : "site-header__auth--desktop";

  if (user) {
    return (
      <div
        className={`site-header__auth ${placementClass} site-header__auth--user`}
        role="group"
        aria-label="Account"
      >
        <Link className="site-header__auth-link site-header__auth-my-entries" href="/my-entries">
          My Entries
        </Link>
        <button
          className="site-header__auth-button"
          type="button"
          onClick={onSignOut}
          disabled={isSigningOut}
          aria-label={`Log out ${user.email}`}
        >
          <span className="site-header__auth-email" title={user.email}>{user.email}</span>
          <span className="site-header__auth-action">
            {isSigningOut ? "Logging out" : "Log out"}
          </span>
          <span className="site-header__auth-divider" aria-hidden="true" />
        </button>
      </div>
    );
  }

  return (
    <div className={`site-header__auth ${placementClass}`} role="group" aria-label="Account">
      <Link className="site-header__auth-link" href="/login">Log in</Link>
      <Link className="site-header__auth-link" href="/signup">Sign up</Link>
    </div>
  );
}
