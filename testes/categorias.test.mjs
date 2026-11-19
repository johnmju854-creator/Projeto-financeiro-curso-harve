// Testes da validação de categorias (parte pura, sem banco). Rode com: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  validarCategoria,
  lerCategoria,
  corValida,
  COR_PADRAO,
  ERRO_NOME_VAZIO,
  ERRO_NOME_LONGO,
  ERRO_TIPO,
  ERRO_COR,
} from "../lib/categorias-utils.ts";

const valido = { nome: "Pet", tipo: "saida", cor: "#8E24AA" };

test("categoria válida passa e o nome perde os espaços das pontas", () => {
  const r = validarCategoria({ ...valido, nome: "  Pet  " });
  assert.deepEqual(r, { ok: true, dados: { nome: "Pet", tipo: "saida", cor: "#8E24AA" } });
});

test("nome vazio ou só espaços dá erro", () => {
  for (const nome of ["", "   "]) {
    assert.deepEqual(validarCategoria({ ...valido, nome }), { ok: false, erro: ERRO_NOME_VAZIO });
  }
});

test("nome com 40 caracteres passa; com 41 dá erro", () => {
  assert.equal(validarCategoria({ ...valido, nome: "a".repeat(40) }).ok, true);
  assert.deepEqual(validarCategoria({ ...valido, nome: "a".repeat(41) }), {
    ok: false,
    erro: ERRO_NOME_LONGO,
  });
});

test("tipo só pode ser entrada ou saida", () => {
  assert.equal(validarCategoria({ ...valido, tipo: "entrada" }).ok, true);
  for (const tipo of ["", "Saída", "outro"]) {
    assert.deepEqual(validarCategoria({ ...valido, tipo }), { ok: false, erro: ERRO_TIPO });
  }
});

test("cor precisa ser #RRGGBB", () => {
  for (const cor of ["", "8E24AA", "#8E24A", "#8E24AAA", "#GGGGGG", "red", "#8E24AA;"]) {
    assert.deepEqual(validarCategoria({ ...valido, cor }), { ok: false, erro: ERRO_COR }, cor);
  }
  assert.equal(corValida("#000000"), true);
});

test("cor em minúsculas é aceita e gravada em maiúsculas", () => {
  const r = validarCategoria({ ...valido, cor: " #8e24aa " });
  assert.equal(r.ok && r.dados.cor, "#8E24AA");
});

test("lerCategoria lê uma linha do banco", () => {
  assert.deepEqual(lerCategoria({ id: 3, nome: "Pet", tipo: "entrada", cor: "#8E24AA" }), {
    id: 3,
    nome: "Pet",
    tipo: "entrada",
    cor: "#8E24AA",
  });
});

test("lerCategoria usa padrão para tipo/cor estranhos e descarta linha sem nome", () => {
  const c = lerCategoria({ id: 1, nome: "Lazer", tipo: "xx", cor: "azul" });
  assert.equal(c?.tipo, "saida");
  assert.equal(c?.cor, COR_PADRAO);
  assert.equal(lerCategoria({ id: 1 }), null);
});
