"use client";

// Botão de excluir com confirmação: o primeiro clique só pergunta "tem certeza?".
// (Não usamos window.confirm porque ele não funciona bem em todos os navegadores embutidos.)
import { useActionState, useState } from "react";
import type { EstadoFormulario } from "@/lib/lancamentos-utils";

type BotaoExcluirProps = {
  acao: (estado: EstadoFormulario, formData: FormData) => Promise<EstadoFormulario>;
};

export function BotaoExcluir({ acao }: BotaoExcluirProps) {
  const [confirmando, setConfirmando] = useState(false);
  const [estado, formAction, excluindo] = useActionState(acao, {});

  if (!confirmando) {
    return (
      <button type="button" className="perigo" onClick={() => setConfirmando(true)}>
        Excluir lançamento
      </button>
    );
  }

  return (
    <form action={formAction} className="confirmar-exclusao" aria-busy={excluindo}>
      <p role="alert">Tem certeza que quer excluir este lançamento? Isso não pode ser desfeito.</p>
      {estado.erro && (
        <p role="alert" className="erro">
          {estado.erro}
        </p>
      )}
      <div className="form-lancamento-botoes">
        <button type="submit" className="perigo" disabled={excluindo}>
          {excluindo ? "Excluindo..." : "Sim, excluir"}
        </button>
        <button
          type="button"
          className="secundario"
          disabled={excluindo}
          onClick={() => setConfirmando(false)}
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
