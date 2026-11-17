import Link from "next/link";
import { notFound } from "next/navigation";
import { exigirUsuario } from "@/lib/auth";
import { buscarLancamento } from "@/lib/lancamentos";
import {
  descricaoExibida,
  formatarData,
  formatarValor,
} from "@/lib/lancamentos-utils";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function LancamentoPage({ params }: Props) {
  const usuario = await exigirUsuario();
  const { id } = await params;
  const lancamento = await buscarLancamento(usuario.id, id);

  if (!lancamento) {
    notFound();
  }

  const { categoria } = lancamento;

  return (
    <section>
      <h1>{descricaoExibida(lancamento)}</h1>
      <p>Valor: {formatarValor(lancamento.valor)}</p>
      <p>Tipo: {lancamento.tipo}</p>
      <p>Data: {formatarData(lancamento.data)}</p>
      <p>
        Categoria:{" "}
        {categoria ? (
          <Link href={`/categoria/${categoria.id}`}>{categoria.nome}</Link>
        ) : (
          "sem categoria"
        )}
      </p>
      <p>
        <Link href={`/lancamentos/${id}/editar`} className="link-botao">
          Editar lançamento
        </Link>
      </p>
      <Link href="/lancamentos">← Voltar para a lista</Link>
    </section>
  );
}
