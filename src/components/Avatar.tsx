import atento from "@/assets/caramelo/caramelo-atento.webp";
import feliz from "@/assets/caramelo/caramelo-feliz.webp";
import perigo from "@/assets/caramelo/caramelo-perigo.webp";
import type { AvatarState } from "@/lib/types";

/** One illustration per state: happy (calm), attentive (alert), danger (scam). */
const LOOK: Record<AvatarState, { src: string; label: string }> = {
  calm: { src: feliz, label: "Caramelo feliz" },
  alert: { src: atento, label: "Caramelo atento" },
  scam: { src: perigo, label: "Caramelo em alerta de perigo" },
};

/** Caramelo's face. */
export function Avatar({ state = "calm" }: { state?: AvatarState }) {
  const { src, label } = LOOK[state];
  return <img className="avatar" src={src} alt={label} width={320} height={320} draggable={false} />;
}
