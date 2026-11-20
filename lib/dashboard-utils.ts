// Parte PURA do dashboard: escolha do mês, resumo, saídas por categoria e evolução de meses.
// Sem banco e sem tela, então é fácil de testar. Valores sempre somados em CENTAVOS
// (evita erros como 0.1 + 0.2).
import {
  totalDeEntradas,
  totalDeSaidas,
  type LancamentoComCategoria,
} from "./lancamentos-utils.ts";

// Um mês é sempre um texto "AAAA-MM" (ex.: "2026-11")
export type MesISO = string;

const NOMES_DOS_MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];
const ABREVIACOES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
const FORMATO_MES = /^(\d{4})-(0[1-9]|1[0-2])$/;

export const COR_NEUTRA = "#94A3B8"; // "Outras" e "Sem categoria"

// "2026-11-20" -> "2026-11"
export function mesDaData(data: string): MesISO {
  return data.slice(0, 7);
}

// O mês que veio da URL (?mes=2026-10). Se estiver errado, no futuro ou muito antigo, usa o mês atual.
export function mesEscolhido(pedido: string | undefined, atual: MesISO): MesISO {
  if (!pedido || !FORMATO_MES.test(pedido)) return atual;
  if (Number(pedido.slice(0, 4)) < 2000) return atual;
  return pedido > atual ? atual : pedido; // "AAAA-MM" compara certo como texto
}

function montarMes(ano: number, mes: number): MesISO {
  return `${ano}-${String(mes).padStart(2, "0")}`;
}

function partes(mes: MesISO): { ano: number; mes: number } {
  return { ano: Number(mes.slice(0, 4)), mes: Number(mes.slice(5, 7)) };
}

export function mesAnterior(mes: MesISO): MesISO {
  const { ano, mes: m } = partes(mes);
  return m === 1 ? montarMes(ano - 1, 12) : montarMes(ano, m - 1);
}

export function mesSeguinte(mes: MesISO): MesISO {
  const { ano, mes: m } = partes(mes);
  return m === 12 ? montarMes(ano + 1, 1) : montarMes(ano, m + 1);
}

// "2026-11" -> "Novembro de 2026"
export function nomeDoMes(mes: MesISO): string {
  const { ano, mes: m } = partes(mes);
  return `${NOMES_DOS_MESES[m - 1]} de ${ano}`;
}

// "2026-11" -> "Nov"
export function mesAbreviado(mes: MesISO): string {
  return ABREVIACOES[partes(mes).mes - 1];
}

export function lancamentosDoMes<T extends { data: string }>(lista: T[], mes: MesISO): T[] {
  return lista.filter((l) => mesDaData(l.data) === mes);
}

// ---------------------------------------------------------------------------
// Resumo do mês: entradas, saídas e saldo
// ---------------------------------------------------------------------------

export type ResumoDoMes = {
  entradas: number;
  saidas: number;
  saldo: number;
  quantidadeEntradas: number;
  quantidadeSaidas: number;
  sobraPercentual: number | null; // quanto % do que entrou sobrou (null se nada entrou)
};

export function resumoDoMes(lista: LancamentoComCategoria[], mes: MesISO): ResumoDoMes {
  const doMes = lancamentosDoMes(lista, mes);
  const entradas = totalDeEntradas(doMes);
  const saidas = totalDeSaidas(doMes);
  const saldo = (Math.round(entradas * 100) - Math.round(saidas * 100)) / 100;
  return {
    entradas,
    saidas,
    saldo,
    quantidadeEntradas: doMes.filter((l) => l.tipo === "entrada").length,
    quantidadeSaidas: doMes.filter((l) => l.tipo === "saida").length,
    sobraPercentual: entradas > 0 ? Math.round((saldo / entradas) * 100) : null,
  };
}

// ---------------------------------------------------------------------------
// Saídas por categoria (da maior para a menor; as pequenas viram "Outras")
// ---------------------------------------------------------------------------

export type FatiaDeCategoria = {
  chave: string;
  nome: string;
  cor: string; // sempre "#RRGGBB"
  valor: number;
  percentual: number; // inteiro, 0 a 100
};

