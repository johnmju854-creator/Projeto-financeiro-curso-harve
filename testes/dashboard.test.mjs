// Testes das contas do dashboard (parte pura, sem banco). Rode com: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  mesEscolhido,
  mesAnterior,
  mesSeguinte,
  nomeDoMes,
  mesAbreviado,
  lancamentosDoMes,
  resumoDoMes,
  saidasPorCategoria,
  serieMensal,
  escalaDoGrafico,
  rotuloDoEixo,
  COR_NEUTRA,
} from "../lib/dashboard-utils.ts";

const l = (id, tipo, valor, data, categoria) => ({
  id, tipo, valor, data, descricao: `l${id}`,
  ...(categoria ? { categoria } : {}),
});
const mercado = { id: 1, nome: "Mercado", cor: "#2E7D32" };
const pet = { id: 2, nome: "Pet", cor: "#8E24AA" };

const lista = [
  l(1, "entrada", 5200, "2026-11-05"),
  l(2, "entrada", 900, "2026-11-20"),
  l(3, "saida", 345.1, "2026-11-03", mercado),
  l(4, "saida", 280.2, "2026-11-11", mercado),
  l(5, "saida", 360, "2026-11-04", pet),
  l(6, "saida", 100, "2026-11-08"), // sem categoria
  l(7, "entrada", 5000, "2026-10-05"),
  l(8, "saida", 4000, "2026-10-10", mercado),
];

test("mesEscolhido: usa o mês pedido se for válido e não for futuro", () => {
  assert.equal(mesEscolhido("2026-10", "2026-11"), "2026-10");
  assert.equal(mesEscolhido("2026-11", "2026-11"), "2026-11");
});

test("mesEscolhido: formato errado, vazio, futuro ou muito antigo voltam ao mês atual", () => {
  for (const ruim of [undefined, "", "abc", "2026-13", "2026-00", "2026-1", "2026-11-01", "1999-12", "2027-01"]) {
    assert.equal(mesEscolhido(ruim, "2026-11"), "2026-11", String(ruim));
  }
});

test("mesAnterior e mesSeguinte atravessam a virada do ano", () => {
  assert.equal(mesAnterior("2026-01"), "2025-12");
  assert.equal(mesAnterior("2026-11"), "2026-10");
  assert.equal(mesSeguinte("2026-12"), "2027-01");
  assert.equal(mesSeguinte("2026-03"), "2026-04");
});

test("nomeDoMes e mesAbreviado", () => {
  assert.equal(nomeDoMes("2026-11"), "Novembro de 2026");
  assert.equal(nomeDoMes("2026-03"), "Março de 2026");
  assert.equal(mesAbreviado("2026-09"), "Set");
});

test("lancamentosDoMes separa por mês", () => {
  assert.equal(lancamentosDoMes(lista, "2026-11").length, 6);
  assert.equal(lancamentosDoMes(lista, "2026-10").length, 2);
  assert.equal(lancamentosDoMes(lista, "2026-09").length, 0);
});

test("resumoDoMes soma entradas e saídas do mês e calcula o saldo (sem erro de centavos)", () => {
  const r = resumoDoMes(lista, "2026-11");
  assert.equal(r.entradas, 6100);
  assert.equal(r.saidas, 1085.3); // 345,10 + 280,20 + 360 + 100
  assert.equal(r.saldo, 5014.7);
  assert.equal(r.quantidadeEntradas, 2);
  assert.equal(r.quantidadeSaidas, 4);
  assert.equal(r.sobraPercentual, 82);
});

test("resumoDoMes de um mês vazio zera tudo e não divide por zero", () => {
  const r = resumoDoMes(lista, "2026-09");
  assert.deepEqual(r, {
    entradas: 0, saidas: 0, saldo: 0,
    quantidadeEntradas: 0, quantidadeSaidas: 0, sobraPercentual: null,
  });
});

test("resumoDoMes: saldo negativo quando gasta mais do que entra", () => {
  const r = resumoDoMes([l(1, "entrada", 100, "2026-11-01"), l(2, "saida", 250.5, "2026-11-02")], "2026-11");
  assert.equal(r.saldo, -150.5);
  assert.equal(r.sobraPercentual, -150); // -150,5% arredonda para -150
});

