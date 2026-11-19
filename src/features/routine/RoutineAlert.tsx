import { useEffect, useRef, useState } from "react";

import { completeRoutine, getRoutines } from "@/lib/api";
import { speak } from "@/lib/speech";
import type { AgendaItem, Navigate } from "@/lib/types";

const POLL_MS = 30_000;

/**
 * Caramelo takes the initiative: when a routine is due it speaks up, and offers
 * to do a task together with one tap. The alert stays until the user answers;
 * an answered item stays quiet for the rest of the day.
 */
export function RoutineAlert({ navigate, paused }: { navigate: Navigate; paused: boolean }) {
  const [item, setItem] = useState<AgendaItem | null>(null);
  const shown = useRef<AgendaItem | null>(null);
  const answered = useRef(new Set<string>());

  useEffect(() => {
    if (paused) return;
    let active = true;
    const check = () => getRoutines()
      .then(({ agenda }) => {
        if (!active || shown.current) return;
        const due = agenda.items.find((entry) => entry.status === "due" && !answered.current.has(`${agenda.date}:${entry.id}`));
        if (!due) return;
        answered.current.add(`${agenda.date}:${due.id}`);
        shown.current = due;
        setItem(due);
        speak(sentence(due));
      })
      .catch(() => undefined);
    check();
    const timer = window.setInterval(check, POLL_MS);
    return () => { active = false; window.clearInterval(timer); };
  }, [paused]);

  if (!item || paused) return null;
  const close = () => { shown.current = null; setItem(null); };
  const canDoTogether = item.kind === "task" && item.task && item.url;
  return (
    <aside className="routine-alert" role="alert">
      <p>{sentence(item)}</p>
      <div className="routine-alert__actions">
        {canDoTogether ? (
          <button className="btn btn--primary" onClick={() => {
            close();
            navigate("cobrowse", { title: item.title, task: item.task!, url: item.url!, routineId: item.id });
          }}>Faz junto comigo</button>
        ) : (
          <button className="btn btn--primary" onClick={() => { completeRoutine(item.id).catch(() => undefined); close(); }}>
            Já fiz
          </button>
        )}
        <button className="btn btn--secondary" onClick={close}>Agora não</button>
      </div>
    </aside>
  );
}

function sentence(item: AgendaItem): string {
  return item.kind === "task"
    ? `Maria, chegou a hora: ${item.title}. Quer que eu faça junto com você?`
    : `Maria, hora de: ${item.title}.`;
}
