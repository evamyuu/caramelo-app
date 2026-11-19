import type { MouseEvent } from "react";

import { REMOTE_VIEWPORT } from "./useSecureSession";

interface LiveViewProps {
  frame: string | null;
  url: string;
  /** When set, taps on the image are forwarded in remote viewport coordinates. */
  onTap?: (x: number, y: number) => void;
  /** Shorter picture, used when action buttons must stay on screen. */
  compact?: boolean;
}

/** Live picture of the remote browser, with its address bar always visible. */
export function LiveView({ frame, url, onTap, compact }: LiveViewProps) {
  function handleClick(event: MouseEvent<HTMLImageElement>) {
    // The picture keeps the remote width and is anchored at the top (a compact view
    // crops the bottom), so one scale from the width maps both axes.
    const box = event.currentTarget.getBoundingClientRect();
    const scale = REMOTE_VIEWPORT.width / box.width;
    onTap?.(Math.round((event.clientX - box.left) * scale), Math.round((event.clientY - box.top) * scale));
  }
  return (
    <div className={`live-view${compact ? " live-view--compact" : ""}`}>
      <div className="live-view__url">{url.replace(/^https?:\/\//, "") || "abrindo…"}</div>
      {frame && <img src={frame} alt="Site aberto na sala segura" onClick={onTap ? handleClick : undefined} />}
    </div>
  );
}
