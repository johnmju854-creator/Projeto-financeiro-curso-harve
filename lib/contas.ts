// SÓ PARA O SERVIDOR: busca as contas REAIS do usuário no Supabase.
// Não importe em componentes com "use client".
import { createClient } from "@/lib/supabase/server";
import { lerItemComNome, type IdBanco, type ItemComNome } from "./lancamentos-utils.ts";

export type Conta = ItemComNome;

// Contas do usuário logado, em ordem alfabética (filtra por user_id; o RLS garante de novo)
export async function listarContas(userId: string): Promise<Conta[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("contas")
    .select("id, nome")
    .eq("user_id", userId)
    .order("nome", { ascending: true });

  if (error) {
    console.error("Erro ao listar contas:", error.message);
    throw new Error("Falha ao buscar as contas.");
  }
  const linhas = (data ?? []) as Record<string, unknown>[];
  return linhas.map(lerItemComNome).filter((c): c is Conta => c !== null);
}

// Uma conta do usuário (undefined se não existir ou for de outra pessoa)
export async function buscarConta(userId: string, id: IdBanco): Promise<Conta | undefined> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("contas")
    .select("id, nome")
    .eq("user_id", userId)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    if (error.code === "22P02") return undefined; // id com formato inválido = não encontrada
    console.error("Erro ao buscar conta:", error.message);
    throw new Error("Falha ao buscar a conta.");
  }
  return data ? (lerItemComNome(data as Record<string, unknown>) ?? undefined) : undefined;
}
