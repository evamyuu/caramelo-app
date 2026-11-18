import type { AvatarState } from "@/lib/types";

const LOOK: Record<AvatarState, { background: string; ring: string }> = {
  calm: { background: "#E3F1E6", ring: "#1F6B3A" },
  alert: { background: "#FFF1C9", ring: "#F2B53A" },
  scam: { background: "#FBE3E0", ring: "#B3261E" },
};

/** Caramelo's face. Paths exported from the Figma component set "Caramelo (avatar)". */
export function Avatar({ state = "calm" }: { state?: AvatarState }) {
  const { background, ring } = LOOK[state];
  const earsUp = state !== "calm";
  return (
    <svg viewBox="0 0 120 120" role="img" aria-label="Caramelo">
      <circle cx="60" cy="60" r="60" fill={background} />
      {earsUp ? (
        <path d="M30 50 36 20 54 40ZM90 50 84 20 66 40Z" fill="#9A5420" />
      ) : (
        <path d="M34 38C20 42 16 64 24 76 32 70 38 56 44 44ZM86 38C98 42 104 60 98 70 92 64 84 54 78 44Z" fill="#9A5420" />
      )}
      <ellipse cx="60" cy="64" rx="33" ry="31" fill="#D9893F" />
      <ellipse cx="60" cy="80" rx="17" ry="12.5" fill="#F3D7AE" />
      <circle cx="47" cy="61" r="3.6" fill="#2B1D14" />
      <circle cx="73" cy="61" r="3.6" fill="#2B1D14" />
      <ellipse cx="60" cy="74" rx="5.6" ry="4" fill="#2B1D14" />
      {state === "calm" && <path d="M53 82q7 7 14 0" stroke="#2B1D14" strokeWidth="2.4" strokeLinecap="round" fill="none" />}
      {state === "alert" && <path d="M55 84h10" stroke="#2B1D14" strokeWidth="2.4" strokeLinecap="round" />}
      {state === "scam" && <path d="M53 82q7 12 14 0Z" fill="#7A2E1C" />}
      <path d="M33 92q27 13 54 0v8q-27 13-54 0Z" fill="#2F6B3F" />
      <circle cx="60" cy="108" r="6.5" fill="#FBF6EE" />
      <path d="M60 104l4 1.5v3c0 2.5-4 4-4 4s-4-1.5-4-4v-3Z" fill="#2F6B3F" />
      <circle cx="60" cy="60" r="57" fill="none" stroke={ring} strokeWidth="6" />
    </svg>
  );
}
