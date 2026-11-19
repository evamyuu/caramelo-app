import { useRef, useState } from "react";

import { Checklist, type ChecklistItem } from "@/components/Checklist";
import { Screen } from "@/components/Screen";
import { API_URL } from "@/lib/api";
import type { Navigate } from "@/lib/types";

import { GuideScreen } from "./GuideScreen";
import { LiveView } from "./LiveView";
import { type HandoverField, useSecureSession } from "./useSecureSession";

interface Task {
  title: string;
  /** What Caramelo is asked to do, in the user's words (sent to the model). */
  task: string;
  url: string;
  /** Button labels to follow when the API has no LLM configured. */
  scriptedPlan: string[];
}

const TASKS: Task[] = [
  {
    title: "Meu último pagamento do INSS",
    task: "Entrar no Meu INSS com a conta gov.br e me dizer o valor e a data do meu último pagamento.",
    url: "https://meu.inss.gov.br/",
    scriptedPlan: [],
  },
  {
    title: "Ver minha restituição (site de teste)",
    task: "Ver minha restituição",
    url: `${API_URL}/demo/service/`,
    scriptedPlan: ["entrar", "consultar restituição"],
  },
];
const PLAN = ["Abrir o site numa sala segura", "Você entra com os seus dados", "Eu leio o resultado pra você"];

/** Copy for each private field the user fills in on their own. */
const HANDOVER_COPY: Record<HandoverField, { title: string; placeholder: string; inputMode?: "numeric"; hint: [string, string] }> = {
  identity: { title: "Seu CPF é só seu.", placeholder: "Digite o seu CPF aqui", inputMode: "numeric", hint: ["Eu não vejo", "nem guardo o seu CPF"] },
  password: { title: "Sua senha é só sua.", placeholder: "Digite a sua senha aqui", hint: ["Eu não vejo", "nem guardo a sua senha"] },
  code: { title: "O código é só seu.", placeholder: "Digite o código aqui", inputMode: "numeric", hint: ["Eu não vejo", "nem guardo o código"] },
  captcha: { title: "Mostre que é você.", placeholder: "", hint: ["Toque na tela", "para resolver"] },
};

/** "Faz junto": plan, live work, consent, credential handover and result. */
export function SecureSessionScreen({ navigate }: { navigate: Navigate }) {
  const session = useSecureSession();
  const { state } = session;
  const [chosen, setChosen] = useState<Task>(TASKS[0]);
  const [customUrl, setCustomUrl] = useState("");
  const [customTask, setCustomTask] = useState("");

  if (state.phase === "plan") {
    const custom = customUrl.trim() && customTask.trim()
      ? { title: customTask.trim(), task: customTask.trim(), url: withScheme(customUrl.trim()), scriptedPlan: [] }
      : null;
    const task = custom ?? chosen;
    return (
      <Screen mood="gov" chip={task.title} title="Vou fazer junto com você."
        speech="Eu abro o site e você vê tudo. Antes de entrar ou enviar qualquer coisa, eu peço a sua licença."
        hint={["Você pode parar", "a qualquer momento"]}>
        <div className="stack">
          {TASKS.map((option) => (
            <button key={option.url} className={`btn ${!custom && option === chosen ? "btn--primary" : "btn--secondary"}`}
              onClick={() => { setChosen(option); setCustomUrl(""); setCustomTask(""); }}>
              {option.title}
            </button>
          ))}
          <input className="secure-input" placeholder="Ou: o que você quer fazer?" value={customTask}
            onChange={(event) => setCustomTask(event.target.value)} />
          <input className="secure-input" placeholder="Endereço do site (ex.: gov.br)" inputMode="url" value={customUrl}
            onChange={(event) => setCustomUrl(event.target.value)} />
          <div className="card"><Checklist items={PLAN.map((label) => ({ label, status: "pending" as const }))} /></div>
          <button className="btn btn--primary" onClick={() => session.start(task.task, task.url, task.scriptedPlan)}>Pode começar</button>
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
          <button className="link" onClick={session.requestGuide}>Prefiro fazer no meu celular</button>
        </div>
      </Screen>
    );
  }

  if (state.phase === "handover") {
    const copy = HANDOVER_COPY[state.field];
    return (
      <Screen mood="consent" avatar="alert" chip="Agora é com você" title={copy.title} hint={copy.hint}>
        {/* Full picture: the field being filled must stay visible while the user types. */}
        <LiveView frame={state.frame} url={state.url} onTap={session.tap} />
        <div className="stack">
          {state.field !== "captcha" && (
            <PrivateInput key={state.field} type={state.field === "password" ? "password" : "text"}
              placeholder={copy.placeholder} inputMode={copy.inputMode}
              onText={session.typeText} onBackspace={(count) => { for (let i = 0; i < count; i += 1) session.pressKey("Backspace"); }}
              onEnter={session.finishHandover} />
          )}
          <button className="btn btn--primary" onClick={session.finishHandover}>Pronto, pode continuar</button>
          <button className="link" onClick={session.requestGuide}>Prefiro fazer no meu celular</button>
        </div>
      </Screen>
    );
  }

  if (state.phase === "guide" && state.guide) {
    return <GuideScreen speech={state.speech} url={state.guide.url} steps={state.guide.steps} navigate={navigate} />;
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
    <Screen mood="success" chip="Sala segura · ao vivo" title="Fazendo junto com você" hint={["Toque para pausar", "ou diga “para”"]}
      onAvatarClick={session.stop}>
      <LiveView frame={state.frame} url={state.url} />
      <div className="stack">
        {state.speech && <div className="card"><div className="card__label card__label--accent">Caramelo diz</div>{state.speech}</div>}
        <Checklist items={steps} />
      </div>
    </Screen>
  );
}

/** Accept "gov.br" as well as "https://gov.br". */
function withScheme(url: string): string {
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

interface PrivateInputProps {
  type: "password" | "text";
  placeholder: string;
  inputMode?: "numeric";
  onText: (text: string) => void;
  onBackspace: (count: number) => void;
  onEnter: () => void;
}

/**
 * Field whose edits are mirrored into the remote page as keystrokes.
 * The value lives only in the DOM input (so the user sees what they typed);
 * React keeps just its length, to turn each change into added text or Backspaces.
 */
function PrivateInput({ type, placeholder, inputMode, onText, onBackspace, onEnter }: PrivateInputProps) {
  const length = useRef(0);
  return (
    <input className="secure-input" type={type} placeholder={placeholder} inputMode={inputMode}
      autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck={false} autoFocus
      onChange={(event) => {
        const input = event.target;
        const value = input.value;
        if (value.length > length.current) onText(value.slice(length.current));
        else if (value.length < length.current) onBackspace(length.current - value.length);
        length.current = value.length;
        input.setSelectionRange(value.length, value.length); // edits only at the end, like the remote field
      }}
      onKeyDown={(event) => { if (event.key === "Enter") onEnter(); }} />
  );
}
