# PROGRESSO

Última atualização: 2026-11-17.

## Objetivo
Caderneta da Claudia: app de controle financeiro pessoal feito durante o curso Harve.
Next.js 15 (App Router) + TypeScript + Supabase (login por e-mail/senha e RLS). Sem rotas de API e sem
bibliotecas extras (só `@supabase/ssr` e `@supabase/supabase-js`, que o `ssr` exige).
Repositório: `git@github.com:johnmju854-creator/Projeto-financeiro-curso-harve.git` (branch `main`).

## Feito
**Base (05/11)**
- Esqueleto do app: `/`, `/lancamentos`, `/lancamentos/[id]`, `/dashboard` (placeholder "Em breve"), menu, `loading.tsx`, `not-found.tsx`.
- `schema.sql`: modelo LOCAL antigo (usa `usuario_id`; não é o do Supabase, hoje está obsoleto).

**Funcionalidades (10/11)**
- Categorias (`/categorias`, `/categoria/[id]`), lançamento com categoria opcional.
- Lista com busca por descrição (sem acento/maiúscula), botão Tudo / Só entradas / Só saídas e **total de saídas ao vivo** (lição "O total do que está filtrado").
- Revisão de código aplicada: `error.tsx`, validação dos dados (`lerLancamento`), descrição `NULL` tratada, separação servidor/cliente, `aria-live`, `useMemo`/`useDeferredValue`.

**Supabase e login (12/11)**
- Clientes do Supabase (`lib/supabase/{env,server,client,middleware}.ts`), `middleware.ts` (matcher: `/lancamentos`, `/categorias`, `/categoria`, `/dashboard`; usa `getUser()`), `lib/auth.ts`.
- Login em `app/(area)/login/` (Server Actions `entrar`, `cadastrar`, `sair`). O menu só aparece logado.
- Buscas reais no Supabase, sempre filtrando por `user_id`.

**Criar, editar e excluir (17/11)**
- `app/(area)/lancamentos/actions.ts` (Server Actions `criarLancamento`, `editarLancamento`, `excluirLancamento`): confere login, valida (descrição preenchida, valor > 0), confere que conta/categoria são da pessoa, grava com o `user_id`, devolve mensagem de erro sem quebrar, atualiza a lista e volta para `/lancamentos`.
- Telas `/lancamentos/novo` e `/lancamentos/[id]/editar`, com `components/formulario-lancamento.tsx` (erro na tela, botão desabilitado enviando) e `components/botao-excluir.tsx` (confirmação em 2 passos).
- `lib/contas.ts`; `lib/categorias.ts` e `lib/lancamentos.ts` com gravar/editar/excluir.

**Banco (17/11)**
- Rodados pelo John no SQL Editor do Supabase: `supabase-schema.sql` (categorias, contas, lancamentos; id bigint identity; `user_id` default `auth.uid()`; categoria opcional; grants só para `authenticated`) e `rls-supabase.sql` (RLS + policies com `auth.uid()`).
- `supabase-dados-exemplo.sql` (opcional): 2 contas, 4 categorias, 6 lançamentos; trocar `COLOQUE-AQUI-O-EMAIL-DA-SUA-CONTA` pelo e-mail da conta de teste.
- O John testou com o banco real (conta de teste do curso) e confirmou: "deu tudo certo" (lista, filtro/total, novo, editar, excluir, categorias).

**GitHub (17/11)**
- `git init` na pasta do projeto (repo próprio), commits `0357ce6` (primeira versão, 45 arquivos) e `4ea2751` (troca do e-mail de teste por texto genérico), ambos enviados. `.env.local`, `node_modules` e `next-env.d.ts` ficam fora (`.gitignore`).
- O commit `0357ce6` ainda tem o e-mail de teste no histórico (decisão do John: não reescrever).

**Verificações**
- `npm test` (node:test embutido): 21 testes passando. `npx tsc --noEmit` ok. `npm run build` ok.
- Prévia clicável das telas (artifact privado): https://claude.ai/artifact/PLoVRp691G1DTKq1nLaFJL

