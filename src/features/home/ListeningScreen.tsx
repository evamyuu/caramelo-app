import { useEffect, useState } from "react";

import { Avatar } from "@/components/Avatar";
import { Screen } from "@/components/Screen";
import { chat } from "@/lib/api";
import { listenOnce, speak } from "@/lib/speech";
import type { Navigate, ScreenName } from "@/lib/types";

/** Spoken keywords mapped to screens. First match wins. */
const INTENTS: [RegExp, ScreenName][] = [
  [/whats|mensag|link/, "message"],
  [/selfie|documento|identidade/, "selfie"],
  [/rem[eé]dio/, "medicine"],
  [/banco|saldo|pix/, "bank"],
  [/liga/, "call"],
  [/inss|aposentadoria|imposto|restitui|junto/, "cobrowse"],
  [/aplicativo|app/, "apps"],
];
const WAVE_HEIGHT_DELAYS = [0, 0.15, 0.3, 0.45, 0.6, 0.45, 0.3, 0.15, 0, 0.15, 0.3, 0.45, 0.6, 0.45, 0.3];

export function ListeningScreen({ navigate }: { navigate: Navigate }) {
  const [transcript, setTranscript] = useState("");
  const [reply, setReply] = useState("");

  useEffect(() => {
    const stop = listenOnce(
      async (text) => {
        setTranscript(text);
        const target = INTENTS.find(([pattern]) => pattern.test(text.toLowerCase()))?.[1];
        if (target) return navigate(target);
        const answer = (await chat(text)).speech;
        setReply(answer);
        speak(answer);
      },
      () => setReply("Não consegui te ouvir. Toque em mim para tentar de novo."),
    );
    if (!stop) setReply("Este navegador não tem reconhecimento de voz. Use o Chrome.");
    return () => stop?.();
  }, [navigate]);

  return (
    <Screen
      mood="listening" chip="Ouvindo você" title="Pode falar, Maria." speech={reply}
      hint={["Diga, por exemplo:", "“Abre o WhatsApp”"]}
    >
      <div className="listening"><div className="listening__rings"><div><Avatar /></div></div></div>
      <div className="wave">{WAVE_HEIGHT_DELAYS.map((delay, i) => <i key={i} style={{ animationDelay: `${delay}s` }} />)}</div>
      <div className="stack">
        {transcript && <div className="card"><div className="card__label">Você disse</div>“{transcript}”</div>}
        <button className="btn btn--secondary" onClick={() => navigate("home")}>Toque para parar</button>
      </div>
    </Screen>
  );
}
