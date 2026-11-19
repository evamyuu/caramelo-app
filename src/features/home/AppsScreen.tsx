import { Icon, type IconName } from "@/components/Icon";
import { Screen } from "@/components/Screen";
import { launchUrl, OFFICIAL_APPS } from "@/features/store/catalog";
import { installedApps } from "@/lib/device";
import type { Navigate, ScreenName } from "@/lib/types";

interface AppTile {
  name: string;
  detail: string;
  icon: IconName;
  color: string;
  /** A Caramelo screen, or an installed app opened directly. */
  target: ScreenName | { url: string };
  badge?: number;
}

/** Caramelo's own flows, always on the screen. */
const CORE_TILES: AppTile[] = [
  { name: "WhatsApp", detail: "1 nova", icon: "message", color: "#168821", target: "message", badge: 1 },
  { name: "Ligar", detail: "Família e amigos", icon: "phone", color: "#1351B4", target: "call" },
  { name: "Biometria", detail: "Treino da foto do rosto", icon: "face", color: "#8B6FD0", target: "selfie" },
  { name: "INSS", detail: "Fazer junto", icon: "document", color: "#0C326F", target: "cobrowse" },
  { name: "Remédios", detail: "Ler a caixa", icon: "pill", color: "#1F8A6B", target: "medicine" },
  { name: "Banco", detail: "Protegido", icon: "wallet", color: "#B5700A", target: "bank" },
];
/** Covered by a core tile, so not repeated among installed apps. */
const HAS_CORE_TILE = ["com.whatsapp"];

export function AppsScreen({ navigate }: { navigate: Navigate }) {
  const installed = installedApps();
  const appTiles: AppTile[] = OFFICIAL_APPS
    .filter((app) => installed.includes(app.id) && !HAS_CORE_TILE.includes(app.id))
    .map((app) => ({ name: app.name.replace(/^Google /, ""), detail: app.purpose.split(/[.,]/)[0], icon: app.icon,
      color: app.color, target: { url: launchUrl(app) } }));
  const tiles = [...CORE_TILES, ...appTiles,
    { name: "Novo app", detail: "Eu instalo com você", icon: "plus", color: "#6E6880", target: "store" } as AppTile];

  function open(tile: AppTile) {
    if (typeof tile.target === "string") navigate(tile.target);
    else window.location.href = tile.target.url;
  }

  return (
    <Screen
      mood="calm" chip="Seus aplicativos" title="O que vamos fazer?"
      hint={["Ou é só me pedir:", "“Abre o WhatsApp”"]} onAvatarClick={() => navigate("listening")}
    >
      <div className="tiles">
        {tiles.map((tile) => (
          <button key={tile.name} className="tile" onClick={() => open(tile)}>
            <span className="tile__icon" style={{ background: tile.color }}><Icon name={tile.icon} /></span>
            {tile.badge && <span className="tile__badge">{tile.badge}</span>}
            <div className="tile__name">{tile.name}</div>
            <div className="tile__detail">{tile.detail}</div>
          </button>
        ))}
      </div>
    </Screen>
  );
}
