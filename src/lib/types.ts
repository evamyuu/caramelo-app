/** Ambient colour of a screen; mirrors Caramelo's state in the Figma v9 design. */
export type Mood = "calm" | "listening" | "scam" | "consent" | "gov" | "success";

export type AvatarState = "calm" | "alert" | "scam";

export type ScreenName =
  | "home" | "apps" | "listening" | "call" | "message" | "cobrowse"
  | "selfie" | "medicine" | "bank";

/** Navigation callback shared by every screen. */
export type Navigate = (screen: ScreenName) => void;

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
