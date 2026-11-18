import { useState } from "react";

import { Screen } from "@/components/Screen";
import { useCamera } from "@/hooks/useCamera";
import { speak } from "@/lib/speech";
import type { Navigate } from "@/lib/types";

const MIN_WORD_LENGTH = 4;
const MAX_WORDS_READ = 8;
const DISCLAIMER = "Eu só leio o que está escrito. Dose e horário, quem decide é o seu médico.";

/** Keep the legible words of an OCR result, in reading order. */
export function legibleWords(text: string): string[] {
  return text.split(/\s+/).filter((word) => /^[\p{L}\d.,/%-]+$/u.test(word) && word.length >= MIN_WORD_LENGTH).slice(0, MAX_WORDS_READ);
}

/**
 * Reads a medicine label aloud with on-device OCR. It never interprets dosage:
 * health guidance stays with a professional.
 */
export function MedicineScreen({ navigate }: { navigate: Navigate }) {
  const { videoRef, error } = useCamera("environment");
  const [status, setStatus] = useState<"idle" | "reading" | "done">("idle");
  const [words, setWords] = useState<string[]>([]);

  async function readLabel() {
    const video = videoRef.current;
    if (!video) return;
    setStatus("reading");
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0);
    const { recognize } = await import("tesseract.js"); // loaded on demand: large dependency
    const result = await recognize(canvas, "por");
    const found = legibleWords(result.data.text);
    setWords(found);
    setStatus("done");
    speak(found.length ? `Na caixa está escrito: ${found.join(" ")}. ${DISCLAIMER}` : "Não consegui ler. Chegue mais perto e tente de novo.");
  }

  const speech = error ? "Preciso que você libere a câmera para eu ler a caixa."
    : status === "reading" ? "Lendo a caixa…"
    : status === "done" ? (words.length ? DISCLAIMER : "Não consegui ler. Chegue mais perto e tente de novo.")
    : "Aponte a câmera para o nome na caixa.";

  return (
    <Screen mood="calm" chip="Remédios · próximo às 14h" title="Qual é o remédio?" speech={speech}
      hint={["A leitura acontece", "no seu celular"]}>
      <video ref={videoRef} className="camera" playsInline muted />
      <div className="stack">
        {words.length > 0 && <div className="card"><div className="card__label">Na caixa está escrito</div>{words.join(" ")}</div>}
        <button className="btn btn--primary" disabled={status === "reading"} onClick={readLabel}>Ler a caixa</button>
        <button className="link" onClick={() => navigate("apps")}>Voltar</button>
      </div>
    </Screen>
  );
}
