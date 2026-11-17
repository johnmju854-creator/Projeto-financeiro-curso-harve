"use server";

// Criar, editar e excluir lançamentos. Tudo roda no servidor (Server Actions), sem rotas de API.
// Cada action: 1) confere quem está logado, 2) confere os dados, 3) grava com o user_id da pessoa,
// 4) devolve uma mensagem de erro (sem quebrar) ou atualiza a lista e volta para /lancamentos.
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { exigirUsuario } from "@/lib/auth";
import { buscarCategoria } from "@/lib/categorias";
import { buscarConta } from "@/lib/contas";
import {
  atualizarLancamento,
  inserirLancamento,
  removerLancamento,
  type ResultadoGravacao,
} from "@/lib/lancamentos";
import {
  idDaUrlValido,
  validarLancamento,
  type CamposFormulario,
  type DadosLancamento,
  type EstadoFormulario,
} from "@/lib/lancamentos-utils";

const ERRO_INESPERADO = "Algo deu errado. Tente de novo em instantes.";

function lerCampos(formData: FormData): CamposFormulario {
  const texto = (nome: string) => String(formData.get(nome) ?? "");
  return {
    descricao: texto("descricao"),
    valor: texto("valor"),
    tipo: texto("tipo"),
    data: texto("data"),
    contaId: texto("contaId"),
    categoriaId: texto("categoriaId"),
  };
}

// A conta (e a categoria, se houver) precisam ser DA PESSOA logada
async function conferirDono(userId: string, dados: DadosLancamento): Promise<string | null> {
  if (!(await buscarConta(userId, dados.contaId))) return "Escolha uma das suas contas.";
  if (dados.categoriaId !== null && !(await buscarCategoria(userId, dados.categoriaId))) {
    return "Escolha uma das suas categorias ou deixe sem categoria.";
  }
  return null;
}

// Parte comum de criar e editar: confere os dados e grava. Devolve o erro (ou null se deu certo).
async function conferirEGravar(
  campos: CamposFormulario,
  userId: string,
  gravar: (dados: DadosLancamento) => Promise<ResultadoGravacao>,
): Promise<string | null> {
  const resultado = validarLancamento(campos);
  if (!resultado.ok) return resultado.erro;

  try {
    const erroDeDono = await conferirDono(userId, resultado.dados);
    if (erroDeDono) return erroDeDono;

    const gravado = await gravar(resultado.dados);
    return gravado.ok ? null : gravado.erro;
  } catch (erro) {
    console.error("Erro inesperado ao gravar lançamento:", erro);
    return ERRO_INESPERADO;
  }
}

// Atualiza as telas que mostram lançamentos e volta para a lista.
// (redirect() não pode ficar dentro de try/catch, por isso é chamado aqui, fora.)
function concluir(): never {
  revalidatePath("/", "layout");
  redirect("/lancamentos");
}

export async function criarLancamento(
  _anterior: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  const usuario = await exigirUsuario();
  const campos = lerCampos(formData);

  const erro = await conferirEGravar(campos, usuario.id, (dados) =>
    inserirLancamento(usuario.id, dados),
  );
  if (erro) return { erro, valores: campos };

  return concluir();
}

export async function editarLancamento(
  id: string,
  _anterior: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  const usuario = await exigirUsuario();
  const campos = lerCampos(formData);

  if (!idDaUrlValido(id)) return { erro: "Lançamento não encontrado.", valores: campos };

  const erro = await conferirEGravar(campos, usuario.id, (dados) =>
    atualizarLancamento(usuario.id, id, dados),
  );
  if (erro) return { erro, valores: campos };

  return concluir();
}

export async function excluirLancamento(
  id: string,
  _anterior: EstadoFormulario,
  _formData: FormData,
): Promise<EstadoFormulario> {
  const usuario = await exigirUsuario();

  if (!idDaUrlValido(id)) return { erro: "Lançamento não encontrado." };

  let resultado: ResultadoGravacao;
  try {
    resultado = await removerLancamento(usuario.id, id);
  } catch (erro) {
    console.error("Erro inesperado ao excluir lançamento:", erro);
    return { erro: ERRO_INESPERADO };
  }
  if (!resultado.ok) return { erro: resultado.erro };

  return concluir();
}
