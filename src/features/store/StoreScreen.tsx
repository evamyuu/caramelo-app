import { useState } from "react";

import { Icon } from "@/components/Icon";
import { Screen } from "@/components/Screen";
import { installedApps, markInstalled } from "@/lib/device";
import { speak } from "@/lib/speech";
import type { Navigate } from "@/lib/types";

import { type Lookup, lookupApp, OFFICIAL_APPS, type OfficialApp, storeUrl } from "./catalog";

type Step = { kind: "choose" } | Lookup | { kind: "installing"; app: OfficialApp };

/**
 * Caramelo installs apps with Maria: it checks the app is the official one,
 * warns about copies, opens the official store page and puts the app on her screen.
 */
export function StoreScreen({ navigate }: { navigate: Navigate }) {
  const [step, setStep] = useState<Step>({ kind: "choose" });
  const [asked, setAsked] = useState("");
  const installed = installedApps();
  const suggestions = OFFICIAL_APPS.filter((app) => !installed.includes(app.id)).slice(0, 4);

  function check(request: string) {
    const result = lookupApp(request);
    setStep(result);
    if (result.kind === "official") speak(`Achei. ${result.app.name} é o oficial, de ${result.app.publisher}.`);
    if (result.kind === "fake") speak(`Cuidado. ${request} não é oficial. Isso é golpe.`);
    if (result.kind === "unknown") speak("Esse eu não conheço. Melhor pedir para o Pedro olhar antes.");
  }

  function install(app: OfficialApp) {
    window.open(storeUrl(app), "_blank", "noopener");
    setStep({ kind: "installing", app });
    speak("Abri a loja oficial. Toque em Instalar e depois volte aqui.");
  }

  function finish(app: OfficialApp) {
    markInstalled(app.id);
    speak(`Pronto. Coloquei o ${app.name} na sua tela.`);
    navigate("apps");
  }

  if (step.kind === "fake") {
    return (
      <Screen mood="scam" avatar="scam" chip="Aplicativo falso" title="Esse não, Maria."
        speech={`“${step.asked}” imita o ${step.app.name}, mas não é oficial. Apps assim roubam senha e dados.`}
        hint={["Eu só instalo", "aplicativo oficial"]}>
        <div className="stack">
          <button className="btn btn--primary" onClick={() => setStep({ kind: "official", app: step.app })}>
            Ver o {step.app.name} oficial
          </button>
          <button className="btn btn--secondary" onClick={() => setStep({ kind: "choose" })}>Voltar</button>
        </div>
      </Screen>
    );
  }

  if (step.kind === "official") {
    const { app } = step;
    const already = installed.includes(app.id);
    return (
      <Screen mood="success" chip="Conferi: é o oficial" title={app.name} speech={app.purpose}
        hint={["Eu confiro antes", "de instalar"]}>
        <div className="stack">
          <div className="card store__check">
            <span className="tile__icon" style={{ background: app.color }}><Icon name={app.icon} /></span>
            <div>
              <div className="card__label card__label--accent">Aplicativo oficial</div>
              Publicado por {app.publisher}.<small>Loja oficial do Google · {app.id}</small>
            </div>
          </div>
          {already
            ? <button className="btn btn--primary" onClick={() => navigate("apps")}>Já está na sua tela</button>
            : <button className="btn btn--primary" onClick={() => install(app)}>Instalar com o Caramelo</button>}
          <button className="btn btn--secondary" onClick={() => setStep({ kind: "choose" })}>Escolher outro</button>
        </div>
      </Screen>
    );
  }

  if (step.kind === "installing") {
    return (
      <Screen mood="consent" avatar="alert" chip="Instalando" title="Toque em “Instalar”."
        speech="Abri a página oficial na loja do Google. Toque no botão verde “Instalar” e espere terminar."
        hint={["Depois volte aqui", "que eu arrumo a tela"]}>
        <div className="stack">
          <button className="btn btn--primary" onClick={() => finish(step.app)}>Pronto, instalei</button>
          <button className="link" onClick={() => install(step.app)}>Abrir a loja de novo</button>
        </div>
      </Screen>
    );
  }

  return (
    <Screen mood="calm" chip="Novo aplicativo" title="Qual app você quer?"
      speech={step.kind === "unknown"
        ? `Não conheço “${step.asked}”. Eu só instalo aplicativo oficial. Quer pedir para o Pedro olhar?`
        : "Me diga o nome. Eu confiro se é o oficial antes de instalar."}
      hint={["Eu barro", "aplicativo falso"]} onAvatarClick={() => navigate("listening")}>
      <div className="stack">
        <input className="secure-input" placeholder="Ex.: WhatsApp, Meu INSS, Fotos" value={asked}
          onChange={(event) => setAsked(event.target.value)}
          onKeyDown={(event) => { if (event.key === "Enter" && asked.trim()) check(asked.trim()); }} />
        <button className="btn btn--primary" disabled={!asked.trim()} onClick={() => check(asked.trim())}>Procurar</button>
        {!!suggestions.length && (
          <div className="tiles tiles--compact">
            {suggestions.map((app) => (
              <button key={app.id} className="tile" onClick={() => setStep({ kind: "official", app })}>
                <span className="tile__icon" style={{ background: app.color }}><Icon name={app.icon} /></span>
                <div className="tile__name">{app.name}</div>
                <div className="tile__detail">{app.purpose}</div>
              </button>
            ))}
          </div>
        )}
        <button className="link" onClick={() => navigate("apps")}>Voltar aos meus aplicativos</button>
      </div>
    </Screen>
  );
}
