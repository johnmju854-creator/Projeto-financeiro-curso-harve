-- supabase-categorias-tipo-cor.sql — adiciona TIPO e COR nas categorias (para o SUPABASE)
--
-- COMO USAR:
--   Supabase > SQL Editor > New query > cole ESTE arquivo inteiro > Run
--
-- O que faz:
--   * tipo: 'entrada' ou 'saida'      (categorias que ja existem ficam como 'saida')
--   * cor : formato #RRGGBB           (categorias que ja existem ficam cinza, #9E9E9E)
-- Tudo roda dentro de uma transacao: se algo der erro, NADA muda. Pode rodar mais de uma vez.

begin;

alter table public.categorias add column if not exists tipo text not null default 'saida';
alter table public.categorias add column if not exists cor  text not null default '#9E9E9E';

-- Regras no banco (o app tambem confere, mas o banco e a ultima barreira)
alter table public.categorias drop constraint if exists categorias_tipo_check;
alter table public.categorias
  add constraint categorias_tipo_check check (tipo in ('entrada', 'saida'));

alter table public.categorias drop constraint if exists categorias_cor_check;
alter table public.categorias
  add constraint categorias_cor_check check (cor ~ '^#[0-9A-Fa-f]{6}$');

-- Avisa a API do Supabase que as colunas novas existem
notify pgrst, 'reload schema';

commit;
