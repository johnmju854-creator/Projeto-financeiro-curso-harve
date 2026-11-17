# PROGRESSO

## Objetivo
Curso: construir a "Caderneta da Claudia" (controle financeiro pessoal) em Next.js (App Router + TypeScript). Banco SQL em schema.sql / dados.sql.

## Feito
- schema.sql criado (5 tabelas: usuarios, contas, categorias, recorrencias, lancamentos).
- Esqueleto Next.js 15 + TypeScript, sem banco, sem API, sem estado de cliente, sem libs extras:
  - app/page.tsx (/), app/(area)/lancamentos/page.tsx, app/(area)/lancamentos/[id]/page.tsx, app/(area)/dashboard/page.tsx
  - app/(area)/layout.tsx (menu Lancamentos / Dashboard), app/(area)/loading.tsx, app/not-found.tsx
  - components/lancamento-card.tsx (export nomeado, prop `dados`, usado com map; igual ao curso), lib/lancamentos.ts (lista fixa de 2 exemplos)
- `npm run build` passou (compila e checa tipos).
- Categorias (2026-11-10): lib/categorias.json (4 categorias: id, nome, descricao) + lib/categorias.ts (tipo `Categoria`, `categorias`, `buscarCategoria`); paginas /categorias e /categoria/[id] (em app/(area)/); components/categoria-card.tsx; menu ganhou "Categorias".
- Lancamento ganhou `categoriaId?` (opcional). Lancamento 1 = Mercado; lancamento 2 = sem categoria. Card e detalhe do lancamento mostram a categoria (ou "sem categoria"); /categoria/[id] lista os lancamentos da categoria.
- Verificado com `npx tsc --noEmit` (passou). Nao rodei build/servidor para nao conflitar com o `npm run dev` do usuario.

- Busca de dados (2026-11-10): lib/lancamentos.ts agora tem `listarLancamentos()` (async, espera 300ms, devolve 6 lancamentos de 2025) e `filtrarLancamentos()` (busca sem acento/maiuscula + tipo). /lancamentos virou Server Component async; o unico 'use client' e components/lancamentos-filtrados.tsx (useState: campo de busca + botao Tudo/Só entradas/Só saídas; mensagem quando a lista fica vazia).
- Testes: `npm test` (node:test embutido, testes/lancamentos.test.mjs) — 5 passando. `npx tsc --noEmit` passou.

- Total ao vivo (licao "O total do que esta filtrado", 2026-11-10): `totalDeSaidas(lista)` em lib/lancamentos.ts (soma so saidas, em centavos). components/lancamentos-filtrados.tsx mostra "Total de saídas: R$ ..." acima da lista, calculado sobre a lista ja filtrada. Digitando "mer" = R$ 341,43. Pagina /lancamentos continua Server Component (so o componente de filtro tem 'use client'). `npm test`: 7 passando; tsc ok.

- Revisao do codigo (2026-11-10), todas as melhorias aplicadas:
  - app/(area)/error.tsx (tela de erro com "Tentar de novo"); /lancamentos com `dynamic = "force-dynamic"` (nao congela dados no build).
  - lib dividida: lib/lancamentos-utils.ts (puro/compartilhado: tipos, lerLancamento, filtro, soma, formatadores) e lib/lancamentos.ts + lib/categorias.ts (SO servidor). Componentes de cliente importam so do utils; o card recebe `categoria` ja resolvida (`anexarCategoria`).
  - `descricao` agora `string | null`; "(sem descrição)" na tela; filtro nao quebra com NULL.
  - `lerLancamento` valida tipo/valor/data na entrada (descarta registro invalido com aviso no terminal); `totalDeSaidas` ignora NaN/Infinity; `formatarData` aceita data com horario.
  - total com `aria-live`; filtro com `useMemo` + `useDeferredValue`; regex de acentos com ̀-ͯ.
  - tsconfig: `allowImportingTsExtensions` (lib/lancamentos.ts importa "./lancamentos-utils.ts" para o `node --test` funcionar).
  - `npm test`: 12 passando; tsc ok; `npm run build` ok (apagada a .next depois).
  - NAO corrigido de proposito: lancamentos duplicados do dados.sql (ex.: 288/289) — nao da para saber so pelo codigo qual e duplicata real; resolver na limpeza dos dados.

