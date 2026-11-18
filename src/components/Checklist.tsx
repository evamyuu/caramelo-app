import { Icon } from "./Icon";

export type StepStatus = "done" | "active" | "pending" | "bad";

export interface ChecklistItem {
  label: string;
  status: StepStatus;
  detail?: string;
}

/** Numbered plan / findings list used across co-browsing and scan results. */
export function Checklist({ items }: { items: ChecklistItem[] }) {
  return (
    <ul className="checklist">
      {items.map((item, index) => (
        <li key={item.label} className={item.status === "pending" ? "is-pending" : undefined}>
          <span className={`bullet bullet--${item.status}`}>
            {item.status === "done" && <Icon name="check" size={16} />}
            {item.status === "bad" && <Icon name="close" size={16} />}
            {item.status === "pending" && index + 1}
          </span>
          <span>{item.label}{item.detail && <small>{item.detail}</small>}</span>
        </li>
      ))}
    </ul>
  );
}
