import { useEffect, useState } from "react";

import { Icon } from "@/components/Icon";
import { Screen } from "@/components/Screen";
import { getRoutines } from "@/lib/api";
import type { AgendaItem, Navigate } from "@/lib/types";

function greeting(hour: number): string {
  if (hour < 12) return "Bom dia,";
  return hour < 18 ? "Boa tarde," : "Boa noite,";
}

/** Caramelo's first sentence: what is next in the day, from the routine agenda. */
function daySummary(next: AgendaItem | null, pending: number): string {
  if (!next) return "Seu dia está tranquilo. Se quiser, me peça alguma coisa.";
  const when = next.status === "upcoming" ? `Às ${next.time}` : "Agora";
  const rest = pending > 1 ? ` Depois, mais ${pending - 1} ${pending - 1 === 1 ? "coisa" : "coisas"} hoje.` : " O resto do dia está tranquilo.";
  return `${when}: ${next.title}.${rest}`;
}

/** Home: almost empty. Caramelo speaks first; tapping anywhere starts listening. */
export function HomeScreen({ navigate }: { navigate: Navigate }) {
  const [speech, setSpeech] = useState("");

  useEffect(() => {
    getRoutines()
      .then(({ agenda }) => setSpeech(daySummary(agenda.next, agenda.items.filter((item) => item.status !== "done").length)))
      .catch(() => setSpeech("Toque em mim para conversar."));
  }, []);

  return (
    <Screen
      mood="calm" centered largeTitle chip="24° · Ensolarado"
      title={<>{greeting(new Date().getHours())}<br /><em>Maria.</em></>}
      speech={speech}
      hint={["Toque em qualquer lugar", "para falar comigo"]}
      onBackgroundClick={() => navigate("listening")}
    >
      <div className="home__actions">
        <button className="btn btn--soft" onClick={(event) => { event.stopPropagation(); navigate("apps"); }}>
          <Icon name="apps" /> Meus aplicativos
        </button>
        <button className="btn btn--soft" onClick={(event) => { event.stopPropagation(); navigate("routine"); }}>
          <Icon name="pill" /> Minha rotina
        </button>
      </div>
    </Screen>
  );
}
