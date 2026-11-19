"use client";

// Formulário de categoria, usado para CRIAR e para EDITAR.
// A gravação é feita por uma Server Action (recebida em "acao"); aqui só mostramos o erro
// e desabilitamos o botão enquanto envia.
import Link from "next/link";
import { useActionState, useState } from "react";
import {
  corValida,
  NOME_MAXIMO,
  type CamposCategoria,
  type EstadoCategoria,
} from "@/lib/categorias-utils";

type FormularioCategoriaProps = {
  acao: (estado: EstadoCategoria, formData: FormData) => Promise<EstadoCategoria>;
  valoresIniciais: CamposCategoria;
  textoBotao: string;
};

export function FormularioCategoria({
  acao,
  valoresIniciais,
  textoBotao,
}: FormularioCategoriaProps) {
  const [estado, formAction, enviando] = useActionState(acao, {});

  // Se deu erro, o servidor devolve o que a pessoa digitou, para ela não perder nada
  const v = estado.valores ?? valoresIniciais;

  // A cor tem dois jeitos de escolher (seletor e texto) que andam juntos
  const [cor, setCor] = useState(v.cor);

  return (
    <form action={formAction} className="form-lancamento" aria-busy={enviando}>
      {estado.erro && (
        <p role="alert" className="erro">
          {estado.erro}
        </p>
      )}

      <label>
        Nome
        <input
          type="text"
          name="nome"
          required
          maxLength={NOME_MAXIMO}
          defaultValue={v.nome}
          placeholder="Ex.: Pet"
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
        Cor (#RRGGBB)
        <span className="campo-cor">
          <input
            type="color"
            aria-label="Escolher a cor"
            value={corValida(cor) ? cor.toLowerCase() : "#9e9e9e"}
            onChange={(e) => setCor(e.target.value.toUpperCase())}
          />
          <input
            type="text"
            name="cor"
            required
            maxLength={7}
            value={cor}
            onChange={(e) => setCor(e.target.value)}
            placeholder="#8E24AA"
          />
        </span>
      </label>

      <div className="form-lancamento-botoes">
        <button type="submit" disabled={enviando}>
          {enviando ? "Salvando..." : textoBotao}
        </button>
        <Link href="/categorias" className="link-botao secundario">
          Cancelar
        </Link>
      </div>
    </form>
  );
}
