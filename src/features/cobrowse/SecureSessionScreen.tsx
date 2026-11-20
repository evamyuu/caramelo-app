import { useEffect, useRef, useState } from "react";

import { Checklist, type ChecklistItem } from "@/components/Checklist";
import { Screen } from "@/components/Screen";
import type { Gesture } from "@/features/documents/faceGuidance";
import { useFaceCheck } from "@/features/documents/useFaceCheck";
import { API_URL, completeRoutine, createRoutine, recordActivity } from "@/lib/api";
import type { Navigate, Routine, TaskIntent } from "@/lib/types";

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
  {
    title: "Fazer minha prova de vida (site de teste)",
    task: "Fazer a minha prova de vida",
    url: `${API_URL}/demo/service/`,
    scriptedPlan: ["entrar", "prova de vida", "enviar"],
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
export function SecureSessionScreen({ navigate, intent }: { navigate: Navigate; intent?: TaskIntent }) {
  const session = useSecureSession();
  const { state } = session;
  // A routine (or a voice request) can arrive with its task already chosen.
  const options: Task[] = intent ? [{ ...intent, scriptedPlan: [] }, ...TASKS] : TASKS;
  const [chosen, setChosen] = useState<Task>(options[0]);
  const [running, setRunning] = useState<Task | null>(null);
  const [suggestion, setSuggestion] = useState<Routine | null>(null);
  const [learned, setLearned] = useState(false);
  const [customUrl, setCustomUrl] = useState("");
  const [customTask, setCustomTask] = useState("");

  const succeeded = state.phase === "done" && state.success;
  const reported = useRef(false); // effects run twice in development; report each task once
  const reportCompletion = () => {
    if (reported.current) return;
    reported.current = true;
    taskCompleted(running, intent, setSuggestion);
  };
  useEffect(() => {
    if (succeeded) reportCompletion();
  });

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
          {options.map((option) => (
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
          <button className="btn btn--primary" onClick={() => { setRunning(task); session.start(task.task, task.url, task.scriptedPlan); }}>
            Pode começar
          </button>
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

  if (state.phase === "biometric") {
    return <LiveFaceCheck gestures={state.gestures} onDone={session.sendFace} onGuide={session.requestGuide} />;
  }

  if (state.phase === "guide" && state.guide) {
    return <GuideScreen speech={state.speech} url={state.guide.url} steps={state.guide.steps} navigate={navigate}
      onFinished={reportCompletion} />;
  }

  if (state.phase === "done") {
    return (
      <Screen mood={state.success ? "success" : "calm"} chip={state.success ? "Tarefa concluída" : "Sala segura fechada"}
        title={state.success ? "Pronto!" : "Parei por aqui."} speech={state.speech}
        hint={["A sala segura foi apagada.", "Nada ficou guardado"]}>
        <div className="stack">
          <LearnedRoutine suggestion={suggestion} learned={learned} onAccept={() => {
            if (suggestion) createRoutine({ suggestion }).then(() => setLearned(true)).catch(() => undefined);
          }} />
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

/**
 * The site asked for a face photo: Caramelo stays with the person on their own camera,
 * one instruction at a time, and hands the photo to the site only when everything passed.
 */
function LiveFaceCheck({ gestures, onDone, onGuide }: { gestures: Gesture[]; onDone: (photo: string | null) => void; onGuide: () => void }) {
  const check = useFaceCheck(gestures, onDone);
  return (
    <Screen mood={check.guidance.ok ? "success" : "consent"} avatar={check.guidance.ok ? "calm" : "alert"}
      chip="Biometria · ao vivo com você" title={check.gesturing ? "Agora o gesto." : "Rosto no lugar."} speech={check.message}
      hint={["A foto vai só para o site.", "Eu não guardo"]}>
      <video ref={check.videoRef} className="camera camera--mirrored" playsInline muted />
      <div className="stack">
        <div className="card"><Checklist items={check.items} /></div>
        <button className="link" onClick={() => onDone(null)}>Parar por aqui</button>
        <button className="link" onClick={onGuide}>Prefiro fazer no meu celular</button>
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

/**
 * A task was finished (in the secure room or in guide mode): mark its routine as done
 * and tell Caramelo, which may answer with a routine it learned from repeated use.
 */
function taskCompleted(task: Task | null, intent: TaskIntent | undefined, onSuggestion: (routine: Routine | null) => void) {
  if (intent?.routineId) completeRoutine(intent.routineId).catch(() => undefined);
  if (task && !task.url.includes("/demo/")) {
    recordActivity(task.task, task.url).then(({ suggestion }) => onSuggestion(suggestion)).catch(() => undefined);
  }
}

function LearnedRoutine({ suggestion, learned, onAccept }: { suggestion: Routine | null; learned: boolean; onAccept: () => void }) {
  if (!suggestion) return null;
  return (
    <div className="card">
      <div className="card__label card__label--accent">Aprendi com você</div>
      {learned ? <p>Combinado. Eu cuido disso {suggestion.schedule}.</p> : (
        <>
          <p>Você já fez isso antes nessa época. Quer que eu cuide disso {suggestion.schedule}?</p>
          <button className="btn btn--primary routine__accept" onClick={onAccept}>Sim, pode cuidar</button>
        </>
      )}
    </div>
  );
}
