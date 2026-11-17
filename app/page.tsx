import Link from "next/link";

export default function Home() {
  return (
    <main>
      <h1>Caderneta da Claudia</h1>
      <p>Um app simples para controlar suas entradas e saídas de dinheiro.</p>
      <p>
        <Link href="/lancamentos">Ver meus lançamentos</Link>
      </p>
    </main>
  );
}
