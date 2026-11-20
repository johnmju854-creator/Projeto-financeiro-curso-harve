-- supabase-dados-ficticios.sql — dados FICTICIOS para dar vida ao app e ao dashboard (OPCIONAL)
--
-- Cria, para UMA conta de login que voce escolher:
--   * 4 contas (corrente, cartao, carteira, poupanca)
--   * 14 categorias, ja com tipo (entrada/saida) e cor
--   * cerca de 150 lancamentos espalhados pelos ULTIMOS 6 MESES (a partir da data de hoje),
--     com valores que variam um pouco de mes para mes
--
-- Rode SO DEPOIS do supabase-schema.sql, do rls-supabase.sql e do supabase-categorias-tipo-cor.sql.
--
-- ANTES DE RODAR: troque COLOQUE-AQUI-O-EMAIL-DA-SUA-CONTA pelo e-mail com que voce
-- se cadastrou no app (o mesmo que aparece em Authentication > Users no Supabase).
--
-- ATENCAO:
--   * Categorias que voce ja tem com o MESMO nome (Mercado, Salario, Transporte, Lazer, Pet) tem o
--     tipo e a cor ajustados para os daqui. Os dados que voce ja criou nao sao apagados.
--   * Rode UMA vez so: uma segunda vez e recusada (para nao duplicar os lancamentos).
--   * Tudo acontece dentro de uma transacao: se der erro, NADA e criado.

do $$
declare
  email_alvo text := 'COLOQUE-AQUI-O-EMAIL-DA-SUA-CONTA';
  uid        uuid;
