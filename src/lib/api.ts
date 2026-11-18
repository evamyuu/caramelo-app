/** Typed client for caramelo-api. */
import type { AccountBalance, CallAssessment, LinkScanReport } from "./types";

export const API_URL: string = import.meta.env.VITE_API_URL ?? "http://localhost:8000";
const API_V1 = `${API_URL}/api/v1`;

async function request<T>(path: string, body?: unknown): Promise<T> {
  const response = await fetch(`${API_V1}${path}`, body === undefined ? undefined : {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error(`API ${path} failed with ${response.status}`);
  return response.json() as Promise<T>;
}

export const scanLink = (url: string) => request<LinkScanReport>("/links/scan", { url });
export const assessCall = (signals: Record<string, boolean>) => request<CallAssessment>("/calls/assess", { signals });
export const getAccountBalance = () => request<AccountBalance>("/accounts/balance");
export const chat = (message: string) => request<{ speech: string }>("/assistant/chat", { message });

/** WebSocket URL of the secure co-browsing session. */
export const secureSessionUrl = () => `${API_V1.replace(/^http/, "ws")}/secure-session`;
