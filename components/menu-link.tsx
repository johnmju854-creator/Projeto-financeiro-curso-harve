"use client";

// Link do menu que marca em qual página a pessoa está (aria-current="page").
import Link from "next/link";
import { usePathname } from "next/navigation";

type MenuLinkProps = {
  href: string;
  children: React.ReactNode;
  // outras rotas que também contam como "estar nesta página" (ex.: /categoria/3 pertence a Categorias)
  tambem?: string[];
};

export function MenuLink({ href, children, tambem = [] }: MenuLinkProps) {
  const caminho = usePathname() ?? "";
  const ativo = [href, ...tambem].some((r) => caminho === r || caminho.startsWith(`${r}/`));

  return (
    <Link href={href} aria-current={ativo ? "page" : undefined}>
      {children}
    </Link>
  );
}
