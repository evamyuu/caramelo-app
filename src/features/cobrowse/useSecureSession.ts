import { useCallback, useEffect, useRef, useState } from "react";

import { secureSessionUrl } from "@/lib/api";
import { speak } from "@/lib/speech";

/** Size of the remote browser viewport; taps are mapped to these coordinates. */
export const REMOTE_VIEWPORT = { width: 390, height: 440 };

export type SessionPhase = "plan" | "working" | "consent" | "handover" | "done";

export interface SecureSessionState {
  phase: SessionPhase;
  frame: string | null;
  url: string;
  speech: string;
  steps: string[];
  question: string;
  success: boolean;
}

type ServerMessage =
  | { type: "frame"; image: string; url: string }
  | { type: "speech"; speech: string }
  | { type: "step"; description: string }
  | { type: "consent_request"; question: string }
  | { type: "handover"; speech: string }
  | { type: "done"; success: boolean; result: string };

const INITIAL: SecureSessionState = {
  phase: "plan", frame: null, url: "", speech: "", steps: [], question: "", success: false,
};

/** Pure reducer from a server message to the next UI state. */
function reduce(state: SecureSessionState, message: ServerMessage): SecureSessionState {
  switch (message.type) {
    case "frame": return { ...state, frame: `data:image/jpeg;base64,${message.image}`, url: message.url };
    case "speech": return { ...state, speech: message.speech };
    case "step": return { ...state, steps: [...state.steps, message.description] };
    case "consent_request": return { ...state, phase: "consent", question: message.question };
    case "handover": return { ...state, phase: "handover", speech: message.speech };
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
      if (message.type === "speech" || message.type === "handover") speak(message.speech);
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
    finishHandover: () => { send({ type: "ready" }); setState((s) => ({ ...s, phase: "working" })); },
    stop: () => send({ type: "stop" }),
    tap: (x: number, y: number) => send({ type: "tap", x, y }),
    typeText: (text: string) => send({ type: "key", text }),
    pressKey: (special: string) => send({ type: "key", special }),
  };
}
