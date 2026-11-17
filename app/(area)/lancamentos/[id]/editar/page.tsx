import Link from "next/link";
import { notFound } from "next/navigation";
import { BotaoExcluir } from "@/components/botao-excluir";
import { FormularioLancamento } from "@/components/formulario-lancamento";
import { exigirUsuario } from "@/lib/auth";
import { listarCategorias } from "@/lib/categorias";
import { listarContas } from "@/lib/contas";
import { buscarLancamento } from "@/lib/lancamentos";
import { idDaUrlValido, valorParaCampo } from "@/lib/lancamentos-utils";
import { editarLancamento, excluirLancamento } from "../../actions";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EditarLancamentoPage({ params }: Props) {
  const usuario = await exigirUsuario();
  const { id } = await params;
  if (!idDaUrlValido(id)) notFound();

  const lancamento = await buscarLancamento(usuario.id, id);
  if (!lancamento) notFound();

  const [contas, categorias] = await Promise.all([
    listarContas(usuario.id),
    listarCategorias(usuario.id),
  ]);

  return (
    <section>
      <h1>Editar lançamento</h1>
      <FormularioLancamento
        // bind(null, id): a action já "sabe" qual lançamento está sendo editado
        acao={editarLancamento.bind(null, id)}
        contas={contas}
        categorias={categorias}
        valoresIniciais={{
          descricao: lancamento.descricao ?? "",
          valor: valorParaCampo(lancamento.valor),
          tipo: lancamento.tipo,
          data: lancamento.data,
          contaId: lancamento.contaId !== undefined ? String(lancamento.contaId) : "",
          categoriaId:
            lancamento.categoriaId !== undefined ? String(lancamento.categoriaId) : "",
        }}
        textoBotao="Salvar alterações"
      />

      <h2>Excluir</h2>
      <BotaoExcluir acao={excluirLancamento.bind(null, id)} />

      <p>
        <Link href={`/lancamentos/${id}`}>← Voltar para o lançamento</Link>
      </p>
    </section>
  );
}
