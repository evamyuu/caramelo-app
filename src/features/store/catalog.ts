/**
 * Apps Caramelo installs: only official ones, from a hand-checked list.
 *
 * This is the "controls what gets in" part of managing the phone. Package ids
 * were checked against their Google Play pages. Anything outside the list is not
 * installed by Caramelo, and names that imitate an official app are flagged as
 * scams ("WhatsApp Gold", "INSS Digital"...). On Android, the managed version
 * installs silently through managed Google Play; the web prototype opens the
 * official Play Store page and the user taps Install.
 */
import type { IconName } from "@/components/Icon";

export interface OfficialApp {
  /** Android package id. */
  id: string;
  name: string;
  publisher: string;
  /** What it is for, in one plain sentence. */
  purpose: string;
  icon: IconName;
  color: string;
  /** Opened when the app cannot be launched directly (desktop, iPhone). */
  web: string;
  /** Words people use to ask for it. */
  aliases: string[];
}

export const OFFICIAL_APPS: OfficialApp[] = [
  { id: "com.whatsapp", name: "WhatsApp", publisher: "WhatsApp LLC", purpose: "Mensagens e chamadas de vídeo com a família.",
    icon: "message", color: "#168821", web: "https://web.whatsapp.com/", aliases: ["whatsapp", "zap", "zapzap", "whats"] },
  { id: "com.google.android.apps.photos", name: "Google Fotos", publisher: "Google LLC", purpose: "Guardar e ver as fotos dos netos.",
    icon: "photo", color: "#D9893F", web: "https://photos.google.com/", aliases: ["fotos", "foto", "google fotos", "galeria"] },
  { id: "br.gov.dataprev.meuinss", name: "Meu INSS", publisher: "Governo Federal (Dataprev)", purpose: "Aposentadoria, extrato de pagamento e benefícios.",
    icon: "document", color: "#0C326F", web: "https://meu.inss.gov.br/", aliases: ["meu inss", "inss", "aposentadoria", "beneficio"] },
  { id: "br.gov.meugovbr", name: "gov.br", publisher: "Governo Federal", purpose: "Sua conta gov.br e os documentos digitais.",
    icon: "shield", color: "#1351B4", web: "https://www.gov.br/", aliases: ["gov.br", "gov br", "govbr", "governo"] },
  { id: "br.gov.datasus.cnsdigital", name: "Meu SUS Digital", publisher: "Ministério da Saúde", purpose: "Vacinas, exames e cartão do SUS.",
    icon: "heart", color: "#1F8A6B", web: "https://meususdigital.saude.gov.br/", aliases: ["sus", "meu sus", "conecte sus", "vacina", "saude"] },
  { id: "br.gov.serpro.cnhe", name: "CNH do Brasil", publisher: "Governo Federal (Serpro)", purpose: "Carteira de motorista no celular.",
    icon: "document", color: "#0C326F", web: "https://www.gov.br/transportes/", aliases: ["cnh", "carteira de motorista", "carteira digital de transito", "detran"] },
  { id: "br.gov.caixa.tem", name: "CAIXA Tem", publisher: "Caixa Econômica Federal", purpose: "Benefícios sociais pagos pela Caixa. A senha é só sua.",
    icon: "wallet", color: "#005CA9", web: "https://www.caixa.gov.br/caixatem/", aliases: ["caixa tem", "caixa", "bolsa familia"] },
  { id: "com.google.android.youtube", name: "YouTube", publisher: "Google LLC", purpose: "Vídeos, músicas e receitas.",
    icon: "play", color: "#C4302B", web: "https://www.youtube.com/", aliases: ["youtube", "video", "videos", "musica"] },
  { id: "com.google.android.apps.maps", name: "Google Maps", publisher: "Google LLC", purpose: "Mapas e o caminho até o posto ou a farmácia.",
    icon: "map", color: "#34A853", web: "https://maps.google.com/", aliases: ["maps", "mapa", "mapas", "caminho"] },
  { id: "com.google.android.gm", name: "Gmail", publisher: "Google LLC", purpose: "E-mail.",
    icon: "mail", color: "#C5221F", web: "https://mail.google.com/", aliases: ["gmail", "email", "e-mail"] },
];

/** Words fake copies add to an official name. */
const FAKE_MARKERS = new Set(["gold", "plus", "gb", "mod", "premium", "pro", "vip", "beta", "turbo", "dark", "lite",
  "digital", "facil", "2.0", "atualizado", "novo"]);

export type Lookup =
  | { kind: "official"; app: OfficialApp }
  | { kind: "fake"; app: OfficialApp; asked: string }
  | { kind: "unknown"; asked: string };

function plain(text: string): string {
  return text.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, " ").trim();
}

/** Match what the user asked for to an official app, or flag it as a fake copy or unknown. */
export function lookupApp(asked: string): Lookup {
  const query = plain(asked);
  const app = OFFICIAL_APPS.find((candidate) => candidate.aliases.some((alias) => query.includes(alias)));
  if (!app) return { kind: "unknown", asked };
  // Words beyond the official name and its aliases; a fake marker among them means a copy.
  const known = new Set([app.name, ...app.aliases].flatMap((name) => plain(name).split(" ")));
  const extra = query.split(" ").filter((word) => !known.has(word));
  return extra.some((word) => FAKE_MARKERS.has(word)) ? { kind: "fake", app, asked } : { kind: "official", app };
}

/** Official Play Store page; on Android it opens the Play Store app. */
export const storeUrl = (app: OfficialApp) => `https://play.google.com/store/apps/details?id=${app.id}&hl=pt_BR`;

/** Open an installed app: Android intent with the web page as fallback. */
export function launchUrl(app: OfficialApp): string {
  if (!/android/i.test(navigator.userAgent)) return app.web;
  return `intent://#Intent;package=${app.id};S.browser_fallback_url=${encodeURIComponent(app.web)};end`;
}
