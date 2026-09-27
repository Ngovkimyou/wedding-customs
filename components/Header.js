"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import Navigation from "./Navigation.js";
import MusicControl from "./MusicControl.js";
import SearchControl from "./SearchControl.js";
import SiteBrand from "./SiteBrand.js";
import HeaderAccountControls from "./HeaderAccountControls.js";
import InteractionLock from "./InteractionLock.js";
import headerFrame from "../assets/header-frame.avif";
import mediumHeaderFrame from "../assets/medium-header-frame.avif";
import smallHeaderFrame from "../assets/small-header-frame.avif";
import { createClient } from "../lib/supabase/client.js";
import { isAuthPath } from "../lib/auth-routes.mjs";

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const isSigningOutRef = useRef(false);
  const signOutReleaseTimerRef = useRef(null);

  const releaseSignOutLock = () => {
    window.clearTimeout(signOutReleaseTimerRef.current);
    signOutReleaseTimerRef.current = null;
    isSigningOutRef.current = false;
    setIsSigningOut(false);
    setUser(null);
  };

  useEffect(() => {
    const supabase = createClient();
    let isMounted = true;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (isMounted && !isSigningOutRef.current) {
        setUser(session?.user ?? null);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (isMounted && !isSigningOutRef.current) {
        setUser(session?.user ?? null);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    if (isSigningOutRef.current) {
      return;
    }

    isSigningOutRef.current = true;
    setIsSigningOut(true);
    const { error } = await createClient().auth.signOut();

    if (error) {
      isSigningOutRef.current = false;
      setIsSigningOut(false);
      return;
    }

    router.replace("/");
    // Usually the pathname effect releases the lock after the route commits.
    // The timer also covers logging out while already on the home page, where
    // the pathname does not change.
    signOutReleaseTimerRef.current = window.setTimeout(releaseSignOutLock, 900);
  };

  useEffect(() => {
    if (isAuthPath(pathname)) {
      releaseSignOutLock();
      return;
    }

    if (isSigningOutRef.current && pathname === "/") {
      releaseSignOutLock();
    }
  }, [pathname]);

  useEffect(() => () => {
    window.clearTimeout(signOutReleaseTimerRef.current);
  }, []);

  useEffect(() => {
    if (!isSigningOut || isAuthPath(pathname)) {
      return undefined;
    }

    const blockedElements = [
      document.querySelector("[data-site-header]"),
      document.querySelector("main"),
    ].filter(Boolean);
    const previousInertValues = blockedElements.map((element) => element.inert);
    const root = document.documentElement;
    const body = document.body;
    const scrollY = window.scrollY;
    const previousStyles = {
      bodyOverflow: body.style.overflow,
      bodyPosition: body.style.position,
      bodyTop: body.style.top,
      bodyWidth: body.style.width,
      rootOverflow: root.style.overflow,
    };
    const preventScroll = (event) => event.preventDefault();

    blockedElements.forEach((element) => {
      element.inert = true;
    });
    body.style.overflow = "hidden";
    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.width = "100%";
    root.style.overflow = "hidden";
    document.addEventListener("wheel", preventScroll, { passive: false });
    document.addEventListener("touchmove", preventScroll, { passive: false });

    return () => {
      document.removeEventListener("wheel", preventScroll);
      document.removeEventListener("touchmove", preventScroll);
      blockedElements.forEach((element, index) => {
        element.inert = previousInertValues[index];
      });
      body.style.overflow = previousStyles.bodyOverflow;
      body.style.position = previousStyles.bodyPosition;
      body.style.top = previousStyles.bodyTop;
      body.style.width = previousStyles.bodyWidth;
      root.style.overflow = previousStyles.rootOverflow;
      window.scrollTo(0, scrollY);
    };
  }, [isSigningOut, pathname]);

  if (isAuthPath(pathname)) {
    return null;
  }

  return (
    <>
      <header className="site-header" data-site-header>
        <div className="site-header__frame">
          <picture className="site-header__art" aria-hidden="true">
            <source media="(max-width: 640px)" srcSet={smallHeaderFrame.src} />
            <source media="(max-width: 960px)" srcSet={mediumHeaderFrame.src} />
            <img src={headerFrame.src} alt="" />
          </picture>
          <div className="site-frame site-header__inner">
            <SiteBrand />
            <div className="site-header__actions">
              <SearchControl />
              <MusicControl />
              <Navigation
                accountControls={(
                  <HeaderAccountControls
                    user={user}
                    isSigningOut={isSigningOut}
                    onSignOut={handleSignOut}
                    mobile
                  />
                )}
              />
              <HeaderAccountControls
                user={user}
                isSigningOut={isSigningOut}
                onSignOut={handleSignOut}
              />
            </div>
          </div>
        </div>
      </header>
      {isSigningOut ? (
        <InteractionLock message="Signing out…" />
      ) : null}
    </>
  );
}
