import { useState } from "react";

import { Checklist } from "@/components/Checklist";
import { Icon } from "@/components/Icon";
import { Screen } from "@/components/Screen";
import { launchUrl, OFFICIAL_APPS, type OfficialApp } from "@/features/store/catalog";
import type { Navigate } from "@/lib/types";

import { GESTURES } from "./faceGuidance";
import { useFaceCheck } from "./useFaceCheck";

const ALL_GESTURES = GESTURES.map(({ gesture }) => gesture);

/** Services whose sign-in or proof of life uses a face check. */
const SERVICES: { app: OfficialApp; why: string }[] = [
  ["br.gov.meugovbr", "Subir o nível da conta gov.br"],
  ["br.gov.dataprev.meuinss", "Prova de vida do INSS"],
  ["br.gov.serpro.cnhe", "Carteira de motorista no celular"],
  ["br.gov.caixa.tem", "Entrar no CAIXA Tem"],
].map(([id, why]) => ({ app: OFFICIAL_APPS.find((app) => app.id === id)!, why }));

const TIPS = [
  "Luz de frente, sem janela atrás de você",
  "Sem óculos escuros, boné ou máscara",
  "Celular na altura dos olhos, com o braço esticado",
  "Siga o que o app pedir: piscar, sorrir ou virar o rosto",
];

type Phase = { kind: "choose" } | { kind: "practice"; service: OfficialApp } | { kind: "ready"; service: OfficialApp };

/**
 * Facial biometrics with Caramelo: practise the face check that official apps ask for
 * (framing, light and liveness gestures), then open the official app and follow along.
 * Detection runs on the device: no image leaves the phone (biometric data, LGPD art. 11).
 */
export function BiometricsScreen({ navigate }: { navigate: Navigate }) {
  const [phase, setPhase] = useState<Phase>({ kind: "choose" });

  if (phase.kind === "practice") {
    return <Practice onDone={() => setPhase({ kind: "ready", service: phase.service })} onCancel={() => setPhase({ kind: "choose" })} />;
  }

  if (phase.kind === "ready") {
    const { service } = phase;
    return (
      <Screen mood="success" chip="Treino feito" title="Agora no app oficial."
        speech={`Quando o ${service.name} abrir a câmera, faça igual ao treino. Eu continuo aqui.`}
        hint={["A sua foto não sai", "do seu celular"]}>
        <div className="stack">
          <div className="card"><Checklist items={TIPS.map((label) => ({ label, status: "done" as const }))} /></div>
          <button className="btn btn--primary" onClick={() => { window.location.href = launchUrl(service); }}>
            Abrir o {service.name}
          </button>
          <button className="btn btn--secondary" onClick={() => setPhase({ kind: "practice", service })}>Treinar de novo</button>
          <button className="link" onClick={() => navigate("home")}>Voltar ao início</button>
        </div>
      </Screen>
    );
  }

  return (
    <Screen mood="gov" chip="Biometria facial" title="Vamos treinar a foto do rosto."
      speech="Muitos apps pedem uma foto do rosto para confirmar que é você. A gente treina aqui antes, sem pressa."
      hint={["A sua foto não sai", "do seu celular"]} onAvatarClick={() => navigate("listening")}>
      <div className="stack">
        <div className="card__label">Para qual aplicativo?</div>
        <div className="tiles tiles--compact">
          {SERVICES.map(({ app, why }) => (
            <button key={app.id} className="tile" onClick={() => { setPhase({ kind: "practice", service: app }); }}>
              <span className="tile__icon" style={{ background: app.color }}><Icon name={app.icon} /></span>
              <div className="tile__name">{app.name}</div>
              <div className="tile__detail">{why}</div>
            </button>
          ))}
        </div>
        <button className="link" onClick={() => navigate("apps")}>Agora não</button>
      </div>
    </Screen>
  );
}

/** Camera practice: framing and light first, then each liveness gesture in turn. */
function Practice({ onDone, onCancel }: { onDone: () => void; onCancel: () => void }) {
  const check = useFaceCheck(ALL_GESTURES, () => onDone()); // practice only: the photo is dropped

  return (
    <Screen mood={check.guidance.ok ? "success" : "gov"} avatar={check.guidance.ok ? "calm" : "alert"} chip="Treino da biometria"
      title={check.gesturing ? "Agora o gesto." : "Rosto no lugar."} speech={check.message}
      hint={["A sua foto não sai", "do seu celular"]}>
      <video ref={check.videoRef} className="camera camera--mirrored" playsInline muted />
      <div className="stack">
        <div className="card"><Checklist items={check.items} /></div>
        <button className="link" onClick={onCancel}>Parar o treino</button>
      </div>
    </Screen>
  );
}
