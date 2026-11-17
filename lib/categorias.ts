// SÓ PARA O SERVIDOR: busca as categorias REAIS do usuário no Supabase.
// Não importe em componentes com "use client".
// (O arquivo lib/categorias.json, com as categorias de exemplo, não é mais usado.)
import { createClient } from "@/lib/supabase/server";
import { lerItemComNome, type IdBanco, type ItemComNome } from "./lancamentos-utils.ts";

export type Categoria = ItemComNome;

// Categorias do usuário logado, em ordem alfabética (filtra por user_id; o RLS garante de novo)
export async function listarCategorias(userId: string): Promise<Categoria[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categorias")
    .select("id, nome")
    .eq("user_id", userId)
    .order("nome", { ascending: true });

  if (error) {
    console.error("Erro ao listar categorias:", error.message);
    throw new Error("Falha ao buscar as categorias.");
  }
  const linhas = (data ?? []) as Record<string, unknown>[];
  return linhas.map(lerItemComNome).filter((c): c is Categoria => c !== null);
}

// Uma categoria do usuário (undefined se não existir ou for de outra pessoa)
export async function buscarCategoria(
  userId: string,
  id: IdBanco,
): Promise<Categoria | undefined> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categorias")
    .select("id, nome")
    .eq("user_id", userId)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    if (error.code === "22P02") return undefined; // id com formato inválido = não encontrada
    console.error("Erro ao buscar categoria:", error.message);
    throw new Error("Falha ao buscar a categoria.");
  }
  return data ? (lerItemComNome(data as Record<string, unknown>) ?? undefined) : undefined;
}
