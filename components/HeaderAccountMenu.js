"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import chanFlowerBackdrop from "../assets/chan-flower-backdrop.avif";
import profileIcon from "../assets/icons/profile.png";
import HeaderAccountControls from "./HeaderAccountControls.js";

export default function HeaderAccountMenu({
  user,
  isReviewer,
  isSigningOut,
  onSignOut,
}) {
  const menuRef = useRef(null);
  const pathname = usePathname();

  useEffect(() => {
    menuRef.current?.removeAttribute("open");
  }, [pathname]);

  useEffect(() => {
    const closeOnOutsidePointer = (event) => {
      const menu = menuRef.current;
      if (menu?.open && !menu.contains(event.target)) {
        menu.removeAttribute("open");
      }
    };

    const closeOnEscape = (event) => {
      const menu = menuRef.current;
      if (event.key === "Escape" && menu?.open) {
        menu.removeAttribute("open");
        menu.querySelector("summary")?.focus();
      }
    };

    document.addEventListener("pointerdown", closeOnOutsidePointer);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsidePointer);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  const handleSignOut = () => {
    menuRef.current?.removeAttribute("open");
    onSignOut?.();
  };

  return (
    <details ref={menuRef} className="site-header__account-menu">
      <summary aria-label="Open account menu">
        <img
          className="site-header__account-backdrop"
          src={chanFlowerBackdrop.src}
          alt=""
          aria-hidden="true"
        />
        <img
          className="site-header__account-icon"
          src={profileIcon.src}
          alt=""
          aria-hidden="true"
        />
      </summary>
      <div className="site-header__account-menu-panel">
        <div className="site-navigation__menu-items">
          <HeaderAccountControls
            user={user}
            isReviewer={isReviewer}
            isSigningOut={isSigningOut}
            onSignOut={handleSignOut}
          />
        </div>
      </div>
    </details>
  );
}
