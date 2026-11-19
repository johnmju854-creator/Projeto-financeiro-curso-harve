import { FormularioCategoria } from "@/components/formulario-categoria";
import { exigirUsuario } from "@/lib/auth";
import { COR_PADRAO } from "@/lib/categorias-utils";
import { criarCategoria } from "../actions";

export const dynamic = "force-dynamic";

export default async function NovaCategoriaPage() {
  await exigirUsuario();

  return (
    <section>
      <h1>Nova categoria</h1>
      <FormularioCategoria
        acao={criarCategoria}
        valoresIniciais={{ nome: "", tipo: "saida", cor: COR_PADRAO }}
        textoBotao="Salvar categoria"
      />
    </section>
  );
}
