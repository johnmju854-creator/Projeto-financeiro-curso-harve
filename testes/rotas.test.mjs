// Testes de para onde a pessoa é mandada ao abrir o app. Rode com: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { destinoInicial } from "../lib/rotas-utils.ts";

test("quem já está logado vai direto para os lançamentos (não vê a tela de login)", () => {
  assert.equal(destinoInicial(true), "/lancamentos");
});

test("quem não está logado vai para o login", () => {
  assert.equal(destinoInicial(false), "/login");
});
