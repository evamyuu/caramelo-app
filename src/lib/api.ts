/** Typed client for caramelo-api. */
import { region } from "./profile";
import type { AccountBalance, CallAssessment, LinkScanReport, Routine, RoutineOverview, ScamDashboard } from "./types";

export const API_URL: string = import.meta.env.VITE_API_URL ?? "http://localhost:8000";
const API_V1 = `${API_URL}/api/v1`;

/** Error carrying the API's ``detail`` message, which is written for the user. */
export class ApiError extends Error {}

async function request<T>(path: string, body?: unknown, method = body === undefined ? "GET" : "POST"): Promise<T> {
  const response = await fetch(`${API_V1}${path}`, {
    method,
    headers: body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!response.ok) {
    const detail = await response.json().then((data) => data?.detail).catch(() => null);
    throw new ApiError(typeof detail === "string" ? detail : `API ${path} failed with ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export const scanLink = (url: string) => request<LinkScanReport>("/links/scan", { url, region: region() });
export const assessCall = (signals: Record<string, boolean>) =>
  request<CallAssessment>("/calls/assess", { signals, region: region() });
export const getDashboard = (days: number) => request<ScamDashboard>(`/insights/dashboard?days=${days}`);

export const getRoutines = () => request<RoutineOverview>("/routines");
/** Create a routine from what the user said, or accept a learned suggestion. */
export const createRoutine = (from: { text: string } | { suggestion: Routine }) => request<Routine>("/routines", from);
export const deleteRoutine = (id: string) => request<{ deleted: boolean }>(`/routines/${id}`, undefined, "DELETE");
export const completeRoutine = (id: string) => request<{ done: boolean }>(`/routines/${id}/done`, {});
/** Tell Caramelo a task was completed, so it can learn routines; may return a suggestion. */
export const recordActivity = (task: string, url: string) =>
  request<{ suggestion: Routine | null }>("/activity", { task, url });
export const getAccountBalance = () => request<AccountBalance>("/accounts/balance");
/** Assistant answer; ``sources`` say where a grounded answer came from. */
export interface ChatAnswer {
  speech: string;
  sources: string[];
  grounded: boolean;
}
export interface KnowledgeSource {
  source: string;
  titles: string[];
}
export const chat = (message: string) => request<ChatAnswer>("/assistant/chat", { message });
export const getSources = () => request<{ sources: KnowledgeSource[] }>("/assistant/sources").then((data) => data.sources);

/** WebSocket URL of the secure co-browsing session. */
export const secureSessionUrl = () => `${API_V1.replace(/^http/, "ws")}/secure-session`;
