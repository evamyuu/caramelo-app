/** Ambient colour of a screen; mirrors Caramelo's state in the Figma v9 design. */
export type Mood = "calm" | "listening" | "scam" | "consent" | "gov" | "success";

export type AvatarState = "calm" | "alert" | "scam";

export type ScreenName =
  | "home" | "apps" | "listening" | "call" | "message" | "cobrowse"
  | "selfie" | "medicine" | "bank" | "routine" | "store";

/** A task to do together in the secure room, e.g. started by a routine. */
export interface TaskIntent {
  title: string;
  task: string;
  url: string;
  routineId?: string;
}

/** Navigation callback shared by every screen; a task travels with ``cobrowse``. */
export type Navigate = (screen: ScreenName, intent?: TaskIntent) => void;

export interface LinkScanReport {
  verdict: "safe" | "caution" | "scam" | "unreachable";
  score: number;
  findings: string[];
  speech: string;
  host?: string;
}

export interface CallAssessment {
  score: number;
  level: "safe" | "caution" | "scam";
  reasons: string[];
  speech: string;
  notify_family: boolean;
}

export interface AccountBalance {
  simulated: boolean;
  data: { availableAmount: { amount: string; currency: string } };
  transactions: { name: string; date: string; amount: number }[];
}

/** Partner dashboard (``GET /insights/dashboard``): anonymous scam statistics. */
export interface ScamDashboard {
  period_days: number;
  total: number;
  blocked: number;
  block_rate: number;
  avg_blocked_score: number;
  simulated_share: number;
  by_kind: Partial<Record<"call" | "link", number>>;
  by_region: { region: string; total: number; blocked: number; last7: number; prev7: number }[];
  by_day: { date: string; blocked: number }[];
  top_signals: { signal: string; label: string; count: number }[];
  waves: { region: string; last7: number; prev7: number; growth: number }[];
}

export interface Routine {
  id: string;
  title: string;
  kind: "reminder" | "task";
  time: string;
  days: number[];
  month_day: number | null;
  task: string | null;
  url: string | null;
  source: "user" | "learned";
  done: string[];
  /** Portuguese description of when it happens, e.g. "todo dia 5 às 09:00". */
  schedule: string;
}

export interface AgendaItem {
  id: string;
  title: string;
  kind: Routine["kind"];
  time: string;
  status: "done" | "due" | "late" | "upcoming";
  task: string | null;
  url: string | null;
}

export interface RoutineOverview {
  routines: Routine[];
  agenda: { date: string; items: AgendaItem[]; next: AgendaItem | null };
  adherence: { done: number; expected: number };
  suggestions: Routine[];
}
