import Link from "next/link";
import { CategoriaCard } from "@/components/categoria-card";
import { exigirUsuario } from "@/lib/auth";
import { listarCategorias } from "@/lib/categorias";

export const dynamic = "force-dynamic";

export default async function CategoriasPage() {
  const usuario = await exigirUsuario();
  const categorias = await listarCategorias(usuario.id);

  return (
    <section>
      <h1>Categorias</h1>
      <p>
        <Link href="/categorias/nova" className="link-botao">
          Nova categoria
        </Link>
      </p>
      {categorias.length === 0 ? (
        <p>Você ainda não tem nenhuma categoria.</p>
      ) : (
        <ul className="lista">
          {categorias.map((c) => (
            <CategoriaCard key={c.id} dados={c} />
          ))}
        </ul>
      )}
    </section>
  );
}
