// Parte PURA e compartilhada dos lançamentos: tipos, validação, filtro, soma e formatação.
// Não tem dados nem acesso a banco, então é seguro importar também em componentes de cliente.
// (Os dados e a busca ficam em lib/lancamentos.ts, que é só do servidor.)

export type TipoLancamento = "entrada" | "saida";

// O id no banco pode ser número (bigint) ou texto (uuid); tratamos como um valor "opaco"
export type IdBanco = number | string;

export type Lancamento = {
  id: IdBanco;
  descricao: string | null; // no banco a descrição pode ser vazia (NULL)
  valor: number;
  tipo: TipoLancamento;
  data: string; // sempre "AAAA-MM-DD"
  categoriaId?: IdBanco; // opcional: nem todo lançamento tem categoria
  contaId?: IdBanco; // em qual conta foi lançado (usado na tela de editar)
};

export type CategoriaResumo = { id: IdBanco; nome: string };

// Lançamento já com o nome da categoria resolvido no servidor (dados simples, fáceis de enviar ao cliente)
export type LancamentoComCategoria = Lancamento & { categoria?: CategoriaResumo };

export type FiltroTipo = "todos" | TipoLancamento;

// Deixa o texto em minúsculas e sem acento, para a busca ignorar "Salário" x "salario"
export function normalizar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

// Porta de entrada dos dados: confere um registro "bruto" (vindo de banco/API) e devolve um
// Lancamento limpo, ou null se o registro for inválido (assim um dado ruim não derruba a tela).
function lerId(valor: unknown): IdBanco | null {
  if (typeof valor === "number" && Number.isInteger(valor)) return valor;
  if (typeof valor === "string" && valor.trim() !== "") return valor.trim();
  return null;
}

export function lerLancamento(bruto: Record<string, unknown>): Lancamento | null {
  const id = lerId(bruto.id);
  if (id === null) return null;

  const tipo = typeof bruto.tipo === "string" ? normalizar(bruto.tipo) : "";
  if (tipo !== "entrada" && tipo !== "saida") return null;

  const valor = typeof bruto.valor === "string" ? Number(bruto.valor) : bruto.valor;
  if (typeof valor !== "number" || !Number.isFinite(valor) || valor <= 0) return null;

  // aceita "2025-01-01" e também "2025-01-01T00:00:00Z" (fica só a parte da data)
  const data = typeof bruto.data === "string" ? bruto.data.slice(0, 10) : "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) return null;

  const lancamento: Lancamento = {
    id,
    descricao: typeof bruto.descricao === "string" ? bruto.descricao : null,
    valor,
    tipo,
    data,
  };
  const categoriaId = lerId(bruto.categoriaId);
  if (categoriaId !== null) lancamento.categoriaId = categoriaId;
  const contaId = lerId(bruto.contaId);
  if (contaId !== null) lancamento.contaId = contaId;
  return lancamento;
}

// Converte UMA linha como o Supabase devolve (colunas do banco + categoria embutida)
// em um lançamento limpo, já com o nome da categoria. Linha inválida vira null.
// Ex.: { id, tipo, valor, data_lancamento, descricao, categoria_id, categorias: { nome } }
export function lerLinhaDoBanco(linha: Record<string, unknown>): LancamentoComCategoria | null {
  const lancamento = lerLancamento({
    id: linha.id,
    descricao: linha.descricao,
    valor: linha.valor,
    tipo: linha.tipo,
    data: linha.data_lancamento,
    categoriaId: linha.categoria_id,
    contaId: linha.conta_id,
  });
  if (!lancamento) return null;

  // O Supabase devolve a categoria embutida como objeto (ou lista, dependendo da relação)
  const embutida = Array.isArray(linha.categorias) ? linha.categorias[0] : linha.categorias;
  const nome =
    embutida && typeof embutida === "object"
      ? (embutida as { nome?: unknown }).nome
      : undefined;

  if (lancamento.categoriaId !== undefined && typeof nome === "string" && nome.trim() !== "") {
    return { ...lancamento, categoria: { id: lancamento.categoriaId, nome } };
  }
  return lancamento;
}

// Texto para mostrar na tela: descrição vazia, nula ou só espaços vira "(sem descrição)"
export function descricaoExibida(l: { descricao: string | null }): string {
  const texto = l.descricao?.trim();
  return texto ? texto : "(sem descrição)";
}

// Filtra pela descrição (o que a Claudia digitou) e pelo tipo (todos, entrada ou saida)
export function filtrarLancamentos<T extends Lancamento>(
  lista: T[],
  busca: string,
  tipo: FiltroTipo,
): T[] {
  const termo = normalizar(busca);
  return lista.filter(
    (l) =>
      (tipo === "todos" || l.tipo === tipo) &&
      normalizar(l.descricao ?? "").includes(termo),
  );
}

// Especificação: recebe a lista JÁ filtrada e soma só as saídas (entradas não entram).
// Ex.: digitando "mer" sobra só "mercado do mes" -> total 341.43.
// Soma em centavos para evitar erros de ponto flutuante (0.1 + 0.2).
// Valores que não são número (NaN, Infinity) são ignorados, para nunca mostrar "R$ NaN".
export function totalDeSaidas(lista: Lancamento[]): number {
  const centavos = lista
    .filter((l) => l.tipo === "saida" && Number.isFinite(l.valor))
    .reduce((soma, l) => soma + Math.round(l.valor * 100), 0);
  return centavos / 100;
}

