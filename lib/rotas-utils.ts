// Parte PURA: para onde mandar a pessoa ao abrir o app. Sem login, sem banco: fácil de testar.

// Quem já está logado vai direto para o painel (lançamentos); quem não está, para o login.
export function destinoInicial(logado: boolean): "/lancamentos" | "/login" {
  return logado ? "/lancamentos" : "/login";
}
