import Link from "next/link";
import type { Categoria } from "@/lib/categorias";

type CategoriaCardProps = {
  dados: Categoria;
};

export function CategoriaCard({ dados }: CategoriaCardProps) {
  return (
    <li className="card card-categoria">
      {/* a cor já foi conferida (#RRGGBB) ao ler do banco, então é segura para usar no estilo */}
      <span className="bolinha-cor" style={{ backgroundColor: dados.cor }} aria-hidden="true" />
      <Link href={`/categoria/${dados.id}`}>
        <strong>{dados.nome}</strong>
      </Link>
      <span className="tipo-categoria">{dados.tipo === "entrada" ? "Entrada" : "Saída"}</span>
      <Link href={`/categoria/${dados.id}/editar`} className="link-botao secundario">
        Editar
      </Link>
    </li>
  );
}
