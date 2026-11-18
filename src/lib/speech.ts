/** Browser speech synthesis and recognition (pt-BR). Both degrade silently when unsupported. */

export function speak(text: string): void {
  if (!("speechSynthesis" in window) || !text) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "pt-BR";
  utterance.rate = 0.95;
  window.speechSynthesis.speak(utterance);
}

interface Recognition {
  lang: string;
  start(): void;
  stop(): void;
  onresult: ((event: { results: { 0: { transcript: string } }[] }) => void) | null;
  onerror: (() => void) | null;
}

/**
 * Listen for one utterance.
 * @returns a stop function, or `null` when the browser has no speech recognition.
 */
export function listenOnce(onTranscript: (text: string) => void, onError: () => void): (() => void) | null {
  const scope = window as unknown as Record<string, new () => Recognition>;
  const Constructor = scope.SpeechRecognition ?? scope.webkitSpeechRecognition;
  if (!Constructor) return null;
  const recognition = new Constructor();
  recognition.lang = "pt-BR";
  recognition.onresult = (event) => onTranscript(event.results[0][0].transcript);
  recognition.onerror = onError;
  recognition.start();
  return () => recognition.stop();
}
