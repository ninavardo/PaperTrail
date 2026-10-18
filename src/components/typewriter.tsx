"use client";

import { useEffect, useState } from "react";

export const TYPE_INTERVAL_MS = 22;

function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Types the text out one character at a time. Screen readers get the full text at once;
 * the untyped remainder is laid out invisibly so the block does not reflow while typing.
 */
export function Typewriter({ text, animate }: { text: string; animate: boolean }) {
  const [count, setCount] = useState(() => (animate && !prefersReducedMotion() ? 0 : text.length));

  useEffect(() => {
    if (count >= text.length) return;
    const id = window.setInterval(() => {
      setCount((c) => {
        if (c + 1 >= text.length) window.clearInterval(id);
        return Math.min(c + 1, text.length);
      });
    }, TYPE_INTERVAL_MS);
    return () => window.clearInterval(id);
    // Start once; the interval drives itself to completion.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  return (
    <>
      <span aria-hidden="true">
        {text.slice(0, count)}
        <span className="invisible">{text.slice(count)}</span>
      </span>
      <span className="sr-only-text">{text}</span>
    </>
  );
}
