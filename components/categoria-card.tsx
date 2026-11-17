import Link from "next/link";
import type { Categoria } from "@/lib/categorias";

type CategoriaCardProps = {
  dados: Categoria;
};

export function CategoriaCard({ dados }: CategoriaCardProps) {
  return (
    <li className="card">
      <Link href={`/categoria/${dados.id}`}>
        <strong>{dados.nome}</strong>
      </Link>
    </li>
  );
}
