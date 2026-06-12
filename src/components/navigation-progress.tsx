"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

export function NavigationProgress() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [width, setWidth] = useState(0);
  const prevPathname = useRef(pathname);
  const animRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const completeRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (pathname !== prevPathname.current) {
      // Navigation completed — snap to 100 then fade out
      setWidth(100);
      completeRef.current = setTimeout(() => {
        setVisible(false);
        setWidth(0);
      }, 300);
      prevPathname.current = pathname;
    }
  }, [pathname]);

  // Start the bar on link clicks via capture listener
  useEffect(() => {
    function onLinkClick(e: MouseEvent) {
      const target = (e.target as HTMLElement).closest("a");
      if (!target) return;
      const href = target.getAttribute("href");
      if (!href || href.startsWith("http") || href.startsWith("mailto") || href.startsWith("#")) return;

      // Same-route click — pathname won't change, so the completion effect
      // never fires. Skip showing the bar entirely.
      const targetPath = href.split("?")[0].split("#")[0];
      if (targetPath === window.location.pathname) return;

      if (animRef.current) clearTimeout(animRef.current);
      if (completeRef.current) clearTimeout(completeRef.current);

      setVisible(true);
      setWidth(0);
      // Animate to ~70% quickly, then slow down
      requestAnimationFrame(() => {
        setWidth(15);
        animRef.current = setTimeout(() => setWidth(60), 100);
        animRef.current = setTimeout(() => setWidth(75), 600);
      });

      // Safety net: if pathname never changes (same URL fallthrough, error,
      // or anything else), force the bar to fade out after 4s.
      completeRef.current = setTimeout(() => {
        setVisible(false);
        setWidth(0);
      }, 4000);
    }

    window.addEventListener("click", onLinkClick, true);
    return () => window.removeEventListener("click", onLinkClick, true);
  }, []);

  if (!visible && width === 0) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[9999] h-[2px] pointer-events-none"
      style={{ opacity: visible ? 1 : 0, transition: "opacity 200ms" }}
    >
      <div
        className="h-full bg-foreground"
        style={{
          width: `${width}%`,
          transition: width === 100
            ? "width 200ms ease-out"
            : width === 0
              ? "none"
              : "width 400ms ease-out",
        }}
      />
    </div>
  );
}
