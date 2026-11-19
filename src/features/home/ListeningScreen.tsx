import { useCallback, useEffect, useState } from "react";

import { Avatar } from "@/components/Avatar";
import { Screen } from "@/components/Screen";
import { type ChatAnswer, chat, createRoutine, getSources, type KnowledgeSource } from "@/lib/api";
import { listenOnce, speak } from "@/lib/speech";
import type { Navigate, ScreenName } from "@/lib/types";

/** Asking for something to happen at a time becomes a routine. Checked before screen intents. */
const ROUTINE_REQUEST = /lembr|todo dia|todos os dias|toda (segunda|ter[cç]a|quarta|quinta|sexta)|todo (s[aá]bado|domingo)/;
/** Spoken keywords mapped to screens. First match wins. */
const INTENTS: [RegExp, ScreenName][] = [
  [/rotina|agenda/, "routine"],
  [/instal|baixa|app novo|novo app/, "store"],
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
  const [answer, setAnswer] = useState<ChatAnswer | null>(null);
  const [typed, setTyped] = useState("");
  const [showSources, setShowSources] = useState(false);
  const [allSources, setAllSources] = useState<KnowledgeSource[] | null>(null);

  const handle = useCallback(async (text: string) => {
    setTranscript(text);
    setAnswer(null);
    setShowSources(false);
    const lower = text.toLowerCase();
    if (ROUTINE_REQUEST.test(lower)) {
      try {
        const routine = await createRoutine({ text });
        speak(`Combinado. ${routine.title}, ${routine.schedule}.`);
        return navigate("routine");
      } catch {
        // Not understood as a routine: answer it as a question instead.
      }
    }
    const target = INTENTS.find(([pattern]) => pattern.test(lower))?.[1];
    if (target) return navigate(target);
    const response = await chat(text).catch(() => null);
    const said = response?.speech ?? "Não consegui responder agora. Tenta de novo daqui a pouco?";
    setAnswer(response);
    setReply(said);
    speak(said);
  }, [navigate]);

  useEffect(() => {
    const stop = listenOnce(handle, () => setReply("Não consegui te ouvir. Pode escrever aqui embaixo."));
    if (!stop) setReply("Este navegador não tem reconhecimento de voz. Pode escrever aqui embaixo.");
    return () => stop?.();
  }, [handle]);

  function openAllSources() {
    getSources().then(setAllSources).catch(() => setAllSources([]));
  }

  return (
    <Screen
      mood="listening" chip="Ouvindo você" title="Pode falar, Maria." speech={reply}
      hint={["Diga, por exemplo:", "“Me lembra do remédio às 14h”"]}
    >
      <div className="listening"><div className="listening__rings"><div><Avatar /></div></div></div>
      <div className="wave">{WAVE_HEIGHT_DELAYS.map((delay, i) => <i key={i} style={{ animationDelay: `${delay}s` }} />)}</div>
      <div className="stack">
        {transcript && <div className="card"><div className="card__label">Você disse</div>“{transcript}”</div>}

        {answer?.grounded && !showSources && (
          <button className="link" onClick={() => setShowSources(true)}>De onde eu tirei isso?</button>
        )}
        {answer?.grounded && showSources && (
          <div className="card">
            <div className="card__label">Eu só respondo com informação conferida</div>
            <ul className="sources">{answer.sources.map((source) => <li key={source}>{source}</li>)}</ul>
            {allSources === null
              ? <button className="link sources__more" onClick={openAllSources}>Ver todas as minhas fontes</button>
              : (
                <ul className="sources sources--all">
                  {allSources.map((entry) => (
                    <li key={entry.source}>{entry.source}<small>{entry.titles.join(" · ")}</small></li>
                  ))}
                </ul>
              )}
          </div>
        )}

        <input className="secure-input" placeholder="Prefere escrever? Digite aqui" value={typed}
          onChange={(event) => setTyped(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && typed.trim()) {
              handle(typed.trim());
              setTyped("");
            }
          }} />
        <button className="btn btn--secondary" onClick={() => navigate("home")}>Toque para parar</button>
      </div>
    </Screen>
  );
}
