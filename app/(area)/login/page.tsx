import { redirect } from "next/navigation";
import { obterUsuario } from "@/lib/auth";
import { destinoInicial } from "@/lib/rotas-utils";
import { cadastrar, entrar } from "./actions";

export const dynamic = "force-dynamic";

// Os avisos vêm na URL como códigos curtos (?erro=...), nunca como texto livre
const MENSAGENS_DE_ERRO: Record<string, string> = {
  campos: "Preencha o e-mail e a senha.",
  credenciais: "E-mail ou senha incorretos.",
  "senha-curta": "A senha precisa ter pelo menos 6 caracteres.",
  cadastro: "Não foi possível criar a conta. Confira o e-mail e tente de novo.",
};

const MENSAGENS_DE_AVISO: Record<string, string> = {
  confirmar: "Conta criada! Confira seu e-mail para confirmar e depois entre aqui.",
  saiu: "Você saiu da sua conta.",
};

type Props = {
  searchParams: Promise<{ erro?: string; aviso?: string }>;
};

export default async function LoginPage({ searchParams }: Props) {
  const { erro, aviso } = await searchParams;
  const usuario = await obterUsuario();

  const mensagemDeErro = erro ? MENSAGENS_DE_ERRO[erro] : undefined;
  const mensagemDeAviso = aviso ? MENSAGENS_DE_AVISO[aviso] : undefined;

  // Já está logado: não faz sentido ver o login, vai direto para o painel
  // (o redirect fica fora de try/catch, como o Next exige)
  if (usuario) redirect(destinoInicial(true));

  return (
    <section className="login">
      <h1>Entrar na Caderneta</h1>

      {mensagemDeErro && <p role="alert" className="erro">{mensagemDeErro}</p>}
      {mensagemDeAviso && <p role="status" className="aviso">{mensagemDeAviso}</p>}

      <form className="form-login">
        <label>
          E-mail
          <input type="email" name="email" required autoComplete="email" />
        </label>
        <label>
          Senha
          <input
            type="password"
            name="senha"
            required
            minLength={6}
            autoComplete="current-password"
          />
        </label>
        <div className="form-login-botoes">
          <button type="submit" formAction={entrar}>
            Entrar
          </button>
          <button type="submit" formAction={cadastrar} className="secundario">
            Criar conta
          </button>
        </div>
      </form>
    </section>
  );
}