## Em andamento (onde paramos)
**CONCLUÍDO (19/11):** o John rodou o SQL, testou na tela (criou "Pet", cor #8E24AA) e confirmou a linha no Supabase. Só falta commit (quando o John pedir).
**Pedido da Cláudia (17/11): tela de categorias completa.**
Criar, editar e excluir categoria (nome, tipo, cor #RRGGBB), mesma validação/mensagens dos lançamentos.
O John aprovou: categorias antigas ficam `saida` + `#9E9E9E`; o tipo é só informativo (não filtra o lançamento).
Regras: nome obrigatório, até 40 caracteres, único por pessoa; tipo `entrada`/`saida`; cor `#RRGGBB` (gravada em maiúsculas);
nome repetido: "Você já tem uma categoria com esse nome."; excluir NÃO apaga lançamentos (ficam sem categoria).
Arquivos: `supabase-categorias-tipo-cor.sql` (NOVO, o John precisa rodar no SQL Editor) e `supabase-schema.sql` (atualizado);
`lib/categorias-utils.ts` (validação pura), `lib/categorias.ts` (listar/buscar/inserir/atualizar/remover);
`app/(area)/categorias/actions.ts` (criarCategoria, editarCategoria, excluirCategoria);
`components/formulario-categoria.tsx`; rotas `/categorias/nova` e `/categoria/[id]/editar`;
`components/categoria-card.tsx` (cor, tipo, Editar), `components/botao-excluir.tsx` (agora aceita texto próprio), `globals.css`;
`testes/categorias.test.mjs` (8 testes). Novo script `npm run verificar` (= `tsc --noEmit` + `npm test`): 29 testes passando.
**Validado:** SQL rodado, "Pet" criada e cor trocada para #8E24AA, linha conferida no Supabase. Nada foi commitado ainda.

**Visual novo (19/11):** `app/globals.css` reescrito (só CSS, componentes intactos), aplicado, ainda NÃO commitado. Moderno e discreto:
uma só cor de acento (índigo `#4F46E5`) para ações, resto em cinza-azulado (slate); título 24px, total 28px, texto 15px, detalhes 13px;
menu claro; mensagens de erro/aviso e caixa de excluir no estilo padrão (sem fundo vermelho; só o botão "Sim, excluir" é vermelho).
Referências: Material Design 3, Tailwind. Prévia (privada): https://claude.ai/artifact/CkArTawdko7xFkzuAEW5wn. `npm run verificar`: 29 testes ok.
Falta: o John conferir no `localhost:3000` (pode pedir ajustes de tamanho/cor).
Obs.: o commit/push do 3571891 (categorias) já foi feito em 19/11 (`4ea2751..3571891`).

**ONDE PARAMOS (fim da aula de 19/11):** visual novo commitado e enviado ao GitHub. O John AINDA NÃO conferiu o visual ao vivo
(ligamos o `npm run dev` para ele ver, mas a aula acabou). Ao voltar: (1) ligar `npm run dev` e o John conferir as telas
(`/login` → Lançamentos, Categorias, Novo lançamento, detalhe); ajustar o que incomodar; (2) seguir a publicação na Vercel
(passos logo abaixo). Parar o dev antes de qualquer `npm run build`.
**Telas da usuária em tabela (19/11) — APLICADO e commitado:** lançamentos e categorias em tabelas; sem a palavra "tipo"
(abas Todos | Entradas | Saídas; categorias separadas em "de saída" e "de entrada"; escolha direta Saída/Entrada nos formulários;
selo no detalhe); total de entradas e de saídas; menu marca a página atual (`components/menu-link.tsx`); novo
`components/tabela-lancamentos.tsx`; removidos `lancamento-card.tsx` e `categoria-card.tsx`. Lançamentos agora trazem a cor da
categoria (`categorias(nome, cor)`). `npm run verificar`: 32 testes ok. Falta o John conferir no `localhost:3000`.
**Publicação (GitHub + Vercel + Supabase), passo a passo — em andamento (19/11):**
- `npm run build` OK (12 rotas, sem erros); `.next` apagado depois. O John fechou o dev antes.
- Repositório do GitHub é PÚBLICO (decisão do John: manter público por enquanto, é projeto de estudo; deixar privado depois).
- Não há acesso à extensão do Chrome nesta sessão: o John faz os cliques nos painéis (Vercel/Supabase/GitHub) e eu guio. `gh` está logado.
- Ordem: (1) commit+push do visual novo [FEITO]; (2) Vercel: importar o repo, variáveis `NEXT_PUBLIC_SUPABASE_URL` e
  `NEXT_PUBLIC_SUPABASE_ANON_KEY` (chave publishable, NUNCA a secret; o John cola, eu não vejo); (3) Supabase > Authentication > URL
  Configuration: Site URL = URL da Vercel + Redirect URLs `https://APP.vercel.app/**` (manter localhost); (4) testar login/lançamento/categoria
  no site publicado e conferir que outra conta não vê os dados; (5) depois: repo privado, domínio, região, `npm audit`.

## Próximos passos (opções; um por vez, só com o ok do John)
1. Tela para **cadastrar contas** (categorias já têm tela; contas hoje só pelo SQL ou Table Editor; o formulário "Novo" avisa quando não há conta).
2. ~~Melhorar o visual~~ (feito, falta o John conferir e commitar).
3. **Próxima aula do curso:** o John manda o print/texto da aula.
4. **Dashboard** de verdade (hoje é só "Em breve").
5. Tabela `usuarios` + gatilho no cadastro (decidido NÃO por enquanto; o login guarda e-mail/senha por conta própria).
6. Limpeza: `lib/categorias.json` e `schema.sql` (modelo antigo) estão obsoletos; `dados.sql` nunca esteve na pasta (lançamentos duplicados dele, ex. 288/289, não foram tratados).
7. Conferir os avisos do `npm audit`.

## Como retomar
- Terminal do VS Code, dentro da pasta: `npm run dev` (o John liga e deixa aberto). Ver no Simple Browser: Ctrl+Shift+P > "Simple Browser: Show" > `http://localhost:3000/login` (use a porta que o terminal mostrar).
- `.env.local` (não vai para o GitHub): copiar de `.env.example` e preencher `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` (use a chave **publishable**; NUNCA a secret). O Next só lê o arquivo ao iniciar.
- No Supabase: "Confirm email" desligado (Authentication > Sign In / Providers > Email) e Site URL = `http://localhost:3000`.
- Ordem dos SQL (já rodados): `supabase-schema.sql` > `rls-supabase.sql` > (opcional) `supabase-dados-exemplo.sql`.

## Decisões importantes
- TypeScript fixado na versão 5 (a 7 quebra o Next 15).
- Grupo de rotas `(area)` dá o layout com menu; o login fica em `(area)/login` e o menu só aparece logado.
- **Nunca rodar `npm run build` com `npm run dev` ligado** (os dois usam `.next` e quebram: "Cannot find module ./477.js"). Verificar com `npx tsc --noEmit` e `npm test`; se precisar de build, só sem servidor, e apagar `.next` depois.
- Código do servidor (`lib/lancamentos.ts`, `lib/categorias.ts`, `lib/contas.ts`, `lib/auth.ts`, `lib/supabase/*`) NUNCA importado por componentes `"use client"`; o que é compartilhado fica em `lib/lancamentos-utils.ts` (puro, testável).
- Só os componentes interativos têm `"use client"`; as páginas são Server Components.
- Segurança: só a chave publishable no app; nunca `service_role`/secret. RLS no banco + filtro por `user_id` no código + conferência de dono na Server Action. Sem SQL montado à mão (só `.from().select().eq()`), então protegido contra SQL Injection.
- Ids tratados como valor opaco (número ou uuid); id vindo da URL só passa com formato seguro.
- `valor`: aceita `12,50`, `12.50`, `1.234,56`; recusa `1.234` (ambíguo) e mais de 2 casas decimais.
- Testes com `node --test` (não é biblioteca extra); a parte de banco não tem teste automático (precisa do Supabase real).
- Categoria é opcional no lançamento; `descricao` pode ser `NULL` ("(sem descrição)" na tela).
- Commit e push **só quando o John pedir**. Não rodar `git init`/reescrever histórico sem ele pedir.
