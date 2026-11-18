import { Checklist, type ChecklistItem } from "@/components/Checklist";
import { Screen } from "@/components/Screen";
import { API_URL } from "@/lib/api";
import type { Navigate } from "@/lib/types";

import { LiveView } from "./LiveView";
import { useSecureSession } from "./useSecureSession";

/** Demo task against the fictitious public-service site served by caramelo-api. */
const TASK = {
  title: "Ver minha restituição",
  url: `${API_URL}/demo/service/`,
  scriptedPlan: ["entrar", "consultar restituição"],
  plan: ["Abrir o site numa sala segura", "Você entra com a sua senha", "Eu leio o resultado pra você"],
};

/** "Faz junto": plan, live work, consent, credential handover and result. */
export function SecureSessionScreen({ navigate }: { navigate: Navigate }) {
  const session = useSecureSession();
  const { state } = session;

  if (state.phase === "plan") {
    return (
      <Screen mood="gov" chip={TASK.title} title="Vou fazer junto com você."
        speech="Eu abro o site e você vê tudo. Antes de entrar ou enviar qualquer coisa, eu peço a sua licença."
        hint={["Você pode parar", "a qualquer momento"]}>
        <div className="stack">
          <div className="card"><Checklist items={TASK.plan.map((label) => ({ label, status: "pending" as const }))} /></div>
          <button className="btn btn--primary" onClick={() => session.start(TASK.title, TASK.url, TASK.scriptedPlan)}>Pode começar</button>
          <button className="link" onClick={() => navigate("apps")}>Agora não</button>
        </div>
      </Screen>
    );
  }

  if (state.phase === "consent") {
    return (
      <Screen mood="consent" avatar="alert" chip="Sala segura · pausado" title="Preciso da sua licença." speech={state.question}
        hint={["Só continuo", "se você deixar"]}>
        <LiveView frame={state.frame} url={state.url} compact />
        <div className="stack">
          <button className="btn btn--primary" onClick={() => session.answerConsent(true)}>Pode continuar</button>
          <button className="btn btn--secondary" onClick={() => session.answerConsent(false)}>Para por aqui</button>
        </div>
      </Screen>
    );
  }

  if (state.phase === "handover") {
    return (
      <Screen mood="consent" avatar="alert" chip="Agora é com você" title="Sua senha é só sua."
        hint={["Eu não vejo", "nem guardo a sua senha"]}>
        <LiveView frame={state.frame} url={state.url} onTap={session.tap} compact />
        <div className="stack">
          {/* Uncontrolled on purpose: the value is forwarded key by key and never stored. */}
          <input className="secure-input" type="password" placeholder="Digite a sua senha aqui" autoComplete="off"
            onChange={(event) => { session.typeText(event.target.value); event.target.value = ""; }}
            onKeyDown={(event) => { if (event.key === "Backspace" || event.key === "Enter") session.pressKey(event.key); }} />
          <button className="btn btn--primary" onClick={session.finishHandover}>Pronto, pode continuar</button>
        </div>
      </Screen>
    );
  }

  if (state.phase === "done") {
    return (
      <Screen mood={state.success ? "success" : "calm"} chip={state.success ? "Tarefa concluída" : "Sala segura fechada"}
        title={state.success ? "Pronto!" : "Parei por aqui."} speech={state.speech}
        hint={["A sala segura foi apagada.", "Nada ficou guardado"]}>
        <div className="stack">
          {state.success && <button className="btn btn--primary" onClick={() => navigate("home")}>Mandar pro Pedro</button>}
          <button className="btn btn--secondary" onClick={() => navigate("home")}>Voltar ao início</button>
        </div>
      </Screen>
    );
  }

  const steps: ChecklistItem[] = [
    ...state.steps.map((label) => ({ label, status: "done" as const })),
    { label: "Trabalhando no site", status: "active", detail: "Fazendo agora…" },
  ];
  return (
    <Screen mood="success" chip="Sala segura · ao vivo" title={TASK.title} hint={["Toque para pausar", "ou diga “para”"]}
      onAvatarClick={session.stop}>
      <LiveView frame={state.frame} url={state.url} />
      <div className="stack">
        {state.speech && <div className="card"><div className="card__label card__label--accent">Caramelo diz</div>{state.speech}</div>}
        <Checklist items={steps} />
      </div>
    </Screen>
  );
}
