// Parte PURA das categorias: tipos e validação (nome, tipo e cor). Sem banco, então é testável
// e seguro para importar em componentes de cliente. (O banco fica em lib/categorias.ts.)
import { lerItemComNome, type IdBanco } from "./lancamentos-utils.ts";

export type TipoCategoria = "entrada" | "saida";

export type Categoria = { id: IdBanco; nome: string; tipo: TipoCategoria; cor: string };

export const COR_PADRAO = "#9E9E9E";
export const NOME_MAXIMO = 40;

// O que chega do formulário: tudo é texto
export type CamposCategoria = { nome: string; tipo: string; cor: string };

// Dados já conferidos e prontos para gravar
export type DadosCategoria = { nome: string; tipo: TipoCategoria; cor: string };

export type ResultadoValidacaoCategoria =
  | { ok: true; dados: DadosCategoria }
  | { ok: false; erro: string };

// O que a Server Action devolve ao formulário: mensagem de erro e o que a pessoa digitou
export type EstadoCategoria = { erro?: string; valores?: CamposCategoria };

export const ERRO_NOME_VAZIO = "Preencha o nome da categoria.";
export const ERRO_NOME_LONGO = `O nome pode ter no máximo ${NOME_MAXIMO} caracteres.`;
export const ERRO_TIPO = "Escolha se é entrada ou saída.";
export const ERRO_COR = "Escolha uma cor no formato #RRGGBB (ex.: #8E24AA).";
export const ERRO_NOME_REPETIDO = "Você já tem uma categoria com esse nome.";
export const ERRO_NAO_ENCONTRADA = "Categoria não encontrada.";

const COR_VALIDA = /^#[0-9A-Fa-f]{6}$/;

export function corValida(cor: string): boolean {
  return COR_VALIDA.test(cor);
}

export function validarCategoria(campos: CamposCategoria): ResultadoValidacaoCategoria {
  const nome = campos.nome.trim();
  if (nome === "") return { ok: false, erro: ERRO_NOME_VAZIO };
  if (nome.length > NOME_MAXIMO) return { ok: false, erro: ERRO_NOME_LONGO };

  if (campos.tipo !== "entrada" && campos.tipo !== "saida") {
    return { ok: false, erro: ERRO_TIPO };
  }

  const cor = campos.cor.trim();
  if (!corValida(cor)) return { ok: false, erro: ERRO_COR };

  // A cor é sempre gravada em maiúsculas (#8e24aa vira #8E24AA)
  return { ok: true, dados: { nome, tipo: campos.tipo, cor: cor.toUpperCase() } };
}

// Converte UMA linha do banco em categoria limpa (linha sem id/nome vira null).
// Tipo ou cor estranhos viram valores padrão, para um dado ruim não derrubar a tela.
export function lerCategoria(linha: Record<string, unknown>): Categoria | null {
  const base = lerItemComNome(linha);
  if (!base) return null;
  const tipo: TipoCategoria = linha.tipo === "entrada" ? "entrada" : "saida";
  const cor = typeof linha.cor === "string" && corValida(linha.cor) ? linha.cor : COR_PADRAO;
  return { ...base, tipo, cor };
}
