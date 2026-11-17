-- rls-supabase.sql — RLS (Row Level Security) para a Caderneta da Claudia
-- Rode no Supabase: SQL Editor > New query > cole tudo > Run.
--
-- O que faz: cada pessoa logada so enxerga e altera os PROPRIOS dados.
-- A regra fica no banco (nao depende do codigo do app) e usa auth.uid() = id de quem esta logado.
--
-- SUPOSICOES (confira antes de rodar; se algo nao existir, o script inteiro desfaz e nao muda nada):
--   * lancamentos tem user_id (uuid, mesmo valor de auth.users.id), conta_id e categoria_id
--   * contas e categorias tambem tem user_id, e a chave primaria de todas as tabelas se chama id

--   * se categorias for uma tabela COMPARTILHADA (sem user_id), use a variante no fim do arquivo

begin;

-- 1) Ligar o RLS. Depois disso, SEM policy ninguem le nem escreve nada.
alter table public.lancamentos enable row level security;
alter table public.categorias  enable row level security;
alter table public.contas      enable row level security;

-- Limpa policies antigas com os mesmos nomes (permite rodar o script mais de uma vez)
drop policy if exists "lancamentos: ler os proprios"      on public.lancamentos;
drop policy if exists "lancamentos: inserir os proprios"  on public.lancamentos;
drop policy if exists "lancamentos: alterar os proprios"  on public.lancamentos;
drop policy if exists "lancamentos: apagar os proprios"   on public.lancamentos;
drop policy if exists "categorias: ler as proprias"       on public.categorias;
drop policy if exists "categorias: inserir as proprias"   on public.categorias;
drop policy if exists "categorias: alterar as proprias"   on public.categorias;
drop policy if exists "categorias: apagar as proprias"    on public.categorias;
drop policy if exists "contas: ler as proprias"           on public.contas;
drop policy if exists "contas: inserir as proprias"       on public.contas;
drop policy if exists "contas: alterar as proprias"       on public.contas;
drop policy if exists "contas: apagar as proprias"        on public.contas;

-- 2) LANCAMENTOS ---------------------------------------------------------------
-- Leitura
create policy "lancamentos: ler os proprios"
  on public.lancamentos for select to authenticated
  using ( user_id = (select auth.uid()) );

-- Escrita. O "with check" impede gravar com user_id de OUTRA pessoa e tambem usar
-- conta/categoria que nao sejam suas (as subconsultas ja respeitam o RLS dessas tabelas).
create policy "lancamentos: inserir os proprios"
  on public.lancamentos for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and (conta_id     is null or exists (select 1 from public.contas     c where c.id = lancamentos.conta_id))
    and (categoria_id is null or exists (select 1 from public.categorias g where g.id = lancamentos.categoria_id))
  );

create policy "lancamentos: alterar os proprios"
  on public.lancamentos for update to authenticated
  using      ( user_id = (select auth.uid()) )
  with check (
    user_id = (select auth.uid())
    and (conta_id     is null or exists (select 1 from public.contas     c where c.id = lancamentos.conta_id))
    and (categoria_id is null or exists (select 1 from public.categorias g where g.id = lancamentos.categoria_id))
  );

create policy "lancamentos: apagar os proprios"
  on public.lancamentos for delete to authenticated
  using ( user_id = (select auth.uid()) );

-- 3) CATEGORIAS (cada pessoa tem as suas) --------------------------------------
-- Sem a policy de leitura abaixo, o nome da categoria apareceria vazio na lista de lancamentos.
create policy "categorias: ler as proprias"
  on public.categorias for select to authenticated
  using ( user_id = (select auth.uid()) );

create policy "categorias: inserir as proprias"
  on public.categorias for insert to authenticated
  with check ( user_id = (select auth.uid()) );

create policy "categorias: alterar as proprias"
  on public.categorias for update to authenticated
  using      ( user_id = (select auth.uid()) )
  with check ( user_id = (select auth.uid()) );

create policy "categorias: apagar as proprias"
  on public.categorias for delete to authenticated
  using ( user_id = (select auth.uid()) );

-- 4) CONTAS --------------------------------------------------------------------
create policy "contas: ler as proprias"
  on public.contas for select to authenticated
  using ( user_id = (select auth.uid()) );

create policy "contas: inserir as proprias"
  on public.contas for insert to authenticated
  with check ( user_id = (select auth.uid()) );

create policy "contas: alterar as proprias"
  on public.contas for update to authenticated
  using      ( user_id = (select auth.uid()) )
  with check ( user_id = (select auth.uid()) );

create policy "contas: apagar as proprias"
  on public.contas for delete to authenticated
  using ( user_id = (select auth.uid()) );

-- 5) Deixa as consultas do app rapidas (o RLS filtra por user_id o tempo todo)
create index if not exists idx_lancamentos_user_data
  on public.lancamentos (user_id, data_lancamento desc);

-- 6) (Opcional) Se a coluna user_id nao tiver valor padrao, o app precisaria enviar o user_id em
--    cada insercao. Com o padrao abaixo, o banco preenche sozinho com quem esta logado:
-- alter table public.lancamentos alter column user_id set default auth.uid();

commit;

-- ----------------------------------------------------------------------------------
-- VARIANTE: categorias COMPARTILHADAS (todas as pessoas veem as mesmas, ninguem altera pelo app).
-- Troque a secao 3 por isto:
--   create policy "categorias: ler todas"
--     on public.categorias for select to authenticated using ( true );
-- ----------------------------------------------------------------------------------
-- Tabela usuarios (se for um perfil com id = auth.users.id):
--   alter table public.usuarios enable row level security;
--   create policy "usuarios: ler o proprio"     on public.usuarios for select to authenticated using ( id = (select auth.uid()) );
--   create policy "usuarios: alterar o proprio" on public.usuarios for update to authenticated
--     using ( id = (select auth.uid()) ) with check ( id = (select auth.uid()) );