- Supabase + login (2026-11-12), NAO testado com banco real (sem credenciais aqui):
  - Pacotes: @supabase/ssr + @supabase/supabase-js (este e dependencia obrigatoria do ssr).
  - lib/supabase/{env,server,client,middleware}.ts; middleware.ts (matcher: /lancamentos, /categorias, /categoria, /dashboard; manda para /login quem nao esta logado, usando getUser()); lib/auth.ts (obterUsuario / exigirUsuario).
  - Login em app/(area)/login/page.tsx + actions.ts (Server Actions entrar/cadastrar/sair, sem rotas de API). O page.tsx antigo era um placeholder, foi sobrescrito no mesmo lugar. Menu (area)/layout.tsx so aparece logado e tem botao Sair.
  - lib/lancamentos.ts e lib/categorias.ts agora leem do Supabase (filtram por user_id; lancamentos mais recentes primeiro; nome da categoria via categorias(nome)). Paginas /lancamentos, /lancamentos/[id], /categorias, /categoria/[id] usam os dados reais. Ids aceitam numero ou uuid.
  - lib/categorias.json (exemplo) nao e mais usado (mantido na pasta). Categoria perdeu a "descricao" na tela (so id e nome sao lidos).
  - rls-supabase.sql: RLS + policies (select/insert/update/delete com auth.uid()) para lancamentos, categorias e contas. AINDA NAO RODADO no Supabase.
  - .env.example criado (copiar para .env.local com URL e chave anon); .gitignore libera o .env.example.
  - Testes: `npm test` 13 passando (parte pura); tsc ok; build ok com variaveis falsas.

- Criar, editar e excluir lancamentos (2026-11-17), NAO testado com banco real (Supabase ainda vazio):
  - Rotas: /lancamentos/novo e /lancamentos/[id]/editar (app/(area)/lancamentos/...). Links: "+ Novo lancamento" na lista, "Editar" em cada card e na pagina do lancamento.
  - app/(area)/lancamentos/actions.ts ("use server"): criarLancamento, editarLancamento(id,...), excluirLancamento(id,...). Cada uma: exigirUsuario -> validarLancamento (descricao preenchida, valor > 0...) -> confere que conta/categoria sao DA PESSOA -> grava com user_id do logado -> devolve {erro, valores} sem quebrar -> revalidatePath("/", "layout") + redirect("/lancamentos"). Sem rotas de API.
  - components/formulario-lancamento.tsx (useActionState: mostra erro, botao desabilitado "Salvando...", mantem o que foi digitado) e components/botao-excluir.tsx (confirmacao em 2 passos, sem window.confirm).
  - lib/lancamentos-utils.ts: validarLancamento, lerValor (aceita 12,50 / 12.50 / 1.234,56; recusa "1.234" ambiguo e >2 decimais), valorParaCampo, hojeISO (horario de Brasilia), idDaUrlValido, lerItemComNome. Lancamento ganhou `contaId?`.
  - lib/contas.ts (novo: listarContas/buscarConta, filtram por user_id). lib/categorias.ts agora recebe userId: listarCategorias(userId), buscarCategoria(userId, id). lib/lancamentos.ts: inserirLancamento, atualizarLancamento, removerLancamento (devolvem {ok}|{ok:false,erro}; erro tecnico so no terminal).
  - Testes: `npm test` 21 passando; tsc ok. Build: ver nota abaixo.
  - Suposicao: tabela `contas` tem user_id e coluna `nome`; `lancamentos` tem conta_id. O app NAO tem tela para cadastrar contas/categorias ainda (formulario avisa quando nao ha conta).

- Banco Supabase (2026-11-17): o John mandou criar o SQL. Criados supabase-schema.sql (categorias, contas, lancamentos; id bigint identity; user_id uuid default auth.uid(); categoria opcional; checks; indices; grants so para authenticated e revoke do anon; notify pgrst reload) e supabase-dados-exemplo.sql (opcional; troca COLOQUE-AQUI-O-EMAIL-DA-SUA-CONTA pelo e-mail do cadastro). ORDEM: 1) supabase-schema.sql 2) rls-supabase.sql 3) supabase-dados-exemplo.sql. AINDA NAO RODADOS no Supabase (o John cola no SQL Editor). Sem tabela `usuarios` (decisao). SQL nao foi executado por mim (sem Postgres local).
- 2026-11-17: o John RODOU supabase-schema.sql e rls-supabase.sql no Supabase (disse "esta ok"); NAO rodou o supabase-dados-exemplo.sql (opcional). Falta: testar o app (lista vazia ate ter conta/lancamentos; o formulario "Novo" avisa que nao ha conta).
- 2026-11-17: o John testou o app com o banco real (login o e-mail da conta de teste, conta de teste do curso) e disse que "deu tudo certo ate entao": lista, filtro/total, novo, editar, excluir e categorias. Banco criado (schema + RLS rodados). Proximo: GitHub (aguardando ok explicito do John para git init/commit/push).
- 2026-11-17: GITHUB FEITO com ok do John: git init na pasta do projeto (branch main), 1o commit 0357ce6 "Primeira versão da Caderneta da Claudia" (45 arquivos; .env.local, node_modules e next-env.d.ts ficaram de fora), remote origin = git@github.com:johnmju854-creator/Projeto-financeiro-curso-harve.git, push -u origin main OK. Novos commits/push so quando o John pedir. (As linhas "GitHub" abaixo sao o plano antigo.) Obs.: supabase-dados-exemplo.sql tem o e-mail de teste o e-mail da conta de teste; se o repo for publico, considerar trocar.
- GitHub (plano antigo): repo informado pelo John: git@github.com:johnmju854-creator/Projeto-financeiro-curso-harve.git (SSH). A pasta do projeto NAO tem .git proprio (esta dentro do repo do Desktop). Plano: git init DENTRO da pasta, branch main, primeiro commit conferido, remote add origin e push — SO apos o ok do John (mostrar lista de arquivos antes). .env.local e ignorado pelo .gitignore.

