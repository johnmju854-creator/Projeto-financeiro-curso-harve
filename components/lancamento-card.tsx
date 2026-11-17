import Link from "next/link";
import {
  LancamentoComCategoria,
  descricaoExibida,
  formatarData,
  formatarValor,
} from "@/lib/lancamentos-utils";

// Recebe só dados simples (o nome da categoria já vem resolvido), então não importa nada do servidor
type LancamentoCardProps = {
  dados: LancamentoComCategoria;
};

export function LancamentoCard({ dados }: LancamentoCardProps) {
  const sinal = dados.tipo === "entrada" ? "+" : "-";

  return (
    <li className="card">
      <Link href={`/lancamentos/${dados.id}`}>
        <strong>{descricaoExibida(dados)}</strong>
      </Link>
      <span className={dados.tipo}>
        {sinal} {formatarValor(dados.valor)}
      </span>
      <small>
        {dados.tipo} · {formatarData(dados.data)}
      </small>
      <small>
        Categoria:{" "}
        {dados.categoria ? (
          <Link href={`/categoria/${dados.categoria.id}`}>{dados.categoria.nome}</Link>
        ) : (
          "sem categoria"
        )}
      </small>
      <small>
        <Link href={`/lancamentos/${dados.id}/editar`}>Editar</Link>
      </small>
    </li>
  );
}
