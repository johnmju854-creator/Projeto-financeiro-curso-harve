"use client";

// Componente de cliente: importa só de lancamentos-utils (parte pura), nunca dos dados do servidor.
import { useDeferredValue, useMemo, useState } from "react";
import { TabelaLancamentos } from "@/components/tabela-lancamentos";
import {
  FiltroTipo,
  LancamentoComCategoria,
  filtrarLancamentos,
  formatarValor,
  totalDeEntradas,
  totalDeSaidas,
} from "@/lib/lancamentos-utils";

type LancamentosFiltradosProps = {
  lancamentos: LancamentoComCategoria[];
};

// As abas que a pessoa vê (o valor interno continua "todos", "entrada" e "saida")
const ABAS: { valor: FiltroTipo; nome: string }[] = [
  { valor: "todos", nome: "Todos" },
  { valor: "entrada", nome: "Entradas" },
  { valor: "saida", nome: "Saídas" },
];

export function LancamentosFiltrados({ lancamentos }: LancamentosFiltradosProps) {
  const [busca, setBusca] = useState("");
  const [tipo, setTipo] = useState<FiltroTipo>("todos");

  // O campo de texto responde na hora; o filtro acompanha logo em seguida (mantém a digitação leve)
  const buscaAdiada = useDeferredValue(busca);

  // Só refaz o filtro e as somas quando algo muda de verdade
  const visiveis = useMemo(
    () => filtrarLancamentos(lancamentos, buscaAdiada, tipo),
    [lancamentos, buscaAdiada, tipo],
  );
  const totalSaidas = useMemo(() => totalDeSaidas(visiveis), [visiveis]);
  const totalEntradas = useMemo(() => totalDeEntradas(visiveis), [visiveis]);

  const mostraEntradas = tipo !== "saida";
  const mostraSaidas = tipo !== "entrada";

  return (
    <div>
      <div className="barra-filtros">
        <div className="segmentos" role="group" aria-label="Mostrar">
          {ABAS.map((aba) => (
            <button
              key={aba.valor}
              type="button"
              aria-pressed={tipo === aba.valor}
              onClick={() => setTipo(aba.valor)}
            >
              {aba.nome}
            </button>
          ))}
        </div>
        <input
          type="search"
          aria-label="Buscar pela descrição"
          placeholder="Buscar pela descrição..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
      </div>

      {/* aria-live: leitores de tela avisam quando os totais mudam */}
      <div className="totais" aria-live="polite">
        {mostraEntradas && (
          <p className="total entrada">
            Total de entradas<strong>{formatarValor(totalEntradas)}</strong>
          </p>
        )}
        {mostraSaidas && (
          <p className="total">
            Total de saídas<strong>{formatarValor(totalSaidas)}</strong>
          </p>
        )}
      </div>

      {visiveis.length === 0 ? (
        <div className="vazio">
          <p>
            {lancamentos.length === 0
              ? "Você ainda não tem nenhum lançamento."
              : "Nenhum lançamento encontrado com esse filtro."}
          </p>
        </div>
      ) : (
        <>
          {tipo !== "todos" && (
            <h2 className="titulo-secao">
              {tipo === "entrada" ? "Entradas" : "Saídas"}
              <small>
                {visiveis.length} {visiveis.length === 1 ? "lançamento" : "lançamentos"}
              </small>
            </h2>
          )}
          <TabelaLancamentos lancamentos={visiveis} mostrarSinal={tipo === "todos"} />
        </>
      )}
    </div>
  );
}
