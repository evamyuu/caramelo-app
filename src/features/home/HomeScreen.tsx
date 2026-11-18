import { Icon } from "@/components/Icon";
import { Screen } from "@/components/Screen";
import type { Navigate } from "@/lib/types";

function greeting(hour: number): string {
  if (hour < 12) return "Bom dia,";
  return hour < 18 ? "Boa tarde," : "Boa noite,";
}

/** Home: almost empty. Caramelo speaks first; tapping anywhere starts listening. */
export function HomeScreen({ navigate }: { navigate: Navigate }) {
  return (
    <Screen
      mood="calm" centered largeTitle chip="24° · Ensolarado"
      title={<>{greeting(new Date().getHours())}<br /><em>Maria.</em></>}
      speech="Você tem 1 remédio às 14h. O resto do dia está tranquilo."
      hint={["Toque em qualquer lugar", "para falar comigo"]}
      onBackgroundClick={() => navigate("listening")}
    >
      <button className="btn btn--soft" onClick={(event) => { event.stopPropagation(); navigate("apps"); }}>
        <Icon name="apps" /> Meus aplicativos
      </button>
    </Screen>
  );
}
