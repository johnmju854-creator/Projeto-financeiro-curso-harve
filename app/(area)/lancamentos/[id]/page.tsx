import Link from "next/link";
import { notFound } from "next/navigation";
import { exigirUsuario } from "@/lib/auth";
import { buscarLancamento } from "@/lib/lancamentos";
import {
  descricaoExibida,
  formatarData,
  formatarValor,
  rotuloTipo,
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
      <div className="cabecalho-pagina">
        <h1>
          {descricaoExibida(lancamento)}{" "}
          <span className={`selo ${lancamento.tipo}`}>{rotuloTipo(lancamento.tipo)}</span>
        </h1>
        <p>
          <Link href={`/lancamentos/${id}/editar`} className="link-botao">
            Editar
          </Link>
        </p>
      </div>

      <dl className="detalhes">
        <div>
          <dt>Valor</dt>
          <dd>{formatarValor(lancamento.valor)}</dd>
        </div>
        <div>
          <dt>Data</dt>
          <dd>{formatarData(lancamento.data)}</dd>
        </div>
        <div>
          <dt>Categoria</dt>
          <dd>
            {categoria ? (
              <Link href={`/categoria/${categoria.id}`} className="categoria-celula">
                {categoria.cor && (
                  <span
                    className="bolinha-cor"
                    style={{ backgroundColor: categoria.cor }}
                    aria-hidden="true"
                  />
                )}
                {categoria.nome}
              </Link>
            ) : (
              "—"
            )}
          </dd>
        </div>
      </dl>

      <p className="acoes-pagina">
        <Link href="/lancamentos">← Voltar para a lista</Link>
      </p>
    </section>
  );
}
