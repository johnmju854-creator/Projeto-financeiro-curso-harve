"use client";

// Formulário de lançamento, usado para CRIAR e para EDITAR.
// A gravação é feita por uma Server Action (recebida em "acao"); aqui só mostramos o erro
// e desabilitamos o botão enquanto envia.
import Link from "next/link";
import { useActionState } from "react";
import type { CamposFormulario, EstadoFormulario } from "@/lib/lancamentos-utils";

// Contas e categorias já chegam como dados simples (id e nome)
type Opcao = { id: string | number; nome: string };

type FormularioLancamentoProps = {
  acao: (estado: EstadoFormulario, formData: FormData) => Promise<EstadoFormulario>;
  contas: Opcao[];
  categorias: Opcao[];
  valoresIniciais: CamposFormulario;
  textoBotao: string;
};

export function FormularioLancamento({
  acao,
  contas,
  categorias,
  valoresIniciais,
  textoBotao,
}: FormularioLancamentoProps) {
  const [estado, formAction, enviando] = useActionState(acao, {});

  // Se deu erro, o servidor devolve o que a pessoa digitou, para ela não perder nada
  const v = estado.valores ?? valoresIniciais;
  const semContas = contas.length === 0;

  return (
    <form action={formAction} className="form-lancamento" aria-busy={enviando}>
      {estado.erro && (
        <p role="alert" className="erro">
          {estado.erro}
        </p>
      )}

      {semContas && (
        <p role="alert" className="erro">
          Você ainda não tem nenhuma conta. Cadastre uma conta antes de fazer um lançamento.
        </p>
      )}

      <label>
        Descrição
        <input
          type="text"
          name="descricao"
          required
          maxLength={200}
          defaultValue={v.descricao}
          placeholder="Ex.: mercado do mês"
        />
      </label>

      <label>
        Valor (R$)
        <input
          type="text"
          name="valor"
          required
          inputMode="decimal"
          defaultValue={v.valor}
          placeholder="0,00"
        />
      </label>

      <label>
        Tipo
        <select name="tipo" required defaultValue={v.tipo}>
          <option value="saida">Saída</option>
          <option value="entrada">Entrada</option>
        </select>
      </label>

      <label>
        Data
        <input type="date" name="data" required defaultValue={v.data} />
      </label>

      <label>
        Conta
        <select
          name="contaId"
          required
          defaultValue={v.contaId || (contas.length === 1 ? String(contas[0].id) : "")}
        >
          <option value="" disabled>
            Escolha uma conta
          </option>
          {contas.map((c) => (
            <option key={c.id} value={String(c.id)}>
              {c.nome}
            </option>
          ))}
        </select>
      </label>

      <label>
        Categoria (opcional)
        <select name="categoriaId" defaultValue={v.categoriaId}>
          <option value="">Sem categoria</option>
          {categorias.map((c) => (
            <option key={c.id} value={String(c.id)}>
              {c.nome}
            </option>
          ))}
        </select>
      </label>

      <div className="form-lancamento-botoes">
        <button type="submit" disabled={enviando || semContas}>
          {enviando ? "Salvando..." : textoBotao}
        </button>
        <Link href="/lancamentos" className="link-botao secundario">
          Cancelar
        </Link>
      </div>
    </form>
  );
}
