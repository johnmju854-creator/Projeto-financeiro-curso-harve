import Link from "next/link";
import { notFound } from "next/navigation";
import { BotaoExcluir } from "@/components/botao-excluir";
import { FormularioCategoria } from "@/components/formulario-categoria";
import { exigirUsuario } from "@/lib/auth";
import { buscarCategoria } from "@/lib/categorias";
import { idDaUrlValido } from "@/lib/lancamentos-utils";
import { editarCategoria, excluirCategoria } from "../../../categorias/actions";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EditarCategoriaPage({ params }: Props) {
  const usuario = await exigirUsuario();
  const { id } = await params;
  if (!idDaUrlValido(id)) notFound();

  const categoria = await buscarCategoria(usuario.id, id);
  if (!categoria) notFound();

  return (
    <section>
      <h1>Editar categoria</h1>
      <FormularioCategoria
        // bind(null, id): a action já "sabe" qual categoria está sendo editada
        acao={editarCategoria.bind(null, id)}
        valoresIniciais={{ nome: categoria.nome, tipo: categoria.tipo, cor: categoria.cor }}
        textoBotao="Salvar alterações"
      />

      <h2>Excluir</h2>
      <BotaoExcluir
        acao={excluirCategoria.bind(null, id)}
        rotulo="Excluir categoria"
        aviso="Tem certeza que quer excluir esta categoria? Os lançamentos dela não são apagados, mas ficam sem categoria. Isso não pode ser desfeito."
      />

      <p>
        <Link href="/categorias">← Voltar para as categorias</Link>
      </p>
    </section>
  );
}
