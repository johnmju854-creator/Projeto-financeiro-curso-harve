import Link from "next/link";
import { exigirUsuario } from "@/lib/auth";
import { listarCategorias, type Categoria } from "@/lib/categorias";

export const dynamic = "force-dynamic";

// Uma tabela com as categorias de um tipo (o título deixa claro se são de saída ou de entrada)
function TabelaCategorias({ titulo, categorias }: { titulo: string; categorias: Categoria[] }) {
  if (categorias.length === 0) return null;

  return (
    <section className="secao">
      <h2 className="titulo-secao">{titulo}</h2>
      <div className="tabela-wrap">
        <table className="tabela">
          <tbody>
            {categorias.map((c) => (
              <tr key={c.id}>
                <td>
                  <span className="categoria-celula">
                    {/* a cor já foi conferida (#RRGGBB) ao ler do banco, então é segura no estilo */}
                    <span
                      className="bolinha-cor"
                      style={{ backgroundColor: c.cor }}
                      aria-hidden="true"
                    />
                    <Link href={`/categoria/${c.id}`} className="nome">
                      {c.nome}
                    </Link>
                  </span>
                </td>
                <td className="acoes">
                  <Link href={`/categoria/${c.id}/editar`}>Editar</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default async function CategoriasPage() {
  const usuario = await exigirUsuario();
  const categorias = await listarCategorias(usuario.id);

  return (
    <section>
      <div className="cabecalho-pagina">
        <h1>Categorias</h1>
        <p>
          <Link href="/categorias/nova" className="link-botao">
            + Nova categoria
          </Link>
        </p>
      </div>

      {categorias.length === 0 ? (
        <div className="vazio">
          <p>Você ainda não tem nenhuma categoria.</p>
        </div>
      ) : (
        <>
          <TabelaCategorias
            titulo="Categorias de saída"
            categorias={categorias.filter((c) => c.tipo === "saida")}
          />
          <TabelaCategorias
            titulo="Categorias de entrada"
            categorias={categorias.filter((c) => c.tipo === "entrada")}
          />
        </>
      )}
    </section>
  );
}