export function saidasPorCategoria(
  lista: LancamentoComCategoria[],
  mes: MesISO,
  maximoDeItens = 6,
): FatiaDeCategoria[] {
  const grupos = new Map<string, { nome: string; cor: string; centavos: number }>();
  for (const l of lancamentosDoMes(lista, mes)) {
    if (l.tipo !== "saida") continue;
    const chave = l.categoria ? String(l.categoria.id) : "sem-categoria";
    const grupo = grupos.get(chave) ?? {
      nome: l.categoria?.nome ?? "Sem categoria",
      cor: l.categoria?.cor ?? COR_NEUTRA,
      centavos: 0,
    };
    grupo.centavos += Math.round(l.valor * 100);
    grupos.set(chave, grupo);
  }

  const ordenados = [...grupos.entries()]
    .map(([chave, g]) => ({ chave, ...g }))
    .sort((a, b) => b.centavos - a.centavos || a.nome.localeCompare(b.nome, "pt-BR"));

  const totalCentavos = ordenados.reduce((soma, g) => soma + g.centavos, 0);
  if (totalCentavos === 0) return [];

  // Se só sobraria UMA categoria para virar "Outras", mostra ela mesma (fica mais claro)
  const corte = ordenados.length - maximoDeItens === 1 ? ordenados.length : maximoDeItens;
  const principais = ordenados.slice(0, corte);
  const resto = ordenados.slice(corte);
  if (resto.length > 0) {
    principais.push({
      chave: "outras",
      nome: `Outras (${resto.length})`,
      cor: COR_NEUTRA,
      centavos: resto.reduce((soma, g) => soma + g.centavos, 0),
    });
  }

  return principais.map((g) => ({
    chave: g.chave,
    nome: g.nome,
    cor: g.cor,
    valor: g.centavos / 100,
    percentual: Math.round((g.centavos / totalCentavos) * 100),
  }));
}

// ---------------------------------------------------------------------------
// Evolução: entradas e saídas dos últimos meses (do mais antigo para o mais novo)
// ---------------------------------------------------------------------------

export type PontoDoMes = {
  mes: MesISO;
  rotulo: string; // "Nov"
  entradas: number;
  saidas: number;
  saldo: number;
  emAndamento: boolean; // é o mês de hoje (ainda não terminou)
};

export function serieMensal(
  lista: LancamentoComCategoria[],
  mesFinal: MesISO,
  mesAtual: MesISO,
  quantidade = 6,
): PontoDoMes[] {
  const meses: MesISO[] = [];
  let m = mesFinal;
  for (let i = 0; i < quantidade; i++) {
    meses.unshift(m);
    m = mesAnterior(m);
  }
  return meses.map((mes) => {
    const r = resumoDoMes(lista, mes);
    return {
      mes,
      rotulo: mesAbreviado(mes),
      entradas: r.entradas,
      saidas: r.saidas,
      saldo: r.saldo,
      emAndamento: mes === mesAtual,
    };
  });
}

// Escala do gráfico de colunas: valores "redondos" no eixo (ex.: 0, 2.500, 5.000, 7.500)
export function escalaDoGrafico(maiorValor: number): { maximo: number; marcas: number[] } {
  if (!Number.isFinite(maiorValor) || maiorValor <= 0) return { maximo: 1000, marcas: [0, 500, 1000] };

  const bruto = maiorValor / 3;
  const grandeza = 10 ** Math.floor(Math.log10(bruto));
  const resto = bruto / grandeza;
  const passo = (resto <= 1 ? 1 : resto <= 2 ? 2 : resto <= 2.5 ? 2.5 : resto <= 5 ? 5 : 10) * grandeza;
  const maximo = Math.ceil(maiorValor / passo) * passo;

  const marcas: number[] = [];
  for (let v = 0; v <= maximo + 1e-9; v += passo) marcas.push(Math.round(v * 100) / 100);
  return { maximo, marcas };
}

// Texto do eixo: inteiro até 9.999 e "10 mil" a partir daí
export function rotuloDoEixo(valor: number): string {
  return valor >= 10000
    ? `${(valor / 1000).toLocaleString("pt-BR")} mil`
    : valor.toLocaleString("pt-BR");
}
