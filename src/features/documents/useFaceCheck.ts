import { FaceLandmarker, FilesetResolver, type NormalizedLandmark } from "@mediapipe/tasks-vision";
import { useEffect, useRef, useState } from "react";

import type { ChecklistItem } from "@/components/Checklist";
import { useCamera } from "@/hooks/useCamera";
import { speak } from "@/lib/speech";

import { type FaceSignals, type Gesture, GESTURES, gestureDone, guideFace, guideLight, type Guidance, yawFrom } from "./faceGuidance";

const WASM_URL = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm";
const MODEL_URL = "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";
const DETECTION_INTERVAL_MS = 250;
const STEADY_FRAMES = 5; // about a second well framed and lit before the gestures start
const PHOTO_WIDTH = 480;
const NOSE_TIP = 1;
const FACE_LEFT = 234;
const FACE_RIGHT = 454;
const GESTURE_LABEL: Record<Gesture, string> = { blink: "Piscar", smile: "Sorrir", turn: "Virar o rosto" };

/**
 * Live face check on the device camera: Caramelo speaks one instruction at a time
 * (framing, then light, then each liveness gesture) until everything is done.
 *
 * @param gestures liveness gestures to ask for, in order
 * @param onDone called once at the end with a frontal photo (JPEG, base64) taken while the
 *   face was well framed and lit. The photo stays in memory and is handed only to the caller.
 */
export function useFaceCheck(gestures: Gesture[], onDone: (photo: string | null) => void) {
  const { videoRef, ready, error } = useCamera("user");
  const [guidance, setGuidance] = useState<Guidance>({ ok: false, message: "Abrindo a câmera. Segure o celular na altura do rosto." });
  const [step, setStep] = useState(-1); // -1: framing; then index into the gestures
  const lastSpoken = useRef("");
  const finish = useRef(onDone);
  finish.current = onDone; // the parent re-renders often (live frames); keep the detector running
  const asks = GESTURES.filter(({ gesture }) => gestures.includes(gesture));
  const key = asks.map(({ gesture }) => gesture).join(",");

  useEffect(() => {
    if (!ready) return;
    const sequence = GESTURES.filter(({ gesture }) => key.split(",").includes(gesture));
    let landmarker: FaceLandmarker | undefined;
    let timer: number | undefined;
    let cancelled = false;
    let steady = 0;
    let current = -1;
    let photo: string | null = null;
    const light = canvasOf(32, 24);

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
        if (next.ok && light) next = guideLight(lighting(light, video, boxes[0], width, height)) ?? next;

        if (current < 0) {
          steady = next.ok ? steady + 1 : 0;
          if (steady >= STEADY_FRAMES) {
            photo = snapshot(video); // neutral, frontal and well lit: the picture services expect
            current = 0;
          }
        } else if (next.ok || boxes.length === 1) {
          const signals = signalsOf(result.faceBlendshapes[0]?.categories ?? [], result.faceLandmarks[0]);
          if (gestureDone(sequence[current].gesture, signals)) current += 1;
        }
        if (current >= sequence.length) {
          window.clearInterval(timer);
          speak("Muito bem! Deu tudo certo.");
          finish.current(photo);
          return;
        }
        setStep(current);
        setGuidance(current >= 0 ? { ok: true, message: sequence[current].ask } : next);
      }, DETECTION_INTERVAL_MS);
    })().catch(() => setGuidance({ ok: false, message: "Não consegui ligar o guia da câmera." }));
    return () => { cancelled = true; window.clearInterval(timer); landmarker?.close(); };
  }, [ready, videoRef, key]);

  useEffect(() => {
    if (guidance.message === lastSpoken.current) return;
    lastSpoken.current = guidance.message;
    speak(guidance.message);
  }, [guidance]);

  const items: ChecklistItem[] = [
    { label: "Rosto no lugar e luz boa", status: step >= 0 ? "done" : "active" },
    ...asks.map(({ gesture }, index): ChecklistItem => ({
      label: GESTURE_LABEL[gesture],
      status: step > index ? "done" : step === index ? "active" : "pending",
    })),
  ];
  const message = error ? "Preciso que você libere a câmera para eu te guiar." : guidance.message;
  return { videoRef, guidance, message, items, gesturing: step >= 0 };
}

function canvasOf(width: number, height: number) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return canvas.getContext("2d", { willReadFrequently: true });
}

/** Unmirrored JPEG of the current frame, without the data-URL prefix. */
function snapshot(video: HTMLVideoElement): string | null {
  const context = canvasOf(PHOTO_WIDTH, Math.round((video.videoHeight / video.videoWidth) * PHOTO_WIDTH));
  if (!context) return null;
  context.drawImage(video, 0, 0, context.canvas.width, context.canvas.height);
  return context.canvas.toDataURL("image/jpeg", 0.85).split(",")[1] ?? null;
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
