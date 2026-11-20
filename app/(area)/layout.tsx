import { MenuLink } from "@/components/menu-link";
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
          <MenuLink href="/lancamentos">Lançamentos</MenuLink>
          <MenuLink href="/categorias" tambem={["/categoria"]}>
            Categorias
          </MenuLink>
          <MenuLink href="/dashboard">Dashboard</MenuLink>
          <form action={sair}>
            <button type="submit">Sair</button>
          </form>
        </nav>
      )}
      <div className="conteudo">{children}</div>
    </>
  );
}
