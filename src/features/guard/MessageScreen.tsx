import { useState } from "react";

import { Checklist } from "@/components/Checklist";
import { Screen } from "@/components/Screen";
import { API_URL, scanLink } from "@/lib/api";
import { speak } from "@/lib/speech";
import type { LinkScanReport, Navigate } from "@/lib/types";

/** Clearly fictitious phishing page served by caramelo-api for the demo. */
const SUSPICIOUS_URL = `${API_URL}/demo/phishing/`;
const SCAN_ERROR = "Não consegui testar o link agora. Na dúvida, não abre.";

type Phase = { name: "message" } | { name: "scanning" } | { name: "result"; report: LinkScanReport } | { name: "error" };

/** A message with a link, then Caramelo's verdict after opening it in an isolated browser. */
export function MessageScreen({ navigate }: { navigate: Navigate }) {
  const [phase, setPhase] = useState<Phase>({ name: "message" });

  async function testLink() {
    setPhase({ name: "scanning" });
    try {
      const report = await scanLink(SUSPICIOUS_URL);
      speak(report.speech);
      setPhase({ name: "result", report });
    } catch {
      setPhase({ name: "error" });
    }
  }

  if (phase.name === "result") return <LinkResult report={phase.report} navigate={navigate} />;

  const scanning = phase.name === "scanning";
  return (
    <Screen
      mood="calm" avatar="alert" chip="WhatsApp · número desconhecido" title="Chegou um link."
      speech={phase.name === "error" ? SCAN_ERROR : scanning
        ? "Estou abrindo o link numa sala isolada, longe do seu celular."
        : "Antes de você abrir, eu testo numa sala isolada."}
      hint={["Não toque no link.", "Deixa que eu abro primeiro"]}
    >
      <div className="stack">
        <div className="card">
          <div className="card__label">Mensagem</div>
          Seu benefício foi bloqueado. Regularize hoje para não perder: <u>gov-beneficio.example/regularizar</u>
        </div>
        <button className="btn btn--primary" onClick={testLink} disabled={scanning}>
          {scanning ? "Testando…" : "Testar o link"}
        </button>
        <button className="link" onClick={() => navigate("apps")}>Voltar</button>
      </div>
    </Screen>
  );
}

function LinkResult({ report, navigate }: { report: LinkScanReport; navigate: Navigate }) {
  const dangerous = report.verdict === "scam" || report.verdict === "caution";
  return (
    <Screen
      mood={dangerous ? "scam" : "success"} avatar={dangerous ? "scam" : "calm"}
      chip="Testei o link numa sala isolada"
      title={dangerous ? "Não abre esse link, Maria." : "Esse link parece seguro."}
      speech={report.speech}
      hint={dangerous ? ["Fica tranquila,", "eu bloqueei pra você."] : ["Pode abrir,", "eu fico de olho."]}
    >
      <div className="stack">
        {report.findings.length > 0 && (
          <div className="card">
            <div className="card__label card__label--accent">O que eu vi lá dentro</div>
            <Checklist items={report.findings.map((label) => ({ label, status: "bad" as const }))} />
          </div>
        )}
        <button className="btn btn--primary" onClick={() => navigate("home")}>Avisar o Pedro</button>
        <button className="link" onClick={() => navigate("home")}>Apagar a mensagem</button>
      </div>
    </Screen>
  );
}
