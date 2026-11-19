import { useCallback, useEffect, useState } from "react";

import { Checklist, type ChecklistItem } from "@/components/Checklist";
import { Screen } from "@/components/Screen";
import { ApiError, createRoutine, deleteRoutine, getRoutines } from "@/lib/api";
import { speak } from "@/lib/speech";
import type { AgendaItem, Navigate, Routine, RoutineOverview } from "@/lib/types";

const STATUS_DETAIL: Record<AgendaItem["status"], string | undefined> = {
  done: undefined, due: "Agora", late: "Ainda não feito", upcoming: undefined,
};

/** Today's agenda, every routine, what Caramelo learned, and a way to ask for a new one. */
export function RoutineScreen({ navigate }: { navigate: Navigate }) {
  const [overview, setOverview] = useState<RoutineOverview | null>(null);
  const [request, setRequest] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const reload = useCallback(() => getRoutines().then(setOverview).catch(() => setMessage("Não consegui ver a sua rotina agora.")), []);
  useEffect(() => { reload(); }, [reload]);

  async function create(from: { text: string } | { suggestion: Routine }) {
    setBusy(true);
    try {
      const routine = await createRoutine(from);
      const said = `Combinado. ${routine.title}, ${routine.schedule}.`;
      setMessage(said);
      speak(said);
      setRequest("");
      await reload();
    } catch (error) {
      setMessage(error instanceof ApiError ? error.message : "Não consegui criar agora.");
    } finally {
      setBusy(false);
    }
  }

  const items: ChecklistItem[] = (overview?.agenda.items ?? []).map((item) => ({
    label: `${item.time} · ${item.title}`,
    status: item.status === "done" ? "done" : item.status === "upcoming" ? "pending" : "active",
    detail: STATUS_DETAIL[item.status],
  }));
  const { done = 0, expected = 0 } = overview?.adherence ?? {};
  const speech = message || (expected
    ? `Nos últimos 7 dias, você fez ${done} de ${expected} lembretes na hora certa.`
    : "Me diga o que você quer que eu lembre ou faça, e quando.");

  return (
    <Screen mood="calm" chip="Sua rotina" title="Seu dia, Maria." speech={speech}
      hint={["Eu aviso na hora", "e faço junto com você"]} onAvatarClick={() => navigate("listening")}>
      <div className="stack">
        <div className="card">
          <div className="card__label">Hoje</div>
          {items.length ? <Checklist items={items} /> : <p>Nada marcado para hoje.</p>}
        </div>

        {overview?.suggestions.map((suggestion) => (
          <div key={suggestion.task ?? suggestion.title} className="card">
            <div className="card__label card__label--accent">Aprendi com você</div>
            <p>Você costuma fazer “{suggestion.title}”. Quer que eu cuide disso {suggestion.schedule}?</p>
            <button className="btn btn--primary routine__accept" disabled={busy} onClick={() => create({ suggestion })}>
              Sim, pode cuidar
            </button>
          </div>
        ))}

        <input className="secure-input" placeholder="Ex.: todo dia 5, ver meu pagamento do INSS" value={request}
          onChange={(event) => setRequest(event.target.value)}
          onKeyDown={(event) => { if (event.key === "Enter" && request.trim()) create({ text: request }); }} />
        <button className="btn btn--primary" disabled={busy || !request.trim()} onClick={() => create({ text: request })}>
          Criar rotina
        </button>

        {!!overview?.routines.length && (
          <div className="card">
            <div className="card__label">Tudo o que eu cuido</div>
            <ul className="routine__list">
              {overview.routines.map((routine) => (
                <li key={routine.id}>
                  <span>
                    {routine.title}
                    <small>{routine.schedule}{routine.kind === "task" ? " · eu faço junto" : ""}</small>
                  </span>
                  <button className="link" aria-label={`Apagar ${routine.title}`}
                    onClick={() => deleteRoutine(routine.id).then(reload)}>Apagar</button>
                </li>
              ))}
            </ul>
          </div>
        )}
        <button className="link" onClick={() => navigate("home")}>Voltar ao início</button>
      </div>
    </Screen>
  );
}
