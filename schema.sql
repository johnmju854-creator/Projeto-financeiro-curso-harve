-- schema.sql — Caderneta da Claudia
-- Cria as tabelas do banco de dados. Execute ANTES do dados.sql.
-- Compativel com PostgreSQL (usa tipos e DATE padrao SQL).

-- Limpa tudo se ja existir (ordem inversa das dependencias)
DROP TABLE IF EXISTS lancamentos;
DROP TABLE IF EXISTS recorrencias;
DROP TABLE IF EXISTS categorias;
DROP TABLE IF EXISTS contas;
DROP TABLE IF EXISTS usuarios;

-- 1) Usuarios: quem usa a caderneta
CREATE TABLE usuarios (
  usuario_id  INTEGER       PRIMARY KEY,
  nome        VARCHAR(100)  NOT NULL,
  email       VARCHAR(150)  NOT NULL UNIQUE,
  senha_hash  VARCHAR(255)  NOT NULL,
  criado_em   DATE          NOT NULL
);

-- 2) Contas: corrente, cartao, carteira (especie) e poupanca
CREATE TABLE contas (
  conta_id       INTEGER        PRIMARY KEY,
  usuario_id     INTEGER        NOT NULL REFERENCES usuarios (usuario_id),
  nome           VARCHAR(100)   NOT NULL,
  tipo           VARCHAR(20)    NOT NULL
                 CHECK (tipo IN ('corrente', 'cartao', 'especie', 'poupanca')),
  saldo_inicial  NUMERIC(12,2)  NOT NULL DEFAULT 0,
  data_abertura  DATE           NOT NULL
);

-- 3) Categorias: cada usuario tem as suas (Mercado, Salario, ...)
CREATE TABLE categorias (
  categoria_id  INTEGER       PRIMARY KEY,
  usuario_id    INTEGER       NOT NULL REFERENCES usuarios (usuario_id),
  nome          VARCHAR(100)  NOT NULL,
  tipo          VARCHAR(10)   NOT NULL CHECK (tipo IN ('entrada', 'saida')),
  cor_hex       VARCHAR(7)    CHECK (cor_hex ~ '^#[0-9A-Fa-f]{6}$')
);

-- 4) Recorrencias: contas fixas todo mes (aluguel, salario, streaming...)
CREATE TABLE recorrencias (
  recorrencia_id  INTEGER        PRIMARY KEY,
  usuario_id      INTEGER        NOT NULL REFERENCES usuarios (usuario_id),
  conta_id        INTEGER        NOT NULL REFERENCES contas (conta_id),
  categoria_id    INTEGER        NOT NULL REFERENCES categorias (categoria_id),
  descricao       VARCHAR(150)   NOT NULL,
  valor_previsto  NUMERIC(12,2)  NOT NULL CHECK (valor_previsto > 0),
  dia_do_mes      INTEGER        NOT NULL CHECK (dia_do_mes BETWEEN 1 AND 31),
  data_inicio     DATE           NOT NULL,
  data_fim        DATE,                      -- vazio = ainda vale
  CHECK (data_fim IS NULL OR data_fim >= data_inicio)
);

-- 5) Lancamentos: cada entrada ou saida de dinheiro
--    recorrencia_id e vazio quando o lancamento nao veio de uma conta fixa.
--    descricao pode ser vazia (NULL) ou so espacos: o dado real e "sujo".
CREATE TABLE lancamentos (
  lancamento_id    INTEGER        PRIMARY KEY,
  usuario_id       INTEGER        NOT NULL REFERENCES usuarios (usuario_id),
  conta_id         INTEGER        NOT NULL REFERENCES contas (conta_id),
  categoria_id     INTEGER        NOT NULL REFERENCES categorias (categoria_id),
  recorrencia_id   INTEGER        REFERENCES recorrencias (recorrencia_id),
  tipo             VARCHAR(10)    NOT NULL CHECK (tipo IN ('entrada', 'saida')),
  valor            NUMERIC(12,2)  NOT NULL CHECK (valor > 0),
  data_lancamento  DATE           NOT NULL,
  descricao        VARCHAR(200)
);

-- Indices para deixar as consultas mais rapidas
CREATE INDEX idx_contas_usuario        ON contas (usuario_id);
CREATE INDEX idx_categorias_usuario    ON categorias (usuario_id);
CREATE INDEX idx_recorrencias_usuario  ON recorrencias (usuario_id);
CREATE INDEX idx_lanc_usuario_data     ON lancamentos (usuario_id, data_lancamento);
CREATE INDEX idx_lanc_conta            ON lancamentos (conta_id);
CREATE INDEX idx_lanc_categoria        ON lancamentos (categoria_id);
CREATE INDEX idx_lanc_recorrencia      ON lancamentos (recorrencia_id);
