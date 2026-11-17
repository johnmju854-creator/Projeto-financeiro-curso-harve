import Link from "next/link";
import { obterUsuario } from "@/lib/auth";
import { sair } from "./login/actions";

export default async function AreaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // O menu (e o botão Sair) só aparecem para quem está logado; a tela /login fica "limpa"
  const usuario = await obterUsuario();

  return (
    <>
      {usuario && (
        <nav className="menu">
          <Link href="/lancamentos">Lançamentos</Link>
          <Link href="/categorias">Categorias</Link>
          <Link href="/dashboard">Dashboard</Link>
          <form action={sair}>
            <button type="submit">Sair</button>
          </form>
        </nav>
      )}
      <div className="conteudo">{children}</div>
    </>
  );
}
