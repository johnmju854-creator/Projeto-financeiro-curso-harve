"use client";

// Componente de cliente: importa só de lancamentos-utils (parte pura), nunca dos dados do servidor.
import { useDeferredValue, useMemo, useState } from "react";
import { LancamentoCard } from "@/components/lancamento-card";
import {
  FiltroTipo,
  LancamentoComCategoria,
  filtrarLancamentos,
  formatarValor,
  totalDeSaidas,
} from "@/lib/lancamentos-utils";

type LancamentosFiltradosProps = {
  lancamentos: LancamentoComCategoria[];
};

// Cada clique no botão passa para o próximo filtro: tudo → entradas → saídas → tudo
const proximoFiltro: Record<FiltroTipo, FiltroTipo> = {
  todos: "entrada",
  entrada: "saida",
  saida: "todos",
};

const nomeDoFiltro: Record<FiltroTipo, string> = {
  todos: "Tudo",
  entrada: "Só entradas",
  saida: "Só saídas",
};

export function LancamentosFiltrados({ lancamentos }: LancamentosFiltradosProps) {
  const [busca, setBusca] = useState("");
  const [tipo, setTipo] = useState<FiltroTipo>("todos");

  // O campo de texto responde na hora; o filtro acompanha logo em seguida (mantém a digitação leve)
  const buscaAdiada = useDeferredValue(busca);

  // Só refaz o filtro e a soma quando algo muda de verdade
  const visiveis = useMemo(
    () => filtrarLancamentos(lancamentos, buscaAdiada, tipo),
    [lancamentos, buscaAdiada, tipo],
  );
  const total = useMemo(() => totalDeSaidas(visiveis), [visiveis]);

  return (
    <div>
      <div className="filtros">
        <input
          type="search"
          aria-label="Buscar pela descrição"
          placeholder="Buscar pela descrição..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
        <button type="button" onClick={() => setTipo(proximoFiltro[tipo])}>
          Mostrando: {nomeDoFiltro[tipo]}
        </button>
      </div>

      {/* aria-live: leitores de tela avisam quando o total muda */}
      <p className="total" aria-live="polite">
        Total de saídas: <strong>{formatarValor(total)}</strong>
      </p>

      {visiveis.length === 0 ? (
        <p>
          {lancamentos.length === 0
            ? "Você ainda não tem nenhum lançamento."
            : "Nenhum lançamento encontrado com esse filtro."}
        </p>
      ) : (
        <ul className="lista">
          {visiveis.map((l) => (
            <LancamentoCard key={l.id} dados={l} />
          ))}
        </ul>
      )}
    </div>
  );
}