export function formatarValor(valor: number): string {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function formatarData(data: string): string {
  const [ano, mes, dia] = data.slice(0, 10).split("-");
  return `${dia}/${mes}/${ano}`;
}

// ---------------------------------------------------------------------------
// Formulário de lançamento (criar e editar): tipos e validação.
// Tudo aqui é puro (sem banco), então dá para testar sem Supabase.
// ---------------------------------------------------------------------------

// Item simples com id e nome (usado por contas e categorias)
export type ItemComNome = { id: IdBanco; nome: string };

export function lerItemComNome(linha: Record<string, unknown>): ItemComNome | null {
  const id = lerId(linha.id);
  if (id === null || typeof linha.nome !== "string") return null;
  return { id, nome: linha.nome };
}

// O que chega do formulário: tudo é texto
export type CamposFormulario = {
  descricao: string;
  valor: string;
  tipo: string;
  data: string;
  contaId: string;
  categoriaId: string; // "" = sem categoria
};

// Dados já conferidos e prontos para gravar
export type DadosLancamento = {
  descricao: string;
  valor: number;
  tipo: TipoLancamento;
  data: string; // "AAAA-MM-DD"
  contaId: string;
  categoriaId: string | null;
};

export type ResultadoValidacao =
  | { ok: true; dados: DadosLancamento }
  | { ok: false; erro: string };

// O que a Server Action devolve ao formulário: uma mensagem de erro e o que a pessoa digitou
export type EstadoFormulario = { erro?: string; valores?: CamposFormulario };

const DESCRICAO_MAXIMA = 200;
const VALOR_MAXIMO = 9_999_999_999.99;

// Aceita "12,50", "12.50", "1.234,56" e "1,234.56". Devolve null se não der para entender.
// Casos ambíguos ("1.234", que pode ser 1,234 ou 1234) e mais de 2 casas decimais são recusados.
export function lerValor(texto: string): number | null {
  let t = texto.trim().replace(/^R\$\s*/, "");
  if (t === "") return null;

  const ultimaVirgula = t.lastIndexOf(",");
  const ultimoPonto = t.lastIndexOf(".");
  if (ultimaVirgula > -1 && ultimoPonto > -1) {
    // os dois aparecem: o último é o separador decimal e o outro é separador de milhar
    t = ultimaVirgula > ultimoPonto ? t.replace(/\./g, "").replace(",", ".") : t.replace(/,/g, "");
  } else if (ultimaVirgula > -1) {
    t = t.replace(",", ".");
  } else if (/^\d{1,3}(\.\d{3})+$/.test(t)) {
    return null; // "1.234": não dá para saber se é milhar ou decimal
  }

  if (!/^\d+(\.\d{1,2})?$/.test(t)) return null;
  const numero = Number(t);
  return Number.isFinite(numero) ? numero : null;
}

function dataValida(data: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) return false;
  const ano = Number(data.slice(0, 4));
  if (ano < 1900 || ano > 2100) return false;
  const d = new Date(`${data}T00:00:00Z`);
  // "2025-02-30" vira 2025-03-02 no Date: se mudou, a data não existe
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === data;
}

function idValido(id: string): boolean {
  return /^[A-Za-z0-9_-]{1,64}$/.test(id);
}

export function validarLancamento(campos: CamposFormulario): ResultadoValidacao {
  const descricao = campos.descricao.trim();
  if (descricao === "") return { ok: false, erro: "Preencha a descrição." };
  if (descricao.length > DESCRICAO_MAXIMA) {
    return { ok: false, erro: `A descrição pode ter no máximo ${DESCRICAO_MAXIMA} caracteres.` };
  }

  const valor = lerValor(campos.valor);
  if (valor === null || valor <= 0 || valor > VALOR_MAXIMO) {
    return {
      ok: false,
      erro: "Digite um valor maior que zero, com no máximo 2 casas decimais (ex.: 12,50).",
    };
  }

  if (campos.tipo !== "entrada" && campos.tipo !== "saida") {
    return { ok: false, erro: "Escolha se é entrada ou saída." };
  }

  const data = campos.data.trim();
  if (!dataValida(data)) return { ok: false, erro: "Escolha uma data válida." };

  const contaId = campos.contaId.trim();
  if (!idValido(contaId)) return { ok: false, erro: "Escolha uma conta." };

  const categoriaId = campos.categoriaId.trim();
  if (categoriaId !== "" && !idValido(categoriaId)) {
    return { ok: false, erro: "Escolha uma categoria válida ou deixe sem categoria." };
  }

  return {
    ok: true,
    dados: {
      descricao,
      valor,
      tipo: campos.tipo,
      data,
      contaId,
      categoriaId: categoriaId === "" ? null : categoriaId,
    },
  };
}

// Valor para mostrar no campo ao editar: 341.43 -> "341,43"
export function valorParaCampo(valor: number): string {
  return valor.toFixed(2).replace(".", ",");
}

// Data de hoje no horário de Brasília ("AAAA-MM-DD"), para o formulário já vir com a data certa
export function hojeISO(): string {
  return new Date().toLocaleDateString("sv-SE", { timeZone: "America/Sao_Paulo" });
}

// Id vindo da URL (ex.: /lancamentos/ID/editar): só deixa passar um formato seguro
export function idDaUrlValido(id: string): boolean {
  return idValido(id);
}
