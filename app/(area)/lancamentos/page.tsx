import Link from "next/link";
import { LancamentosFiltrados } from "@/components/lancamentos-filtrados";
import { exigirUsuario } from "@/lib/auth";
import { listarLancamentos } from "@/lib/lancamentos";

// Cada visita depende de quem está logado, então nunca pode ser guardada pronta
export const dynamic = "force-dynamic";

// Server Component: descobre quem está logado e busca só os lançamentos dessa pessoa.
// Se a busca falhar, quem responde é o app/(area)/error.tsx
export default async function LancamentosPage() {
  const usuario = await exigirUsuario(); // sem login: vai para /login
  const lancamentos = await listarLancamentos(usuario.id);

  return (
    <section>
      <div className="cabecalho-pagina">
        <h1>Lançamentos</h1>
        <p>
          <Link href="/lancamentos/novo" className="link-botao">
            + Novo lançamento
          </Link>
        </p>
      </div>
      <LancamentosFiltrados lancamentos={lancamentos} />
    </section>
  );
}
