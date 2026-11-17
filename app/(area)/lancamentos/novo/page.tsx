import Link from "next/link";
import { FormularioLancamento } from "@/components/formulario-lancamento";
import { exigirUsuario } from "@/lib/auth";
import { listarCategorias } from "@/lib/categorias";
import { listarContas } from "@/lib/contas";
import { hojeISO } from "@/lib/lancamentos-utils";
import { criarLancamento } from "../actions";

export const dynamic = "force-dynamic";

// Server Component: busca as contas e categorias DE QUEM ESTÁ LOGADO e entrega ao formulário
export default async function NovoLancamentoPage() {
  const usuario = await exigirUsuario();
  const [contas, categorias] = await Promise.all([
    listarContas(usuario.id),
    listarCategorias(usuario.id),
  ]);

  return (
    <section>
      <h1>Novo lançamento</h1>
      <FormularioLancamento
        acao={criarLancamento}
        contas={contas}
        categorias={categorias}
        valoresIniciais={{
          descricao: "",
          valor: "",
          tipo: "saida",
          data: hojeISO(),
          contaId: "",
          categoriaId: "",
        }}
        textoBotao="Salvar lançamento"
      />
      <p>
        <Link href="/lancamentos">← Voltar para a lista</Link>
      </p>
    </section>
  );
}