## Combinado com o John (2026-11-10)
- Proxima sessao: quinta-feira 2026-11-12.
- Ainda NAO existe repositorio no GitHub para este projeto. Tudo fica salvo so nesta pasta; o John cria o repo depois e faz o commit/push. Nao fazer commit/push/git init sem ele pedir. (A pasta esta dentro do repo git do Desktop, onde aparece como nao rastreada.)

## Em andamento (onde paramos)
- 2026-11-12 (FINAL DO DIA): o projeto no Supabase foi criado agora e esta VAZIO (sem tabelas) — por isso o PGRST205 abaixo; o codigo nao tem erro. O John ainda nao chegou nessa parte do curso, entao ESTAMOS AGUARDANDO o curso. Nao criar tabelas/SQL antes do ok dele. Quando for a hora, a recomendacao (so apos o ok, um item por vez): (1) criar supabase-schema.sql com categorias, contas, lancamentos (id numerico identity, user_id uuid default auth.uid(), categoria_id opcional, FKs, checks de tipo/valor, indice) — decidir se inclui tabela usuarios + gatilho (recomendado NAO por enquanto); (2) rodar rls-supabase.sql; (3) dados de exemplo ligados a conta de teste; (4) testar tudo no navegador; (5) criar repo no GitHub + commit (conferir que .env.local nao vai); (6) depois, telas de criar/editar lancamentos e categorias.
- 2026-11-12: login funcionou (conta criada, entrou). /lancamentos mostra "Nao deu para carregar" porque a API do Supabase (projeto gdeguqesnajgrmjdadeg) responde PGRST205 "Could not find the table public.lancamentos/categorias" (404 tambem para usuarios, contas e nomes em ingles). Ou as tabelas nao existem nesse projeto, ou estao em outro schema/nome. Falta o John conferir no Table Editor; se nao existirem, criar com um SQL (a preparar) + rodar rls-supabase.sql. NUNCA usar a chave secret no app.
- Falta o John: criar .env.local (copiando .env.example), rodar rls-supabase.sql no Supabase, reiniciar `npm run dev` e testar cadastro/entrada/saida no navegador.
- Se o Supabase tiver "Confirm email" ligado, desligar para testar (ou confirmar o e-mail e depois entrar). Site URL = http://localhost:3000.

## Proximos passos
- Conferir se os nomes de colunas do Supabase batem com o codigo: tabelas com chave `id`; lancamentos com user_id, categoria_id, data_lancamento; FK lancamentos.categoria_id -> categorias.id; categorias/contas com user_id.
- Decidir: criar linha em `usuarios` ao cadastrar (trigger no Supabase)?
- Rodar schema.sql + dados.sql num PostgreSQL para validar (schema.sql e do modelo antigo com usuario_id; o Supabase do John usa user_id).
- Proximas aulas do curso (conectar banco, dashboard de verdade).

## Decisoes importantes
- TypeScript fixado na versao 5 (a 7 quebra o Next 15).
- Layout proprio via grupo de rotas `(area)` (nao aparece na URL).
- /dashboard foi criado como pagina simples so para o menu funcionar.
- Sem biblioteca de testes (o prompt do curso proibe libs extras); verificacao feita com `npm run build`.
- Nunca rodar `npm run build` com `npm run dev` ligado (os dois usam .next e quebram: erro "Cannot find module ./477.js"). Verificar tipos com `npx tsc --noEmit`.
- Rota de detalhe da categoria e /categoria/[id] (singular), como pedido; a lista e /categorias (plural).
- Testes usam o `node --test` embutido (nao e biblioteca extra). buscarLancamento/lancamentosDaCategoria continuam sincronos, lendo os mesmos 6 dados.
- JSON das categorias fica em lib/categorias.json e e importado por lib/categorias.ts.
- schema.sql: sem regra "tipo do lancamento = tipo da categoria", porque o dados.sql tem casos que violam.