test("saidasPorCategoria agrupa, ordena da maior para a menor e calcula %", () => {
  const f = saidasPorCategoria(lista, "2026-11");
  assert.deepEqual(f.map((x) => x.nome), ["Mercado", "Pet", "Sem categoria"]);
  assert.equal(f[0].valor, 625.3);
  assert.equal(f[0].cor, "#2E7D32");
  assert.equal(f[2].cor, COR_NEUTRA);
  assert.deepEqual(f.map((x) => x.percentual), [58, 33, 9]); // de 1085,30
});

test("saidasPorCategoria ignora entradas e outros meses; mês sem saída dá lista vazia", () => {
  assert.deepEqual(saidasPorCategoria(lista, "2026-09"), []);
  assert.deepEqual(saidasPorCategoria([l(1, "entrada", 50, "2026-11-01")], "2026-11"), []);
});

test("saidasPorCategoria junta as pequenas em 'Outras (n)'", () => {
  const muitas = Array.from({ length: 9 }, (_, i) =>
    l(i + 1, "saida", 100 - i, "2026-11-01", { id: i + 1, nome: `Cat ${i + 1}`, cor: "#112233" }),
  );
  const f = saidasPorCategoria(muitas, "2026-11", 6);
  assert.equal(f.length, 7);
  assert.equal(f[6].nome, "Outras (3)");
  assert.equal(f[6].cor, COR_NEUTRA);
  assert.equal(f[6].valor, 94 + 93 + 92); // as 3 menores: Cat 7, 8 e 9
});

test("saidasPorCategoria não cria 'Outras (1)': mostra a categoria sozinha", () => {
  const sete = Array.from({ length: 7 }, (_, i) =>
    l(i + 1, "saida", 100 - i, "2026-11-01", { id: i + 1, nome: `Cat ${i + 1}`, cor: "#112233" }),
  );
  const f = saidasPorCategoria(sete, "2026-11", 6);
  assert.equal(f.length, 7);
  assert.equal(f[6].nome, "Cat 7");
});

test("serieMensal devolve 6 meses em ordem, com zeros nos meses vazios", () => {
  const s = serieMensal(lista, "2026-11", "2026-11");
  assert.deepEqual(s.map((p) => p.mes), ["2026-06", "2026-07", "2026-08", "2026-09", "2026-10", "2026-11"]);
  assert.deepEqual(s.map((p) => p.rotulo), ["Jun", "Jul", "Ago", "Set", "Out", "Nov"]);
  assert.equal(s[0].entradas, 0);
  assert.equal(s[4].entradas, 5000);
  assert.equal(s[4].saidas, 4000);
  assert.equal(s[5].saldo, 5014.7);
});

test("serieMensal marca só o mês de hoje como 'em andamento'", () => {
  const atual = serieMensal(lista, "2026-11", "2026-11");
  assert.deepEqual(atual.map((p) => p.emAndamento), [false, false, false, false, false, true]);
  const passado = serieMensal(lista, "2026-10", "2026-11");
  assert.equal(passado.some((p) => p.emAndamento), false);
});

test("serieMensal atravessa a virada do ano", () => {
  const s = serieMensal([], "2026-02", "2026-11", 4);
  assert.deepEqual(s.map((p) => p.mes), ["2025-11", "2025-12", "2026-01", "2026-02"]);
});

test("escalaDoGrafico escolhe valores redondos e cobre o maior valor", () => {
  const e = escalaDoGrafico(6308);
  assert.deepEqual(e.marcas, [0, 2500, 5000, 7500]);
  assert.equal(e.maximo, 7500);
  const pequeno = escalaDoGrafico(95);
  assert.ok(pequeno.maximo >= 95);
  assert.equal(pequeno.marcas[0], 0);
});

test("escalaDoGrafico com tudo zerado ou inválido não quebra", () => {
  assert.deepEqual(escalaDoGrafico(0).marcas, [0, 500, 1000]);
  assert.equal(escalaDoGrafico(NaN).maximo, 1000);
});

test("rotuloDoEixo: inteiro até 9.999 e 'mil' depois", () => {
  assert.equal(rotuloDoEixo(2500), "2.500");
  assert.equal(rotuloDoEixo(0), "0");
  assert.equal(rotuloDoEixo(12000), "12 mil");
});
