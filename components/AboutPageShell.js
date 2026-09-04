"use client";

import { useEffect, useRef, useState } from "react";

export default function AboutPageShell({ children }) {
  const shellRef = useRef(null);
  const [indicator, setIndicator] = useState({ visible: false, height: 0, offset: 0 });

  useEffect(() => {
    const shell = shellRef.current;
    if (!shell) return undefined;

    const update = () => {
      const maxScroll = shell.scrollHeight - shell.clientHeight;
      const visible = maxScroll > 1;
      const trackHeight = shell.clientHeight - 16;
      const height = visible ? Math.max((shell.clientHeight / shell.scrollHeight) * trackHeight, 24) : 0;
      const offset = visible ? (shell.scrollTop / maxScroll) * Math.max(trackHeight - height, 0) : 0;
      setIndicator({ visible, height, offset });
    };

    update();
    shell.addEventListener("scroll", update, { passive: true });
    const observer = new ResizeObserver(update);
    observer.observe(shell);

    return () => {
      shell.removeEventListener("scroll", update);
      observer.disconnect();
    };
  }, []);

  return (
    <div className="about-page-shell" ref={shellRef}>
      {children}
      {indicator.visible ? (
        <div className="about-page__scrollbar" aria-hidden="true">
          <span style={{ height: `${indicator.height}px`, top: `${indicator.offset}px` }} />
        </div>
      ) : null}
    </div>
  );
}
