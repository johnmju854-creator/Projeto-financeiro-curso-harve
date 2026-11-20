import { redirect } from "next/navigation";
import { obterUsuario } from "@/lib/auth";
import { destinoInicial } from "@/lib/rotas-utils";

// Cada visita depende de quem está logado, então nunca pode ser guardada pronta
export const dynamic = "force-dynamic";

// A página inicial não mostra nada: leva direto ao painel (logado) ou ao login (não logado)
export default async function Home() {
  const usuario = await obterUsuario();
  redirect(destinoInicial(usuario !== null));
}
