import { useEffect, useState } from "react";

import { Icon } from "@/components/Icon";
import { Screen } from "@/components/Screen";
import { getAccountBalance } from "@/lib/api";
import type { AccountBalance, Navigate } from "@/lib/types";

const BRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

/** Read-only balance (Open Finance shape, simulated). Payments are always done by the user in the bank app. */
export function BankScreen({ navigate }: { navigate: Navigate }) {
  const [account, setAccount] = useState<AccountBalance | null>(null);
  const [handedOver, setHandedOver] = useState(false);

  useEffect(() => { getAccountBalance().then(setAccount).catch(() => setAccount(null)); }, []);

  if (handedOver) {
    return (
      <Screen mood="consent" avatar="alert" chip="Agora é com você" title="No banco, quem mexe é você."
        speech="Eu não faço Pix nem pagamento. Abro o app do banco e fico do seu lado olhando se tem golpe."
        hint={["Se alguém pedir pressa,", "me chama antes"]}>
        <div className="stack">
          <button className="btn btn--primary" onClick={() => navigate("home")}>Abrir o app do banco</button>
          <button className="link" onClick={() => setHandedOver(false)}>Voltar</button>
        </div>
      </Screen>
    );
  }

  const amount = account ? BRL.format(Number(account.data.availableAmount.amount)) : "…";
  return (
    <Screen mood="calm" chip="Seu banco · Open Finance" title={`Você tem ${amount}.`}
      speech="Eu só consigo olhar o saldo. Não movimento o seu dinheiro."
      hint={["Dados de demonstração", "simulados"]}>
      <div className="tiles tiles--compact">
        <button className="tile" onClick={() => setHandedOver(true)}><span className="tile__icon" style={{ background: "#B5700A" }}><Icon name="send" /></span><div className="tile__name">Mandar Pix</div></button>
        <button className="tile" onClick={() => setHandedOver(true)}><span className="tile__icon" style={{ background: "#1351B4" }}><Icon name="document" /></span><div className="tile__name">Pagar conta</div></button>
      </div>
      <div className="stack">
        <div className="card">
          <div className="card__label">Últimas movimentações</div>
          {account?.transactions.map((item) => (
            <div className="row" key={item.name + item.date}>
              <span>{item.name}<small>{item.date}</small></span>
              <span className={`amount${item.amount > 0 ? " amount--in" : ""}`}>{BRL.format(item.amount)}</span>
            </div>
          ))}
        </div>
        <button className="link" onClick={() => navigate("apps")}>Voltar</button>
      </div>
    </Screen>
  );
}
