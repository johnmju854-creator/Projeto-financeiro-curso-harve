// Testes simples com o executor que ja vem no Node (sem biblioteca extra).
// Rode com: npm test
// Testam so a parte pura (lib/lancamentos-utils.ts); a busca no Supabase precisa de banco de verdade.
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  filtrarLancamentos,
  totalDeSaidas,
  lerLancamento,
  lerLinhaDoBanco,
  descricaoExibida,
  formatarData,
  formatarValor,
  validarLancamento,
  lerValor,
  valorParaCampo,
  hojeISO,
  idDaUrlValido,
  lerItemComNome,
  rotuloTipo,
  totalDeEntradas,
} from "../lib/lancamentos-utils.ts";

// Linhas como o Supabase devolve (colunas do banco + categoria embutida)
const linhas = [
  { id: 1, tipo: "saida", valor: 341.43, data_lancamento: "2025-01-01", descricao: "mercado do mes", categoria_id: 1, categorias: { nome: "Mercado" } },
  { id: 2, tipo: "entrada", valor: 856.74, data_lancamento: "2025-01-02", descricao: "salario", categoria_id: null, categorias: null },
  { id: 3, tipo: "saida", valor: 89.05, data_lancamento: "2025-01-03", descricao: "conta de luz", categoria_id: null, categorias: null },
  { id: 4, tipo: "saida", valor: 123.97, data_lancamento: "2025-01-04", descricao: "padaria", categoria_id: null, categorias: null },
  { id: 5, tipo: "saida", valor: 2350, data_lancamento: "2025-01-05", descricao: "aluguel", categoria_id: null, categorias: null },
  { id: 6, tipo: "entrada", valor: 1200, data_lancamento: "2025-01-10", descricao: "freela", categoria_id: null, categorias: null },
];
const lista = linhas.map(lerLinhaDoBanco);

test("lerLinhaDoBanco converte as 6 linhas e traz o nome da categoria", () => {
  assert.equal(lista.length, 6);
  assert.ok(lista.every((l) => l !== null));
  assert.deepEqual(lista[0], {
    id: 1, descricao: "mercado do mes", valor: 341.43, tipo: "saida",
    data: "2025-01-01", categoriaId: 1, categoria: { id: 1, nome: "Mercado" },
  });
  assert.equal(lista[1].categoria, undefined); // sem categoria (opcional)
  assert.equal(lista[1].categoriaId, undefined);
});

test("lerLinhaDoBanco aceita categoria embutida como lista, id uuid e data com horario", () => {
  const uuid = "3f2b8c1e-1111-4222-8333-444455556666";
  const l = lerLinhaDoBanco({
    id: uuid, tipo: "entrada", valor: "10.50", data_lancamento: "2025-03-04T00:00:00+00:00",
    descricao: null, categoria_id: uuid, categorias: [{ nome: "Salario" }],
  });
  assert.deepEqual(l, {
    id: uuid, descricao: null, valor: 10.5, tipo: "entrada",
    data: "2025-03-04", categoriaId: uuid, categoria: { id: uuid, nome: "Salario" },
  });
});

test("lerLinhaDoBanco descarta linha invalida", () => {
  const base = linhas[0];
  assert.equal(lerLinhaDoBanco({ ...base, tipo: "despesa" }), null);
  assert.equal(lerLinhaDoBanco({ ...base, valor: null }), null);
  assert.equal(lerLinhaDoBanco({ ...base, id: null }), null);
});

test("filtra por tipo", () => {
  assert.equal(filtrarLancamentos(lista, "", "todos").length, 6);
  assert.deepEqual(
    filtrarLancamentos(lista, "", "entrada").map((l) => l.descricao),
    ["salario", "freela"],
  );
  assert.equal(filtrarLancamentos(lista, "", "saida").length, 4);
});

test("filtra pela descricao ignorando maiusculas e acentos", () => {
  assert.deepEqual(
    filtrarLancamentos(lista, "SALÁRIO", "todos").map((l) => l.descricao),
    ["salario"],
  );
  assert.deepEqual(
    filtrarLancamentos(lista, "a", "entrada").map((l) => l.descricao),
    ["salario", "freela"],
  );
});

test("combina busca e tipo; sem resultado devolve lista vazia", () => {
  assert.deepEqual(filtrarLancamentos(lista, "salario", "saida"), []);
  assert.deepEqual(filtrarLancamentos([], "", "todos"), []);
});

test("totalDeSaidas: digitando 'mer' o total e R$ 341,43", () => {
  const filtrada = filtrarLancamentos(lista, "mer", "todos");
  assert.equal(totalDeSaidas(filtrada), 341.43);
});

