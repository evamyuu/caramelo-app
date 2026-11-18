import { useEffect, useState } from "react";

import { Checklist } from "@/components/Checklist";
import { Screen } from "@/components/Screen";
import { assessCall } from "@/lib/api";
import { speak } from "@/lib/speech";
import type { CallAssessment, Navigate } from "@/lib/types";

/** Signals of the simulated incoming call. Real screening needs the native Android app. */
const DEMO_CALL_SIGNALS = {
  missing_verified_origin: true,
  unknown_caller: true,
  asks_for_code_or_password: true,
  creates_urgency: true,
};
const TITLE = "Maria, espera.";
const DEMO_CALLER = "(21) 3958-0417";

export function CallScreen({ navigate }: { navigate: Navigate }) {
  const [assessment, setAssessment] = useState<CallAssessment | null>(null);

  useEffect(() => {
    assessCall(DEMO_CALL_SIGNALS).then((result) => {
      setAssessment(result);
      speak(result.speech);
    }).catch(() => setAssessment(null));
  }, []);

  return (
    <Screen
      mood="scam" avatar="scam" chip="Alerta de golpe" title={TITLE}
      speech={assessment?.speech.replace(TITLE, "").trim() ?? "Estou conferindo essa ligação."}
      hint={["Se quiser, eu aviso", "o Pedro agora"]}
    >
      <div className="stack">
        <div className="card">
          <div className="card__label">Ligando agora</div>
          <div className="caller">{DEMO_CALLER}</div>
        </div>
        {assessment && (
          <div className="card">
            <div className="card__label card__label--accent">Por que desconfiei</div>
            <Checklist items={assessment.reasons.map((label) => ({ label, status: "bad" as const }))} />
          </div>
        )}
        <button className="btn btn--primary" onClick={() => navigate("home")}>Desligar</button>
        <button className="link" onClick={() => navigate("home")}>É alguém que eu conheço</button>
      </div>
    </Screen>
  );
}
