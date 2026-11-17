"use client";

// Tela mostrada quando algo dá errado ao carregar uma página desta área (ex.: a busca de dados falhou).
// O Next exige que este arquivo seja de cliente.
export default function Erro({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section role="alert">
      <h1>Não deu para carregar</h1>
      <p>Algo deu errado ao buscar seus dados. Tente de novo em instantes.</p>
      <button type="button" onClick={() => reset()}>
        Tentar de novo
      </button>
    </section>
  );
}
