"use server";

// Ações de login, cadastro e saída. Rodam no servidor (Server Actions), sem rotas de API.
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function lerCampos(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const senha = String(formData.get("senha") ?? "");
  return { email, senha };
}

export async function entrar(formData: FormData) {
  const { email, senha } = lerCampos(formData);
  if (!email || !senha) redirect("/login?erro=campos");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
  if (error) redirect("/login?erro=credenciais");

  redirect("/lancamentos");
}

export async function cadastrar(formData: FormData) {
  const { email, senha } = lerCampos(formData);
  if (!email || !senha) redirect("/login?erro=campos");
  if (senha.length < 6) redirect("/login?erro=senha-curta");

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({ email, password: senha });
  if (error) redirect("/login?erro=cadastro");

  // Com "Confirm email" ligado no Supabase não vem sessão: a pessoa precisa confirmar o e-mail antes
  redirect(data.session ? "/lancamentos" : "/login?aviso=confirmar");
}

export async function sair() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login?aviso=saiu");
}
