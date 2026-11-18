import { FaceDetector, FilesetResolver } from "@mediapipe/tasks-vision";
import { useEffect, useRef, useState } from "react";

import { Screen } from "@/components/Screen";
import { useCamera } from "@/hooks/useCamera";
import { speak } from "@/lib/speech";
import type { Navigate } from "@/lib/types";

import { guideFace, type Guidance } from "./faceGuidance";

const WASM_URL = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm";
const MODEL_URL = "https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite";
const DETECTION_INTERVAL_MS = 400;
const STARTING: Guidance = { ok: false, message: "Abrindo a câmera. Segure o celular na altura do rosto." };

/**
 * Guided selfie for the gov.br face check. Detection runs on the device:
 * no image leaves the phone (biometric data, LGPD art. 11).
 */
export function SelfieGuideScreen({ navigate }: { navigate: Navigate }) {
  const { videoRef, ready, error } = useCamera("user");
  const [guidance, setGuidance] = useState(STARTING);
  const lastSpoken = useRef("");

  useEffect(() => {
    if (!ready) return;
    let detector: FaceDetector | undefined;
    let timer: number | undefined;
    let cancelled = false;
    (async () => {
      const vision = await FilesetResolver.forVisionTasks(WASM_URL);
      detector = await FaceDetector.createFromOptions(vision, { baseOptions: { modelAssetPath: MODEL_URL }, runningMode: "VIDEO" });
      if (cancelled) return detector.close();
      timer = window.setInterval(() => {
        const video = videoRef.current;
        if (!video || !detector) return;
        const boxes = detector.detectForVideo(video, performance.now()).detections
          .map((d) => d.boundingBox).filter((box) => box !== undefined)
          .map((box) => ({ x: box.originX, y: box.originY, width: box.width, height: box.height }));
        setGuidance(guideFace(boxes, video.videoWidth, video.videoHeight));
      }, DETECTION_INTERVAL_MS);
    })().catch(() => setGuidance({ ok: false, message: "Não consegui ligar o guia da selfie." }));
    return () => { cancelled = true; window.clearInterval(timer); detector?.close(); };
  }, [ready, videoRef]);

  useEffect(() => {
    if (guidance.message === lastSpoken.current) return;
    lastSpoken.current = guidance.message;
    speak(guidance.message);
  }, [guidance]);

  return (
    <Screen mood={guidance.ok ? "success" : "gov"} avatar={guidance.ok ? "calm" : "alert"} chip="Selfie do gov.br"
      title={guidance.ok ? "Perfeito, Maria." : "Vamos tirar a selfie."}
      speech={error ? "Preciso que você libere a câmera para eu te guiar." : guidance.message}
      hint={["A foto não sai", "do seu celular"]}>
      <video ref={videoRef} className="camera camera--mirrored" playsInline muted />
      <div className="stack">
        <button className="btn btn--primary" disabled={!guidance.ok} onClick={() => navigate("home")}>Tirar a foto</button>
        <button className="link" onClick={() => navigate("apps")}>Agora não</button>
      </div>
    </Screen>
  );
}
