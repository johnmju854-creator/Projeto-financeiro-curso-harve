-- supabase-dados-exemplo.sql — dados de EXEMPLO para testar o app (OPCIONAL)
--
-- Rode SO DEPOIS do supabase-schema.sql e do rls-supabase.sql.
-- Cria 2 contas, 4 categorias e 6 lancamentos para UMA conta de login que voce escolher.
--
-- ANTES DE RODAR: troque COLOQUE-AQUI-O-EMAIL-DA-SUA-CONTA pelo e-mail com que voce
-- se cadastrou no app (o mesmo que aparece em Authentication > Users no Supabase).
--
-- Se rodar duas vezes, os dados ficam duplicados (as categorias nao: elas tem nome unico).

do $$
declare
  email_alvo text := 'COLOQUE-AQUI-O-EMAIL-DA-SUA-CONTA';
  uid        uuid;
  conta_cc   bigint;
  conta_cart bigint;
  cat_merc   bigint;
  cat_sal    bigint;
  cat_trans  bigint;
  cat_lazer  bigint;
begin
  select id into uid from auth.users where lower(email) = lower(email_alvo);
  if uid is null then
    raise exception 'Nao achei nenhuma conta com o e-mail "%". Confira o e-mail em Authentication > Users e troque la em cima.', email_alvo;
  end if;

  insert into public.contas (user_id, nome, tipo, saldo_inicial)
    values (uid, 'Conta Corrente', 'corrente', 0) returning id into conta_cc;
  insert into public.contas (user_id, nome, tipo, saldo_inicial)
    values (uid, 'Carteira', 'especie', 0) returning id into conta_cart;

  insert into public.categorias (user_id, nome) values (uid, 'Mercado')
    on conflict (user_id, lower(btrim(nome))) do update set nome = excluded.nome returning id into cat_merc;
  insert into public.categorias (user_id, nome) values (uid, 'Salário')
    on conflict (user_id, lower(btrim(nome))) do update set nome = excluded.nome returning id into cat_sal;
  insert into public.categorias (user_id, nome) values (uid, 'Transporte')
    on conflict (user_id, lower(btrim(nome))) do update set nome = excluded.nome returning id into cat_trans;
  insert into public.categorias (user_id, nome) values (uid, 'Lazer')
    on conflict (user_id, lower(btrim(nome))) do update set nome = excluded.nome returning id into cat_lazer;

  insert into public.lancamentos (user_id, conta_id, categoria_id, tipo, valor, data_lancamento, descricao) values
    (uid, conta_cc,   cat_merc, 'saida',   341.43, '2025-01-01', 'mercado do mes'),
    (uid, conta_cc,   cat_sal,  'entrada', 856.74, '2025-01-02', 'salario'),
    (uid, conta_cc,   null,     'saida',    89.05, '2025-01-03', 'conta de luz'),
    (uid, conta_cart, cat_merc, 'saida',   123.97, '2025-01-04', 'padaria'),
    (uid, conta_cc,   null,     'saida',  2350.00, '2025-01-05', 'aluguel'),
    (uid, conta_cc,   null,     'entrada',1200.00, '2025-01-10', 'freela');
end $$;
