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

    router.replace("/signup");
  };

  useEffect(() => {
    if (!isAuthPath(pathname)) {
      return;
    }

    isSigningOutRef.current = false;
    setIsSigningOut(false);
    setUser(null);
  }, [pathname]);

  useEffect(() => {
    if (!isSigningOut || isAuthPath(pathname)) {
      return undefined;
    }

    const blockedElements = [
      document.querySelector("[data-site-header]"),
      document.querySelector("main"),
    ].filter(Boolean);
    const previousInertValues = blockedElements.map((element) => element.inert);

    blockedElements.forEach((element) => {
      element.inert = true;
    });

    return () => {
      blockedElements.forEach((element, index) => {
        element.inert = previousInertValues[index];
      });
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
