// SÓ PARA O SERVIDOR: descobre quem está logado.
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// cache(): na mesma visita, a pergunta ao Supabase é feita uma vez só
export const obterUsuario = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

// Para páginas privadas: se não estiver logado, manda para /login
export async function exigirUsuario() {
  const usuario = await obterUsuario();
  if (!usuario) redirect("/login");
  return usuario;
}
