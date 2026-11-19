"use client";

// Botão de excluir com confirmação: o primeiro clique só pergunta "tem certeza?".
// (Não usamos window.confirm porque ele não funciona bem em todos os navegadores embutidos.)
import { useActionState, useState } from "react";

// Serve para lançamento e categoria: só precisa que o estado tenha a mensagem de erro
type EstadoExclusao = { erro?: string };

type BotaoExcluirProps = {
  acao: (estado: EstadoExclusao, formData: FormData) => Promise<EstadoExclusao>;
  rotulo?: string; // texto do botão (padrão: lançamento)
  aviso?: string; // pergunta de confirmação (padrão: lançamento)
};

export function BotaoExcluir({
  acao,
  rotulo = "Excluir lançamento",
  aviso = "Tem certeza que quer excluir este lançamento? Isso não pode ser desfeito.",
}: BotaoExcluirProps) {
  const [confirmando, setConfirmando] = useState(false);
  const [estado, formAction, excluindo] = useActionState(acao, {});

  if (!confirmando) {
    return (
      <button type="button" className="perigo" onClick={() => setConfirmando(true)}>
        {rotulo}
      </button>
    );
  }

  return (
    <form action={formAction} className="confirmar-exclusao" aria-busy={excluindo}>
      <p role="alert">{aviso}</p>
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
