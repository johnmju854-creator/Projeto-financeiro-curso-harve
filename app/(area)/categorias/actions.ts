"use server";

// Criar, editar e excluir categorias. Tudo roda no servidor (Server Actions), sem rotas de API.
// Mesmo caminho dos lançamentos: 1) confere quem está logado, 2) valida, 3) grava com o user_id,
// 4) devolve uma mensagem de erro (sem quebrar) ou atualiza a lista e volta para /categorias.
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { exigirUsuario } from "@/lib/auth";
import { atualizarCategoria, inserirCategoria, removerCategoria } from "@/lib/categorias";
import {
  ERRO_NAO_ENCONTRADA,
  validarCategoria,
  type CamposCategoria,
  type DadosCategoria,
  type EstadoCategoria,
} from "@/lib/categorias-utils";
import { idDaUrlValido } from "@/lib/lancamentos-utils";
import type { ResultadoGravacao } from "@/lib/lancamentos";

const ERRO_INESPERADO = "Algo deu errado. Tente de novo em instantes.";

function lerCampos(formData: FormData): CamposCategoria {
  const texto = (nome: string) => String(formData.get(nome) ?? "");
  return { nome: texto("nome"), tipo: texto("tipo"), cor: texto("cor") };
}

// Parte comum de criar e editar: confere os dados e grava. Devolve o erro (ou null se deu certo).
async function conferirEGravar(
  campos: CamposCategoria,
  gravar: (dados: DadosCategoria) => Promise<ResultadoGravacao>,
): Promise<string | null> {
  const resultado = validarCategoria(campos);
  if (!resultado.ok) return resultado.erro;

  try {
    const gravado = await gravar(resultado.dados);
    return gravado.ok ? null : gravado.erro;
  } catch (erro) {
    console.error("Erro inesperado ao gravar categoria:", erro);
    return ERRO_INESPERADO;
  }
}

// Atualiza as telas e volta para a lista (redirect() não pode ficar dentro de try/catch)
function concluir(): never {
  revalidatePath("/", "layout");
  redirect("/categorias");
}

export async function criarCategoria(
  _anterior: EstadoCategoria,
  formData: FormData,
): Promise<EstadoCategoria> {
  const usuario = await exigirUsuario();
  const campos = lerCampos(formData);

  const erro = await conferirEGravar(campos, (dados) => inserirCategoria(usuario.id, dados));
  if (erro) return { erro, valores: campos };

  return concluir();
}

export async function editarCategoria(
  id: string,
  _anterior: EstadoCategoria,
  formData: FormData,
): Promise<EstadoCategoria> {
  const usuario = await exigirUsuario();
  const campos = lerCampos(formData);

  if (!idDaUrlValido(id)) return { erro: ERRO_NAO_ENCONTRADA, valores: campos };

  const erro = await conferirEGravar(campos, (dados) => atualizarCategoria(usuario.id, id, dados));
  if (erro) return { erro, valores: campos };

  return concluir();
}

export async function excluirCategoria(
  id: string,
  _anterior: EstadoCategoria,
  _formData: FormData,
): Promise<EstadoCategoria> {
  const usuario = await exigirUsuario();

  if (!idDaUrlValido(id)) return { erro: ERRO_NAO_ENCONTRADA };

  let resultado: ResultadoGravacao;
  try {
    resultado = await removerCategoria(usuario.id, id);
  } catch (erro) {
    console.error("Erro inesperado ao excluir categoria:", erro);
    return { erro: ERRO_INESPERADO };
  }
  if (!resultado.ok) return { erro: resultado.erro };

  return concluir();
}
