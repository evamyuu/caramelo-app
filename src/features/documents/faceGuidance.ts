/** Pure framing rules for the guided selfie, kept separate from the camera for testing. */

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
