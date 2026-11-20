import { useCallback, useEffect, useRef, useState } from "react";

import { secureSessionUrl } from "@/lib/api";
import type { Gesture } from "@/features/documents/faceGuidance";
import { speak } from "@/lib/speech";

/** Size of the remote browser viewport; taps are mapped to these coordinates. */
export const REMOTE_VIEWPORT = { width: 390, height: 440 };

export type SessionPhase = "plan" | "working" | "consent" | "handover" | "biometric" | "guide" | "done";

/** What the user is asked to fill in on their own during a handover. */
export type HandoverField = "identity" | "password" | "code" | "captcha";

export interface SecureSessionState {
  phase: SessionPhase;
  field: HandoverField;
  frame: string | null;
  url: string;
  speech: string;
  steps: string[];
  question: string;
  success: boolean;
  /** Liveness gestures the site asked for, during a live face check. */
  gestures: Gesture[];
  /** Guide mode: the official site to open in the user's own browser, and the steps. */
  guide: { url: string; steps: string[] } | null;
}

type ServerMessage =
  | { type: "frame"; image: string; url: string }
  | { type: "speech"; speech: string }
  | { type: "step"; description: string }
  | { type: "consent_request"; question: string }
  | { type: "handover"; field?: HandoverField; speech: string }
  | { type: "biometric"; gestures: Gesture[]; speech: string }
  | { type: "guide"; speech: string; url: string; steps: string[] }
  | { type: "done"; success: boolean; result: string };

const INITIAL: SecureSessionState = {
  phase: "plan", field: "password", frame: null, url: "", speech: "", steps: [], question: "", success: false, gestures: [], guide: null,
};

/** Pure reducer from a server message to the next UI state. */
function reduce(state: SecureSessionState, message: ServerMessage): SecureSessionState {
  switch (message.type) {
    case "frame": return { ...state, frame: `data:image/jpeg;base64,${message.image}`, url: message.url };
    case "speech": return { ...state, speech: message.speech };
    case "step": return { ...state, steps: [...state.steps, message.description] };
    case "consent_request": return { ...state, phase: "consent", question: message.question };
    case "handover": return { ...state, phase: "handover", field: message.field ?? "password", speech: message.speech };
    case "biometric": return { ...state, phase: "biometric", gestures: message.gestures, speech: message.speech };
    case "guide": return { ...state, phase: "guide", speech: message.speech, guide: { url: message.url, steps: message.steps } };
    case "done": return { ...state, phase: "done", speech: message.result, success: message.success };
  }
}

/**
 * Client for the secure co-browsing WebSocket.
 * Keystrokes typed during a handover are forwarded and never kept in React state.
 */
export function useSecureSession() {
  const [state, setState] = useState(INITIAL);
  const socket = useRef<WebSocket | null>(null);

  const send = useCallback((message: object) => {
    if (socket.current?.readyState === WebSocket.OPEN) socket.current.send(JSON.stringify(message));
  }, []);

  const start = useCallback((task: string, url: string, scriptedPlan: string[]) => {
    const connection = new WebSocket(secureSessionUrl());
    socket.current = connection;
    setState({ ...INITIAL, phase: "working" });
    connection.onopen = () => connection.send(JSON.stringify({ task, url, scripted_plan: scriptedPlan }));
    connection.onmessage = (event) => {
      const message = JSON.parse(event.data as string) as ServerMessage;
      if (message.type === "speech" || message.type === "handover" || message.type === "biometric" || message.type === "guide") speak(message.speech);
      if (message.type === "consent_request") speak(message.question);
      if (message.type === "done") speak(message.result);
      setState((current) => reduce(current, message));
    };
    connection.onerror = () =>
      setState((current) => ({ ...current, phase: "done", success: false, speech: "Não consegui abrir a sala segura." }));
  }, []);

  useEffect(() => () => socket.current?.close(), []);

  return {
    state,
    start,
    answerConsent: (approved: boolean) => { send({ type: "consent", approved }); setState((s) => ({ ...s, phase: "working" })); },
    // "Pronto" submits what the user typed (Enter) before handing control back.
    // A captcha submits itself once solved, so there is nothing to press.
    finishHandover: () => {
      if (state.field !== "captcha") send({ type: "key", special: "Enter" });
      send({ type: "ready" });
      setState((s) => ({ ...s, phase: "working" }));
    },
    /** Live face check finished on the device: the photo goes to the site's field, never kept here. */
    sendFace: (image: string | null) => {
      send(image ? { type: "face", image } : { type: "stop" });
      setState((s) => ({ ...s, phase: "working" }));
    },
    stop: () => send({ type: "stop" }),
    /** Leave the secure room and continue step by step in the user's own browser. */
    requestGuide: () => send({ type: "guide" }),
    tap: (x: number, y: number) => send({ type: "tap", x, y }),
    typeText: (text: string) => send({ type: "key", text }),
    pressKey: (special: string) => send({ type: "key", special }),
  };
}
