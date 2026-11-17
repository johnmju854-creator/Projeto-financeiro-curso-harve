// SÓ PARA O SERVIDOR: busca os lançamentos REAIS no Supabase.
// Não importe este arquivo em componentes com "use client" (use lib/lancamentos-utils.ts).
// Toda busca filtra por user_id (e o RLS do banco garante isso de novo, por segurança).
import { createClient } from "@/lib/supabase/server";
import {
  DadosLancamento,
  IdBanco,
  LancamentoComCategoria,
  lerLinhaDoBanco,
} from "./lancamentos-utils.ts";

// Colunas da tabela lancamentos + o nome da categoria (relação categoria_id -> categorias)
const COLUNAS =
  "id, tipo, valor, data_lancamento, descricao, categoria_id, conta_id, categorias(nome)";

// Converte as linhas do banco; linha inválida é descartada com aviso no terminal do servidor
function lerLinhas(linhas: Record<string, unknown>[] | null): LancamentoComCategoria[] {
  const validos: LancamentoComCategoria[] = [];
  for (const linha of linhas ?? []) {
    const l = lerLinhaDoBanco(linha);
    if (l) validos.push(l);
    else console.warn("Lançamento inválido ignorado:", linha.id);
  }
  return validos;
}

// Lançamentos do usuário, do mais recente para o mais antigo
export async function listarLancamentos(userId: string): Promise<LancamentoComCategoria[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("lancamentos")
    .select(COLUNAS)
    .eq("user_id", userId)
    .order("data_lancamento", { ascending: false })
    .order("id", { ascending: false });

  if (error) {
    console.error("Erro ao listar lançamentos:", error.message);
    throw new Error("Falha ao buscar os lançamentos.");
  }
  return lerLinhas(data as Record<string, unknown>[] | null);
}

// Um lançamento do usuário (undefined se não existir ou se for de outra pessoa)
export async function buscarLancamento(
  userId: string,
  id: IdBanco,
): Promise<LancamentoComCategoria | undefined> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("lancamentos")
    .select(COLUNAS)
    .eq("user_id", userId)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    // 22P02 = "id com formato inválido" (ex.: /lancamentos/abc): para a pessoa é só "não encontrado"
    if (error.code === "22P02") return undefined;
    console.error("Erro ao buscar lançamento:", error.message);
    throw new Error("Falha ao buscar o lançamento.");
  }
  return data ? (lerLinhaDoBanco(data as Record<string, unknown>) ?? undefined) : undefined;
}

// Lançamentos do usuário que pertencem a uma categoria
export async function lancamentosDaCategoria(
  userId: string,
  categoriaId: IdBanco,
): Promise<LancamentoComCategoria[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("lancamentos")
    .select(COLUNAS)
    .eq("user_id", userId)
    .eq("categoria_id", categoriaId)
    .order("data_lancamento", { ascending: false })
    .order("id", { ascending: false });

  if (error) {
    console.error("Erro ao listar lançamentos da categoria:", error.message);
    throw new Error("Falha ao buscar os lançamentos da categoria.");
  }
  return lerLinhas(data as Record<string, unknown>[] | null);
}

// ---------------------------------------------------------------------------
// Gravar, editar e excluir. Os dados JÁ chegam conferidos (validarLancamento).
// Cada função devolve { ok: true } ou { ok: false, erro } em vez de lançar erro.
// ---------------------------------------------------------------------------

export type ResultadoGravacao = { ok: true } | { ok: false; erro: string };

const ERRO_GENERICO = "Não foi possível salvar agora. Tente de novo em instantes.";

// Traduz o erro do banco para uma frase simples (o detalhe técnico fica só no terminal do servidor)
function traduzirErro(codigo: string | undefined): string {
  if (codigo === "23503") return "A conta ou a categoria escolhida não existe mais.";
  if (codigo === "22P02") return "Algum dos dados está em um formato inválido.";
  return ERRO_GENERICO;
}

function colunasParaGravar(dados: DadosLancamento) {
  return {
    descricao: dados.descricao,
    valor: dados.valor,
    tipo: dados.tipo,
    data_lancamento: dados.data,
    conta_id: dados.contaId,
    categoria_id: dados.categoriaId,
  };
}

// Grava um lançamento novo SEMPRE com o user_id de quem está logado
export async function inserirLancamento(
  userId: string,
  dados: DadosLancamento,
): Promise<ResultadoGravacao> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("lancamentos")
    .insert({ user_id: userId, ...colunasParaGravar(dados) });

  if (error) {
    console.error("Erro ao inserir lançamento:", error.code, error.message);
    return { ok: false, erro: traduzirErro(error.code) };
  }
  return { ok: true };
}

// Altera um lançamento do usuário (se não for dele ou não existir, nada muda e avisamos)
export async function atualizarLancamento(
  userId: string,
  id: IdBanco,
  dados: DadosLancamento,
): Promise<ResultadoGravacao> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("lancamentos")
    .update(colunasParaGravar(dados))
    .eq("id", id)
    .eq("user_id", userId)
    .select("id");

  if (error) {
    console.error("Erro ao atualizar lançamento:", error.code, error.message);
    return { ok: false, erro: traduzirErro(error.code) };
  }
  if (!data || data.length === 0) {
    return { ok: false, erro: "Lançamento não encontrado." };
  }
  return { ok: true };
}

// Exclui um lançamento do usuário
export async function removerLancamento(
  userId: string,
  id: IdBanco,
): Promise<ResultadoGravacao> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("lancamentos")
    .delete()
    .eq("id", id)
    .eq("user_id", userId)
    .select("id");

  if (error) {
    console.error("Erro ao excluir lançamento:", error.code, error.message);
    return { ok: false, erro: "Não foi possível excluir agora. Tente de novo em instantes." };
  }
  if (!data || data.length === 0) {
    return { ok: false, erro: "Lançamento não encontrado." };
  }
  return { ok: true };
}
