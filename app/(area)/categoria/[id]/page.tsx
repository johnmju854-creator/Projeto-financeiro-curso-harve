import Link from "next/link";
import { notFound } from "next/navigation";
import { TabelaLancamentos } from "@/components/tabela-lancamentos";
import { exigirUsuario } from "@/lib/auth";
import { buscarCategoria } from "@/lib/categorias";
import { lancamentosDaCategoria } from "@/lib/lancamentos";
import { rotuloTipo } from "@/lib/lancamentos-utils";

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
      <div className="cabecalho-pagina">
        <h1>
          {categoria.nome} <span className={`selo ${categoria.tipo}`}>{rotuloTipo(categoria.tipo)}</span>
        </h1>
        <p>
          <Link href={`/categoria/${categoria.id}/editar`} className="link-botao secundario">
            Editar categoria
          </Link>
        </p>
      </div>

      <h2 className="titulo-secao">Lançamentos desta categoria</h2>
      {lancamentos.length === 0 ? (
        <div className="vazio">
          <p>Nenhum lançamento nesta categoria ainda.</p>
        </div>
      ) : (
        <TabelaLancamentos lancamentos={lancamentos} mostrarSinal />
      )}

      <p className="acoes-pagina">
        <Link href="/categorias">← Voltar para as categorias</Link>
      </p>
    </section>
  );
}
