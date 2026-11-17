import Link from "next/link";
import { notFound } from "next/navigation";
import { LancamentoCard } from "@/components/lancamento-card";
import { exigirUsuario } from "@/lib/auth";
import { buscarCategoria } from "@/lib/categorias";
import { lancamentosDaCategoria } from "@/lib/lancamentos";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function CategoriaPage({ params }: Props) {
  const usuario = await exigirUsuario();
  const { id } = await params;
  const categoria = await buscarCategoria(usuario.id, id);

  if (!categoria) {
    notFound();
  }

  const lancamentos = await lancamentosDaCategoria(usuario.id, categoria.id);

  return (
    <section>
      <h1>{categoria.nome}</h1>

      <h2>Lançamentos desta categoria</h2>
      {lancamentos.length === 0 ? (
        <p>Nenhum lançamento nesta categoria ainda.</p>
      ) : (
        <ul className="lista">
          {lancamentos.map((l) => (
            <LancamentoCard key={l.id} dados={l} />
          ))}
        </ul>
      )}

      <Link href="/categorias">← Voltar para as categorias</Link>
    </section>
  );
}
