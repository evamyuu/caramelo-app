import { useEffect, useRef, useState } from "react";

import { Checklist, type ChecklistItem } from "@/components/Checklist";
import { Screen } from "@/components/Screen";
import { speak } from "@/lib/speech";
import type { Navigate } from "@/lib/types";

interface GuideScreenProps {
  speech: string;
  url: string;
  steps: string[];
  navigate: Navigate;
  /** Called once when the user finishes the last step. */
  onFinished?: () => void;
}

/**
 * Guide mode: the user does the task in their own browser while Caramelo reads
 * each step aloud. Fallback when a site refuses the secure room.
 */
export function GuideScreen({ speech, url, steps, navigate, onFinished }: GuideScreenProps) {
  const [current, setCurrent] = useState(-1); // -1: the site is not open yet
  const finished = current >= steps.length;

  useEffect(() => {
    if (current >= 0 && current < steps.length) speak(steps[current]);
  }, [current, steps]);
  const reported = useRef(false); // effects run twice in development; report the finish once
  useEffect(() => {
    if (finished && !reported.current) {
      reported.current = true;
      onFinished?.();
    }
  }, [finished, onFinished]);

  const items: ChecklistItem[] = steps.map((label, index) => ({
    label,
    status: index < current ? "done" : index === current ? "active" : "pending",
  }));

  function openSite() {
    window.open(url, "_blank", "noopener");
    setCurrent((step) => Math.max(step, 0));
  }

  return (
    <Screen mood="gov" chip="Modo guia" title={finished ? "Muito bem!" : "Vamos fazer no seu celular."}
      speech={finished ? "Você conseguiu! Se quiser, eu conto pro Pedro." : speech}
      hint={["Eu falo cada passo", "e você toca no site"]}>
      <div className="stack">
        <div className="card"><Checklist items={items} /></div>
        {current < 0 && <button className="btn btn--primary" onClick={openSite}>Abrir o site oficial</button>}
        {current >= 0 && !finished && (
          <>
            <button className="btn btn--primary" onClick={() => setCurrent((step) => step + 1)}>Já fiz, próximo passo</button>
            <button className="btn btn--secondary" onClick={() => speak(steps[current])}>Repetir</button>
            <button className="link" onClick={openSite}>Abrir o site de novo</button>
          </>
        )}
        {finished && <button className="btn btn--primary" onClick={() => navigate("home")}>Voltar ao início</button>}
      </div>
    </Screen>
  );
}
