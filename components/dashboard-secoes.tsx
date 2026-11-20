// Pedaços do Dashboard. Só desenham o que recebem (dados já calculados em lib/dashboard-utils.ts).
// Sem "use client" e sem biblioteca de gráficos: tudo é HTML e CSS. A "dica" ao passar o mouse
// é feita só com CSS (data-dica) e os mesmos números ficam na tabela "Ver como tabela".
import Link from "next/link";
import {
  escalaDoGrafico,
  mesAnterior,
  mesSeguinte,
  nomeDoMes,
  rotuloDoEixo,
  type FatiaDeCategoria,
  type MesISO,
  type PontoDoMes,
  type ResumoDoMes,
} from "@/lib/dashboard-utils";
import { formatarValor } from "@/lib/lancamentos-utils";

function plural(n: number, singular: string, pluralTexto: string): string {
  return `${n} ${n === 1 ? singular : pluralTexto}`;
}

// ---------------------------------------------------------------------------
// Seletor de mês: vale para tudo que está abaixo dele
// ---------------------------------------------------------------------------
export function FiltroMes({ mes, atual }: { mes: MesISO; atual: MesISO }) {
  const ehOAtual = mes >= atual;
  return (
    <div className="filtro-mes" role="group" aria-label="Escolher o mês">
      <Link href={`/dashboard?mes=${mesAnterior(mes)}`} aria-label="Mês anterior">
        ‹
      </Link>
      <span className="mes-atual">{nomeDoMes(mes)}</span>
      {ehOAtual ? (
        <span className="desligado" aria-label="Não há mês seguinte">
          ›
        </span>
      ) : (
        <Link href={`/dashboard?mes=${mesSeguinte(mes)}`} aria-label="Mês seguinte">
          ›
        </Link>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Os três números do mês
// ---------------------------------------------------------------------------
export function CartoesDoMes({
  resumo,
  ateHoje,
}: {
  resumo: ResumoDoMes;
  ateHoje: string | null; // ex.: "20/11" no mês atual; null em meses passados
}) {
  const sufixo = ateHoje ? `, até hoje (${ateHoje})` : "";
  return (
    <div className="kpis">
      <p className="kpi">
        <span className="rotulo">
          <span className="marca" style={{ background: "var(--serie-entrada)" }} />
          Entradas
        </span>
        <span className="valor-kpi">{formatarValor(resumo.entradas)}</span>
        <span className="detalhe">
          {plural(resumo.quantidadeEntradas, "lançamento", "lançamentos")}
          {sufixo}
        </span>
      </p>
      <p className="kpi">
        <span className="rotulo">
          <span className="marca" style={{ background: "var(--serie-saida)" }} />
          Saídas
        </span>
        <span className="valor-kpi">{formatarValor(resumo.saidas)}</span>
        <span className="detalhe">
          {plural(resumo.quantidadeSaidas, "lançamento", "lançamentos")}
          {sufixo}
        </span>
      </p>
      <p className="kpi">
        <span className="rotulo">Saldo do mês</span>
        <span className="valor-kpi">{formatarValor(resumo.saldo)}</span>
        <span className="detalhe">
          {resumo.sobraPercentual === null
            ? "Nenhuma entrada no mês"
            : resumo.saldo >= 0
              ? `Sobrou ${resumo.sobraPercentual}% do que entrou`
              : "Saiu mais do que entrou"}
        </span>
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Saídas por categoria: barras horizontais, cada uma na cor da categoria
// ---------------------------------------------------------------------------
export function SaidasPorCategoria({ fatias }: { fatias: FatiaDeCategoria[] }) {
  if (fatias.length === 0) return <p className="suave-texto">Nenhuma saída neste mês.</p>;

  const maior = fatias[0].valor; // a lista já vem da maior para a menor
  return (
    <ul className="barras-categoria">
      {fatias.map((f) => (
        <li key={f.chave}>
          <span className="nome-cat" title={f.nome}>
            {f.nome}
          </span>
          <span className="trilho">
            {/* a cor já foi conferida (#RRGGBB) ao ler do banco, então é segura no estilo */}
            <span
              className="barra com-dica"
              tabIndex={0}
              role="img"
              aria-label={`${f.nome}: ${formatarValor(f.valor)}, ${f.percentual}% das saídas`}
              data-dica={`${f.nome}\n${formatarValor(f.valor)} (${f.percentual}% das saídas)`}
              style={{ width: `${Math.max((f.valor / maior) * 100, 1)}%`, backgroundColor: f.cor }}
            />
          </span>
          <span className="valor-cat">
            {formatarValor(f.valor)}
            <small>{f.percentual}%</small>
          </span>
        </li>
      ))}
    </ul>
  );
}

// ---------------------------------------------------------------------------
// Entradas e saídas dos últimos meses (colunas lado a lado) + tabela alternativa
// ---------------------------------------------------------------------------
export function EvolucaoMeses({
  serie,
  ateHoje,
}: {
  serie: PontoDoMes[];
  ateHoje: string | null;
}) {
  const maiorValor = Math.max(0, ...serie.flatMap((p) => [p.entradas, p.saidas]));
  const { maximo, marcas } = escalaDoGrafico(maiorValor);
  const emAndamento = serie.some((p) => p.emAndamento);

  return (
    <>
      <ul className="legenda">
        <li>
          <span className="chave" style={{ background: "var(--serie-entrada)" }} />
          Entradas
        </li>
        <li>
          <span className="chave" style={{ background: "var(--serie-saida)" }} />
          Saídas
        </li>
      </ul>

      <div className="grafico-meses">
        <div className="eixo-y" aria-hidden="true">
          {marcas.map((m) => (
            <span key={m} style={{ bottom: `${(m / maximo) * 100}%` }}>
              {rotuloDoEixo(m)}
            </span>
          ))}
        </div>

        <div className="area-colunas">
          {marcas
            .filter((m) => m > 0)
            .map((m) => (
              <span
                key={m}
                className="linha-grade"
                aria-hidden="true"
                style={{ bottom: `${(m / maximo) * 100}%` }}
              />
            ))}
          {serie.map((p, i) => {
            const lado = i < 2 ? "dica-esq" : i >= serie.length - 2 ? "dica-dir" : "";
            const titulo = `${p.rotulo}${p.emAndamento ? " (em andamento)" : ""}`;
            return (
              <div className="mes-grupo" key={p.mes}>
                <div
                  className={`coluna entrada com-dica ${lado}`}
                  tabIndex={0}
                  role="img"
                  aria-label={`${titulo}, entradas: ${formatarValor(p.entradas)}`}
                  data-dica={`${titulo}\nEntradas: ${formatarValor(p.entradas)}\nSaldo: ${formatarValor(p.saldo)}`}
                  style={{ height: `${(p.entradas / maximo) * 100}%` }}
                />
                <div
                  className={`coluna saida com-dica ${lado}`}
                  tabIndex={0}
                  role="img"
                  aria-label={`${titulo}, saídas: ${formatarValor(p.saidas)}`}
                  data-dica={`${titulo}\nSaídas: ${formatarValor(p.saidas)}\nSaldo: ${formatarValor(p.saldo)}`}
                  style={{ height: `${(p.saidas / maximo) * 100}%` }}
                />
              </div>
            );
          })}
        </div>

        <div className="rotulos-meses" aria-hidden="true">
          {serie.map((p) => (
            <span key={p.mes}>
              {p.rotulo}
              {p.emAndamento ? "*" : ""}
            </span>
          ))}
        </div>
      </div>

      {emAndamento && ateHoje && <p className="nota-grafico">* Mês em andamento (até {ateHoje}).</p>}

      <details className="ver-tabela">
        <summary>Ver como tabela</summary>
        <div className="tabela-wrap">
          <table className="tabela">
            <thead>
              <tr>
                <th>Mês</th>
                <th className="direita">Entradas</th>
                <th className="direita">Saídas</th>
                <th className="direita">Saldo</th>
              </tr>
            </thead>
            <tbody>
              {serie.map((p) => (
                <tr key={p.mes}>
                  <td>
                    {nomeDoMes(p.mes)}
                    {p.emAndamento ? " *" : ""}
                  </td>
                  <td className="direita">{formatarValor(p.entradas)}</td>
                  <td className="direita">{formatarValor(p.saidas)}</td>
                  <td className="direita">{formatarValor(p.saldo)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </>
  );
}
