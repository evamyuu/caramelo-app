import { FaceLandmarker, FilesetResolver, type NormalizedLandmark } from "@mediapipe/tasks-vision";
import { useEffect, useRef, useState } from "react";

import { Checklist, type ChecklistItem } from "@/components/Checklist";
import { Icon } from "@/components/Icon";
import { Screen } from "@/components/Screen";
import { launchUrl, OFFICIAL_APPS, type OfficialApp } from "@/features/store/catalog";
import { useCamera } from "@/hooks/useCamera";
import { speak } from "@/lib/speech";
import type { Navigate } from "@/lib/types";

import { type FaceSignals, GESTURES, gestureDone, guideFace, guideLight, type Guidance, yawFrom } from "./faceGuidance";

const WASM_URL = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm";
const MODEL_URL = "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";
const DETECTION_INTERVAL_MS = 250;
const STEADY_FRAMES = 5; // about a second well framed and lit before the gestures start
const NOSE_TIP = 1;
const FACE_LEFT = 234;
const FACE_RIGHT = 454;

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
  const { videoRef, ready, error } = useCamera("user");
  const [guidance, setGuidance] = useState<Guidance>({ ok: false, message: "Abrindo a câmera. Segure o celular na altura do rosto." });
  const [step, setStep] = useState(-1); // -1: framing; then index into GESTURES
  const progress = useRef({ steady: 0, step: -1 });
  const lastSpoken = useRef("");

  useEffect(() => {
    if (!ready) return;
    let landmarker: FaceLandmarker | undefined;
    let timer: number | undefined;
    let cancelled = false;
    const canvas = document.createElement("canvas");
    canvas.width = 32;
    canvas.height = 24;
    const context = canvas.getContext("2d", { willReadFrequently: true });

    (async () => {
      const vision = await FilesetResolver.forVisionTasks(WASM_URL);
      landmarker = await FaceLandmarker.createFromOptions(vision, {
        baseOptions: { modelAssetPath: MODEL_URL }, runningMode: "VIDEO", numFaces: 2, outputFaceBlendshapes: true,
      });
      if (cancelled) return landmarker.close();
      timer = window.setInterval(() => {
        const video = videoRef.current;
        if (!video || !landmarker || !video.videoWidth) return;
        const result = landmarker.detectForVideo(video, performance.now());
        const width = video.videoWidth;
        const height = video.videoHeight;
        const boxes = result.faceLandmarks.map((points) => boxOf(points, width, height));
        let next = guideFace(boxes, width, height);
        if (next.ok && context) next = guideLight(lighting(context, video, boxes[0], width, height)) ?? next;

        const state = progress.current;
        if (state.step < 0) {
          state.steady = next.ok ? state.steady + 1 : 0;
          if (state.steady >= STEADY_FRAMES) state.step = 0;
        } else if (next.ok || boxes.length === 1) {
          const signals = signalsOf(result.faceBlendshapes[0]?.categories ?? [], result.faceLandmarks[0]);
          if (gestureDone(GESTURES[state.step].gesture, signals)) state.step += 1;
        }
        if (state.step >= GESTURES.length) {
          speak("Muito bem! Treino feito.");
          window.clearInterval(timer);
          onDone();
          return;
        }
        setStep(state.step);
        setGuidance(state.step >= 0 ? { ok: true, message: GESTURES[state.step].ask } : next);
      }, DETECTION_INTERVAL_MS);
    })().catch(() => setGuidance({ ok: false, message: "Não consegui ligar o guia da câmera." }));
    return () => { cancelled = true; window.clearInterval(timer); landmarker?.close(); };
  }, [ready, videoRef, onDone]);

  useEffect(() => {
    if (guidance.message === lastSpoken.current) return;
    lastSpoken.current = guidance.message;
    speak(guidance.message);
  }, [guidance]);

  const items: ChecklistItem[] = [
    { label: "Rosto no lugar e luz boa", status: step >= 0 ? "done" : "active" },
    ...GESTURES.map(({ gesture }, index): ChecklistItem => ({
      label: { blink: "Piscar", smile: "Sorrir", turn: "Virar o rosto" }[gesture],
      status: step > index ? "done" : step === index ? "active" : "pending",
    })),
  ];

  return (
    <Screen mood={guidance.ok ? "success" : "gov"} avatar={guidance.ok ? "calm" : "alert"} chip="Treino da biometria"
      title={step >= 0 ? "Agora o gesto." : "Rosto no lugar."}
      speech={error ? "Preciso que você libere a câmera para eu te guiar." : guidance.message}
      hint={["A sua foto não sai", "do seu celular"]}>
      <video ref={videoRef} className="camera camera--mirrored" playsInline muted />
      <div className="stack">
        <div className="card"><Checklist items={items} /></div>
        <button className="link" onClick={onCancel}>Parar o treino</button>
      </div>
    </Screen>
  );
}

function boxOf(points: NormalizedLandmark[], width: number, height: number) {
  const xs = points.map((point) => point.x * width);
  const ys = points.map((point) => point.y * height);
  const x = Math.min(...xs);
  const y = Math.min(...ys);
  return { x, y, width: Math.max(...xs) - x, height: Math.max(...ys) - y };
}

/** Mean luminance of the face and of the whole frame, on a tiny downscaled copy. */
function lighting(context: CanvasRenderingContext2D, video: HTMLVideoElement, face: ReturnType<typeof boxOf>, width: number, height: number) {
  const { width: w, height: h } = context.canvas;
  context.drawImage(video, 0, 0, w, h);
  const data = context.getImageData(0, 0, w, h).data;
  const left = Math.floor((face.x / width) * w);
  const right = Math.ceil(((face.x + face.width) / width) * w);
  const top = Math.floor((face.y / height) * h);
  const bottom = Math.ceil(((face.y + face.height) / height) * h);
  let faceSum = 0, faceCount = 0, frameSum = 0;
  for (let py = 0; py < h; py += 1) {
    for (let px = 0; px < w; px += 1) {
      const i = (py * w + px) * 4;
      const luminance = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      frameSum += luminance;
      if (px >= left && px < right && py >= top && py < bottom) { faceSum += luminance; faceCount += 1; }
    }
  }
  return { face: faceCount ? faceSum / faceCount : 0, frame: frameSum / (w * h) };
}

function signalsOf(categories: { categoryName: string; score: number }[], landmarks?: NormalizedLandmark[]): FaceSignals {
  const score = (name: string) => categories.find((category) => category.categoryName === name)?.score ?? 0;
  return {
    blink: Math.min(score("eyeBlinkLeft"), score("eyeBlinkRight")),
    smile: (score("mouthSmileLeft") + score("mouthSmileRight")) / 2,
    yaw: landmarks ? yawFrom(landmarks[NOSE_TIP].x, landmarks[FACE_LEFT].x, landmarks[FACE_RIGHT].x) : 0,
  };
}
