"use client";

import { useRef } from "react";
import ScrollIndicator from "./ScrollIndicator.js";

export default function AboutPageShell({ children }) {
  const shellRef = useRef(null);

  return (
    <div className="about-page-shell" ref={shellRef}>
      {children}
      <ScrollIndicator scrollRef={shellRef} className="about-page__scrollbar" />
    </div>
  );
}