begin
  select id into uid from auth.users where lower(email) = lower(email_alvo);
  if uid is null then
    raise exception 'Nao achei nenhuma conta com o e-mail "%". Confira o e-mail em Authentication > Users e troque la em cima.', email_alvo;
  end if;

  -- Ja rodou antes? (marcador: um lancamento fixo destes dados)
  if exists (select 1 from public.lancamentos where user_id = uid and descricao = 'Plano de saúde') then
    raise exception 'Os dados ficticios ja foram inseridos nesta conta. Nada foi feito.';
  end if;

  -- 1) CONTAS (so cria se ainda nao existir uma com o mesmo nome) -------------------------------
  insert into public.contas (user_id, nome, tipo, saldo_inicial)
  select uid, c.nome, c.tipo, c.saldo
  from (values
    ('Conta Corrente',    'corrente', 2500.00),
    ('Cartão de Crédito', 'cartao',      0.00),
    ('Carteira',          'especie',   150.00),
    ('Poupança',          'poupanca', 5000.00)
  ) as c(nome, tipo, saldo)
  where not exists (
    select 1 from public.contas x where x.user_id = uid and lower(btrim(x.nome)) = lower(c.nome)
  );

  -- 2) CATEGORIAS (nome unico por pessoa: se ja existir, so acerta tipo e cor) -------------------
  insert into public.categorias (user_id, nome, tipo, cor)
  select uid, c.nome, c.tipo, c.cor
  from (values
    ('Salário',                'entrada', '#00A86B'),
    ('Freelance',              'entrada', '#26A69A'),
    ('Rendimentos',            'entrada', '#0097A7'),
    ('Presentes e reembolsos', 'entrada', '#7CB342'),
    ('Moradia',                'saida',   '#6D4C41'),
    ('Contas e serviços',      'saida',   '#00897B'),
    ('Mercado',                'saida',   '#2E7D32'),
    ('Restaurantes',           'saida',   '#FB8C00'),
    ('Transporte',             'saida',   '#1565C0'),
    ('Saúde',                  'saida',   '#E53935'),
    ('Assinaturas',            'saida',   '#5E35B1'),
    ('Pet',                    'saida',   '#8E24AA'),
    ('Lazer',                  'saida',   '#F9A825'),
    ('Educação',               'saida',   '#3949AB'),
    ('Roupas',                 'saida',   '#D81B60')
  ) as c(nome, tipo, cor)
  on conflict (user_id, lower(btrim(nome)))
  do update set tipo = excluded.tipo, cor = excluded.cor;

  -- 3) LANCAMENTOS --------------------------------------------------------------------------------
  -- "modelos" que se repetem a cada mes (cada = a cada quantos meses; variacao = quanto o valor pode mudar, em %).
  -- O valor muda um pouco por mes de forma fixa (sempre o mesmo resultado para o mesmo mes).
  insert into public.lancamentos (user_id, conta_id, categoria_id, tipo, valor, data_lancamento, descricao)
  select
    uid,
    co.id,
    ca.id,
    m.tipo,
    round((m.valor * (1 + (m.variacao / 100.0) * ((abs(hashtext(m.descricao || mes.n::text)) % 201) - 100) / 100.0))::numeric, 2),
    (date_trunc('month', current_date) - (mes.n * interval '1 month'))::date + (m.dia - 1),
    m.descricao
  from (values
    -- descricao,                 categoria,                conta,              tipo,      dia, valor,   variacao, cada
    ('Salário',                   'Salário',                'Conta Corrente',    'entrada',  5, 5200.00,  0, 1),
    ('Projeto freelance',         'Freelance',              'Conta Corrente',    'entrada', 20,  900.00, 40, 2),
    ('Rendimento da poupança',    'Rendimentos',            'Poupança',          'entrada', 15,   38.00, 15, 1),
    ('Aluguel',                   'Moradia',                'Conta Corrente',    'saida',    8, 1450.00,  0, 1),
    ('Condomínio',                'Moradia',                'Conta Corrente',    'saida',   10,  380.00,  0, 1),
    ('Conta de luz',              'Contas e serviços',      'Conta Corrente',    'saida',   12,  145.00, 25, 1),
    ('Internet',                  'Contas e serviços',      'Conta Corrente',    'saida',   14,  109.90,  0, 1),
    ('Supermercado - semana 1',   'Mercado',                'Cartão de Crédito', 'saida',    3,  345.00, 20, 1),
    ('Supermercado - semana 2',   'Mercado',                'Cartão de Crédito', 'saida',   11,  280.00, 20, 1),
    ('Supermercado - semana 3',   'Mercado',                'Cartão de Crédito', 'saida',   18,  310.00, 20, 1),
    ('Supermercado - semana 4',   'Mercado',                'Cartão de Crédito', 'saida',   25,  260.00, 20, 1),
    ('Padaria',                   'Mercado',                'Carteira',          'saida',    6,   42.00, 40, 1),
    ('Jantar fora',               'Restaurantes',           'Cartão de Crédito', 'saida',    9,  130.00, 30, 1),
    ('Delivery',                  'Restaurantes',           'Cartão de Crédito', 'saida',   21,   68.00, 30, 1),
    ('Almoço com amigos',         'Restaurantes',           'Carteira',          'saida',   16,   75.00, 30, 2),
    ('Combustível',               'Transporte',             'Cartão de Crédito', 'saida',    7,  220.00, 20, 1),
    ('Aplicativo de transporte',  'Transporte',             'Cartão de Crédito', 'saida',   19,   75.00, 40, 1),
    ('Farmácia',                  'Saúde',                  'Conta Corrente',    'saida',   13,   85.00, 50, 1),
    ('Plano de saúde',            'Saúde',                  'Conta Corrente',    'saida',    5,  289.90,  0, 1),
    ('Streaming de vídeo',        'Assinaturas',            'Cartão de Crédito', 'saida',   15,   55.90,  0, 1),
    ('Música online',             'Assinaturas',            'Cartão de Crédito', 'saida',   15,   21.90,  0, 1),
    ('Ração e petshop',           'Pet',                    'Cartão de Crédito', 'saida',   17,  140.00, 25, 1),
    ('Veterinário',               'Pet',                    'Conta Corrente',    'saida',    4,  220.00, 20, 3),
    ('Cinema',                    'Lazer',                  'Cartão de Crédito', 'saida',   22,   64.00, 40, 1),
    ('Passeio no fim de semana',  'Lazer',                  'Carteira',          'saida',   23,   90.00, 50, 2),
    ('Curso online',              'Educação',               'Cartão de Crédito', 'saida',   10,   99.00,  0, 1),
    ('Roupas',                    'Roupas',                 'Cartão de Crédito', 'saida',   24,  260.00, 40, 3)
  ) as m(descricao, categoria, conta, tipo, dia, valor, variacao, cada)
  cross join generate_series(0, 5) as mes(n)
  join public.categorias ca on ca.user_id = uid and lower(btrim(ca.nome)) = lower(m.categoria)
  join public.contas     co on co.user_id = uid and lower(btrim(co.nome)) = lower(m.conta)
  where mes.n % m.cada = 0
    -- nao cria lancamento no futuro (no mes atual, so ate hoje)
    and (date_trunc('month', current_date) - (mes.n * interval '1 month'))::date + (m.dia - 1) <= current_date;

  -- Lancamentos avulsos (acontecem uma vez so)
  insert into public.lancamentos (user_id, conta_id, categoria_id, tipo, valor, data_lancamento, descricao)
  select
    uid, co.id, ca.id, a.tipo, a.valor,
    (date_trunc('month', current_date) - (a.mes_atras * interval '1 month'))::date + (a.dia - 1),
    a.descricao
  from (values
    -- descricao,                    categoria,                conta,              tipo,      valor,  meses atras, dia
    ('Viagem de fim de semana',      'Lazer',                  'Cartão de Crédito', 'saida',   780.00,  2, 12),
    ('Reembolso de despesa',         'Presentes e reembolsos', 'Conta Corrente',    'entrada', 320.00,  1,  9),
    ('Presente de aniversário',      'Presentes e reembolsos', 'Conta Corrente',    'entrada', 150.00,  4, 18),
    ('Consulta particular',          'Saúde',                  'Conta Corrente',    'saida',   260.00,  3, 27),
    ('Tênis para corrida',           'Roupas',                 'Cartão de Crédito', 'saida',   349.90,  1,  2)
  ) as a(descricao, categoria, conta, tipo, valor, mes_atras, dia)
  join public.categorias ca on ca.user_id = uid and lower(btrim(ca.nome)) = lower(a.categoria)
  join public.contas     co on co.user_id = uid and lower(btrim(co.nome)) = lower(a.conta)
  where (date_trunc('month', current_date) - (a.mes_atras * interval '1 month'))::date + (a.dia - 1) <= current_date;
end $$;
