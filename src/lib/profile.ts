/**
 * The user's state (UF), set when Caramelo is configured (by the CiX attendant in
 * the pilot). Only the state goes with scam reports, never the city or the number.
 */
const KEY = "caramelo.region";
const DEFAULT_REGION: string = import.meta.env.VITE_REGION ?? "SP";

export function region(): string {
  try {
    return localStorage.getItem(KEY) ?? DEFAULT_REGION;
  } catch {
    return DEFAULT_REGION;
  }
}

export function setRegion(uf: string): void {
  try {
    localStorage.setItem(KEY, uf.toUpperCase());
  } catch {
    // Storage blocked: the default region is used.
  }
}
