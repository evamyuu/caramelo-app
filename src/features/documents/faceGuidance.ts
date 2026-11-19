/**
 * Pure rules for facial-biometrics practice, kept separate from the camera for testing.
 *
 * Official apps (gov.br, Meu INSS proof of life, banks, CNH do Brasil) run their own
 * face check. Caramelo cannot do it for the user; it rehearses what those checks
 * ask for (framing, light, and liveness gestures) and then guides the real one.
 */

export interface FaceBox { x: number; y: number; width: number; height: number }
export interface Guidance { ok: boolean; message: string }

const MIN_FACE_RATIO = 0.3;
const MAX_FACE_RATIO = 0.62;
const CENTER_TOLERANCE = 0.12;

/**
 * @param faces detected boxes in frame pixels
 * @returns the single instruction Caramelo should say next
 */
export function guideFace(faces: FaceBox[], frameWidth: number, frameHeight: number): Guidance {
  if (faces.length === 0) return { ok: false, message: "Não estou vendo o seu rosto. Vire o celular para você." };
  if (faces.length > 1) return { ok: false, message: "Precisa aparecer só você na foto." };
  const [face] = faces;
  const ratio = face.width / frameWidth;
  if (ratio < MIN_FACE_RATIO) return { ok: false, message: "Chegue o celular mais perto do rosto." };
  if (ratio > MAX_FACE_RATIO) return { ok: false, message: "Afaste um pouco o celular." };
  const offsetX = (face.x + face.width / 2) / frameWidth - 0.5;
  const offsetY = (face.y + face.height / 2) / frameHeight - 0.5;
  // The preview is mirrored, so the spoken direction matches what the user sees.
  if (Math.abs(offsetX) > CENTER_TOLERANCE) return { ok: false, message: offsetX > 0 ? "Vire o celular um pouco para a esquerda." : "Vire o celular um pouco para a direita." };
  if (Math.abs(offsetY) > CENTER_TOLERANCE) return { ok: false, message: offsetY > 0 ? "Abaixe um pouco o celular." : "Levante um pouco o celular." };
  return { ok: true, message: "Assim está ótimo. Fique parada." };
}

/** Mean luminance (0-255) of the face area and of the whole frame. */
export interface Lighting { face: number; frame: number }

const DARK_FACE = 70;
const BRIGHT_FACE = 225;
const BACKLIGHT_GAP = 45;

/** The light problem that most often fails a face check, or ``null`` when the light is good. */
export function guideLight({ face, frame }: Lighting): Guidance | null {
  if (face < DARK_FACE) return { ok: false, message: "Está escuro. Acenda a luz ou chegue perto de uma janela." };
  if (frame - face > BACKLIGHT_GAP) return { ok: false, message: "A luz está atrás de você. Fique de frente para a claridade." };
  if (face > BRIGHT_FACE) return { ok: false, message: "Tem luz demais no rosto. Saia um pouco do sol." };
  return null;
}

/** Liveness gestures official apps commonly ask for. */
export type Gesture = "blink" | "smile" | "turn";

export const GESTURES: { gesture: Gesture; ask: string }[] = [
  { gesture: "blink", ask: "Agora pisque os olhos devagar." },
  { gesture: "smile", ask: "Agora dê um sorriso." },
  { gesture: "turn", ask: "Agora vire o rosto devagar para um lado." },
];

/** Scores from the face landmarker: blink and smile 0 to 1, yaw -1 (one side) to 1 (other side). */
export interface FaceSignals { blink: number; smile: number; yaw: number }

const BLINK_SCORE = 0.5;
const SMILE_SCORE = 0.5;
const TURN_YAW = 0.25;

export function gestureDone(gesture: Gesture, signals: FaceSignals): boolean {
  if (gesture === "blink") return signals.blink > BLINK_SCORE;
  if (gesture === "smile") return signals.smile > SMILE_SCORE;
  return Math.abs(signals.yaw) > TURN_YAW;
}

/** Yaw from three landmarks (x in 0-1): the nose tip between the two sides of the face. */
export function yawFrom(noseX: number, leftX: number, rightX: number): number {
  const span = rightX - leftX;
  if (Math.abs(span) < 1e-6) return 0;
  return ((noseX - leftX) / span - 0.5) * 2;
}
