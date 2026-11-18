import { Icon, type IconName } from "@/components/Icon";
import { Screen } from "@/components/Screen";
import type { Navigate, ScreenName } from "@/lib/types";

interface AppTile {
  name: string;
  detail: string;
  icon: IconName;
  color: string;
  target: ScreenName;
  badge?: number;
}

/** At most six large tiles, as specified in the design. */
const TILES: AppTile[] = [
  { name: "WhatsApp", detail: "1 nova", icon: "message", color: "#168821", target: "message", badge: 1 },
  { name: "Ligar", detail: "Família e amigos", icon: "phone", color: "#1351B4", target: "call" },
  { name: "Documento", detail: "Selfie do gov.br", icon: "face", color: "#8B6FD0", target: "selfie" },
  { name: "INSS", detail: "Fazer junto", icon: "document", color: "#0C326F", target: "cobrowse" },
  { name: "Remédios", detail: "Próximo às 14h", icon: "pill", color: "#1F8A6B", target: "medicine" },
  { name: "Banco", detail: "Protegido", icon: "wallet", color: "#B5700A", target: "bank" },
];

export function AppsScreen({ navigate }: { navigate: Navigate }) {
  return (
    <Screen
      mood="calm" chip="Seus aplicativos" title="O que vamos fazer?"
      hint={["Ou é só me pedir:", "“Abre o WhatsApp”"]} onAvatarClick={() => navigate("listening")}
    >
      <div className="tiles">
        {TILES.map((tile) => (
          <button key={tile.name} className="tile" onClick={() => navigate(tile.target)}>
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