test("totalDeSaidas soma so as saidas e ignora entradas", () => {
  // 341.43 + 89.05 + 123.97 + 2350.00 = 2904.45 (sem salario e freela)
  assert.equal(totalDeSaidas(lista), 2904.45);
  assert.equal(totalDeSaidas(filtrarLancamentos(lista, "", "entrada")), 0);
  assert.equal(totalDeSaidas([]), 0);
});

test("descricao nula ou vazia nao derruba o filtro e aparece como '(sem descricao)'", () => {
  const sujos = [
    { id: 1, descricao: null, valor: 10, tipo: "saida", data: "2025-01-01" },
    { id: 2, descricao: "   ", valor: 20, tipo: "saida", data: "2025-01-02" },
    { id: 3, descricao: "padaria", valor: 5, tipo: "saida", data: "2025-01-03" },
  ];
  assert.doesNotThrow(() => filtrarLancamentos(sujos, "pad", "todos"));
  assert.deepEqual(filtrarLancamentos(sujos, "pad", "todos").map((l) => l.id), [3]);
  assert.equal(descricaoExibida(sujos[0]), "(sem descrição)");
  assert.equal(descricaoExibida(sujos[1]), "(sem descrição)");
  assert.equal(descricaoExibida(sujos[2]), "padaria");
});

test("totalDeSaidas ignora valor invalido (nunca vira NaN)", () => {
  const sujos = [
    { id: 1, descricao: "a", valor: NaN, tipo: "saida", data: "2025-01-01" },
    { id: 2, descricao: "b", valor: Infinity, tipo: "saida", data: "2025-01-01" },
    { id: 3, descricao: "c", valor: 10.1, tipo: "saida", data: "2025-01-01" },
    { id: 4, descricao: "d", valor: 0.2, tipo: "saida", data: "2025-01-01" },
  ];
  assert.equal(totalDeSaidas(sujos), 10.3);
});

test("lerLancamento aceita registro bom e normaliza tipo e data", () => {
  const l = lerLancamento({
    id: 7, descricao: null, valor: "12.5", tipo: " Saída ", data: "2025-03-04T00:00:00Z",
  });
  assert.deepEqual(l, { id: 7, descricao: null, valor: 12.5, tipo: "saida", data: "2025-03-04" });
});

test("lerLancamento descarta registros invalidos", () => {
  const base = { id: 1, descricao: "x", valor: 10, tipo: "saida", data: "2025-01-01" };
  assert.ok(lerLancamento(base));
  assert.equal(lerLancamento({ ...base, tipo: "despesa" }), null);
  assert.equal(lerLancamento({ ...base, valor: NaN }), null);
  assert.equal(lerLancamento({ ...base, valor: "abc" }), null);
  assert.equal(lerLancamento({ ...base, valor: -5 }), null);
  assert.equal(lerLancamento({ ...base, data: "ontem" }), null);
  assert.equal(lerLancamento({ ...base, id: "" }), null);
  assert.equal(lerLancamento({ ...base, id: 1.5 }), null);
  assert.equal(lerLancamento({ ...base, id: undefined }), null);
});

test("formatarData e formatarValor", () => {
  assert.equal(formatarData("2025-01-01"), "01/01/2025");
  assert.equal(formatarData("2025-01-01T00:00:00Z"), "01/01/2025");
  assert.match(formatarValor(341.43), /341,43/);
});

// ---- formulario de lancamento (criar e editar) ----

const campos = {
  descricao: "mercado do mes",
  valor: "341,43",
  tipo: "saida",
  data: "2025-01-01",
  contaId: "3",
  categoriaId: "",
};

test("validarLancamento aceita dados bons e limpa os campos", () => {
  const r = validarLancamento({ ...campos, descricao: "  padaria  ", categoriaId: "7" });
  assert.deepEqual(r, {
    ok: true,
    dados: {
      descricao: "padaria", valor: 341.43, tipo: "saida",
      data: "2025-01-01", contaId: "3", categoriaId: "7",
    },
  });
});

test("validarLancamento: categoria vazia vira null (e opcional)", () => {
  const r = validarLancamento(campos);
  assert.equal(r.ok, true);
  assert.equal(r.dados.categoriaId, null);
});

test("validarLancamento recusa descricao vazia, so espacos ou grande demais", () => {
  assert.equal(validarLancamento({ ...campos, descricao: "" }).ok, false);
  assert.equal(validarLancamento({ ...campos, descricao: "    " }).ok, false);
  assert.match(validarLancamento({ ...campos, descricao: "" }).erro, /descrição/);
  assert.equal(validarLancamento({ ...campos, descricao: "a".repeat(201) }).ok, false);
  assert.equal(validarLancamento({ ...campos, descricao: "a".repeat(200) }).ok, true);
});

