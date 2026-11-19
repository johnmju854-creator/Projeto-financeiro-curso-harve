// SÓ PARA O SERVIDOR: busca, grava, edita e exclui as categorias REAIS do usuário no Supabase.
// Não importe em componentes com "use client" (use lib/categorias-utils.ts).
// (O arquivo lib/categorias.json, com as categorias de exemplo, não é mais usado.)
import { createClient } from "@/lib/supabase/server";
import {
  ERRO_NAO_ENCONTRADA,
  ERRO_NOME_REPETIDO,
  lerCategoria,
  type Categoria,
  type DadosCategoria,
} from "./categorias-utils.ts";
import type { IdBanco } from "./lancamentos-utils.ts";
import type { ResultadoGravacao } from "./lancamentos.ts";

export type { Categoria };

const COLUNAS = "id, nome, tipo, cor";

// Categorias do usuário logado, em ordem alfabética (filtra por user_id; o RLS garante de novo)
export async function listarCategorias(userId: string): Promise<Categoria[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categorias")
    .select(COLUNAS)
    .eq("user_id", userId)
    .order("nome", { ascending: true });

  if (error) {
    console.error("Erro ao listar categorias:", error.message);
    throw new Error("Falha ao buscar as categorias.");
  }
  const linhas = (data ?? []) as Record<string, unknown>[];
  return linhas.map(lerCategoria).filter((c): c is Categoria => c !== null);
}

// Uma categoria do usuário (undefined se não existir ou for de outra pessoa)
export async function buscarCategoria(
  userId: string,
  id: IdBanco,
): Promise<Categoria | undefined> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categorias")
    .select(COLUNAS)
    .eq("user_id", userId)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    if (error.code === "22P02") return undefined; // id com formato inválido = não encontrada
    console.error("Erro ao buscar categoria:", error.message);
    throw new Error("Falha ao buscar a categoria.");
  }
  return data ? (lerCategoria(data as Record<string, unknown>) ?? undefined) : undefined;
}

// ---------------------------------------------------------------------------
// Gravar, editar e excluir. Os dados JÁ chegam conferidos (validarCategoria).
// ---------------------------------------------------------------------------

// Traduz o erro do banco para uma frase simples (o detalhe técnico fica só no terminal)
function traduzirErro(codigo: string | undefined): string {
  if (codigo === "23505") return ERRO_NOME_REPETIDO; // índice único: mesmo nome para a mesma pessoa
  if (codigo === "23514" || codigo === "22P02") return "Algum dos dados está em um formato inválido.";
  return "Não foi possível salvar agora. Tente de novo em instantes.";
}

// Grava uma categoria nova SEMPRE com o user_id de quem está logado
export async function inserirCategoria(
  userId: string,
  dados: DadosCategoria,
): Promise<ResultadoGravacao> {
  const supabase = await createClient();
  const { error } = await supabase.from("categorias").insert({ user_id: userId, ...dados });

  if (error) {
    console.error("Erro ao inserir categoria:", error.code, error.message);
    return { ok: false, erro: traduzirErro(error.code) };
  }
  return { ok: true };
}

// Altera uma categoria do usuário (se não for dele ou não existir, nada muda e avisamos)
export async function atualizarCategoria(
  userId: string,
  id: IdBanco,
  dados: DadosCategoria,
): Promise<ResultadoGravacao> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categorias")
    .update(dados)
    .eq("id", id)
    .eq("user_id", userId)
    .select("id");

  if (error) {
    console.error("Erro ao atualizar categoria:", error.code, error.message);
    return { ok: false, erro: traduzirErro(error.code) };
  }
  if (!data || data.length === 0) return { ok: false, erro: ERRO_NAO_ENCONTRADA };
  return { ok: true };
}

// Exclui uma categoria do usuário (os lançamentos dela ficam "sem categoria")
export async function removerCategoria(
  userId: string,
  id: IdBanco,
): Promise<ResultadoGravacao> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categorias")
    .delete()
    .eq("id", id)
    .eq("user_id", userId)
    .select("id");

  if (error) {
    console.error("Erro ao excluir categoria:", error.code, error.message);
    return { ok: false, erro: "Não foi possível excluir agora. Tente de novo em instantes." };
  }
  if (!data || data.length === 0) return { ok: false, erro: ERRO_NAO_ENCONTRADA };
  return { ok: true };
}