test("validarLancamento recusa valor zero, negativo, texto ou enorme", () => {
  for (const valor of ["0", "0,00", "-5", "-0,01", "abc", "", "  ", "12,345", "1e3", "99999999999"]) {
    const r = validarLancamento({ ...campos, valor });
    assert.equal(r.ok, false, `valor ${JSON.stringify(valor)} deveria ser recusado`);
    assert.match(r.erro, /valor/);
  }
});

test("validarLancamento recusa tipo, data, conta e categoria invalidos", () => {
  assert.equal(validarLancamento({ ...campos, tipo: "despesa" }).ok, false);
  assert.equal(validarLancamento({ ...campos, tipo: "" }).ok, false);
  assert.equal(validarLancamento({ ...campos, data: "" }).ok, false);
  assert.equal(validarLancamento({ ...campos, data: "2025-02-30" }).ok, false);
  assert.equal(validarLancamento({ ...campos, data: "01/01/2025" }).ok, false);
  assert.equal(validarLancamento({ ...campos, data: "2025-02-28" }).ok, true);
  assert.equal(validarLancamento({ ...campos, contaId: "" }).ok, false);
  assert.equal(validarLancamento({ ...campos, contaId: "1; drop table lancamentos" }).ok, false);
  assert.equal(validarLancamento({ ...campos, categoriaId: "1,or=(id.gt.0)" }).ok, false);
  assert.equal(validarLancamento({ ...campos, contaId: "3f2b8c1e-1111-4222-8333-444455556666" }).ok, true);
});

test("lerValor entende virgula, ponto e milhar; recusa o que e ambiguo", () => {
  assert.equal(lerValor("12,50"), 12.5);
  assert.equal(lerValor("12.50"), 12.5);
  assert.equal(lerValor("1.234,56"), 1234.56);
  assert.equal(lerValor("1,234.56"), 1234.56);
  assert.equal(lerValor("R$ 89,05"), 89.05);
  assert.equal(lerValor("100"), 100);
  assert.equal(lerValor("1.234"), null); // milhar ou decimal? nao da para saber
  assert.equal(lerValor("12,345"), null);
  assert.equal(lerValor("1,2,3"), null);
  assert.equal(lerValor(""), null);
});

test("valorParaCampo, hojeISO, idDaUrlValido e lerItemComNome", () => {
  assert.equal(valorParaCampo(341.43), "341,43");
  assert.equal(valorParaCampo(2350), "2350,00");
  assert.match(hojeISO(), /^\d{4}-\d{2}-\d{2}$/);
  assert.equal(idDaUrlValido("12"), true);
  assert.equal(idDaUrlValido("3f2b8c1e-1111-4222-8333-444455556666"), true);
  assert.equal(idDaUrlValido(""), false);
  assert.equal(idDaUrlValido("../etc"), false);
  assert.equal(idDaUrlValido("1 or 1=1"), false);
  assert.deepEqual(lerItemComNome({ id: 2, nome: "Conta Corrente" }), { id: 2, nome: "Conta Corrente" });
  assert.equal(lerItemComNome({ id: 2, nome: null }), null);
});

test("lerLinhaDoBanco traz a conta do lancamento (para a tela de editar)", () => {
  const l = lerLinhaDoBanco({ ...linhas[0], conta_id: 9 });
  assert.equal(l.contaId, 9);
});

// ---- Visual da usuária: "Saída"/"Entrada", total de entradas e cor da categoria ----

test("rotuloTipo mostra Saída e Entrada (nunca o valor cru do banco)", () => {
  assert.equal(rotuloTipo("saida"), "Saída");
  assert.equal(rotuloTipo("entrada"), "Entrada");
});

test("totalDeEntradas soma só as entradas (e totalDeSaidas continua só saídas)", () => {
  const validos = lista.filter((l) => l !== null);
  assert.equal(totalDeEntradas(validos), 2056.74); // 856,74 + 1200
  assert.equal(totalDeSaidas(validos), 2904.45);
  assert.equal(totalDeEntradas([]), 0);
});

test("lerLinhaDoBanco traz a cor da categoria só se for #RRGGBB válido", () => {
  const base = { ...linhas[0], categorias: { nome: "Mercado", cor: "#2E7D32" } };
  assert.equal(lerLinhaDoBanco(base)?.categoria?.cor, "#2E7D32");
  const ruim = lerLinhaDoBanco({ ...base, categorias: { nome: "Mercado", cor: "azul" } });
  assert.equal(ruim?.categoria?.nome, "Mercado");
  assert.equal(ruim?.categoria?.cor, undefined);
});
