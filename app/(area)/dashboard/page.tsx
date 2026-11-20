import Link from "next/link";
import {
  CartoesDoMes,
  EvolucaoMeses,
  FiltroMes,
  SaidasPorCategoria,
} from "@/components/dashboard-secoes";
import { TabelaLancamentos } from "@/components/tabela-lancamentos";
import { exigirUsuario } from "@/lib/auth";
import {
  lancamentosDoMes,
  mesDaData,
  mesEscolhido,
  resumoDoMes,
  saidasPorCategoria,
  serieMensal,
} from "@/lib/dashboard-utils";
import { listarLancamentos } from "@/lib/lancamentos";
import { formatarData, hojeISO } from "@/lib/lancamentos-utils";

// Depende de quem está logado e do dia de hoje, então nunca pode ser guardada pronta
export const dynamic = "force-dynamic";

type Props = {
  // o mês vem na URL: /dashboard?mes=2026-10 (se estiver errado ou no futuro, vale o mês atual)
  searchParams: Promise<{ mes?: string }>;
};

// Server Component: busca os lançamentos só da pessoa logada e faz as contas aqui no servidor.
export default async function DashboardPage({ searchParams }: Props) {
  const usuario = await exigirUsuario();
  const { mes: mesPedido } = await searchParams;

  const hoje = hojeISO();
  const atual = mesDaData(hoje);
  const mes = mesEscolhido(mesPedido, atual);
  const ateHoje = mes === atual ? formatarData(hoje).slice(0, 5) : null; // "20/11"

  const lancamentos = await listarLancamentos(usuario.id);

  if (lancamentos.length === 0) {
    return (
      <section>
        <div className="cabecalho-pagina">
          <h1>Dashboard</h1>
        </div>
        <div className="vazio">
          <p>Seu resumo aparece aqui assim que você fizer o primeiro lançamento.</p>
          <Link href="/lancamentos/novo" className="link-botao">
            + Novo lançamento
          </Link>
        </div>
      </section>
    );
  }

  const resumo = resumoDoMes(lancamentos, mes);
  const fatias = saidasPorCategoria(lancamentos, mes);
  const serie = serieMensal(lancamentos, mes, atual);
  const ultimos = lancamentosDoMes(lancamentos, mes).slice(0, 5); // a lista já vem do mais novo

  return (
    <section>
      <div className="cabecalho-pagina">
        <h1>Dashboard</h1>
        <FiltroMes mes={mes} atual={atual} />
      </div>

      <CartoesDoMes resumo={resumo} ateHoje={ateHoje} />

      <div className="paineis">
        <section className="painel" aria-labelledby="titulo-categorias">
          <h2 className="titulo-secao" id="titulo-categorias">
            Saídas por categoria
          </h2>
          <SaidasPorCategoria fatias={fatias} />
        </section>

        <section className="painel" aria-labelledby="titulo-meses">
          <h2 className="titulo-secao" id="titulo-meses">
            Entradas e saídas, últimos 6 meses
          </h2>
          <EvolucaoMeses serie={serie} ateHoje={ateHoje} />
        </section>
      </div>

      <section className="painel" aria-labelledby="titulo-ultimos">
        <div className="cabecalho-painel">
          <h2 className="titulo-secao" id="titulo-ultimos">
            Últimos lançamentos do mês
          </h2>
          <Link href="/lancamentos">Ver todos</Link>
        </div>
        {ultimos.length === 0 ? (
          <p className="suave-texto">Nenhum lançamento neste mês.</p>
        ) : (
          <TabelaLancamentos lancamentos={ultimos} mostrarSinal />
        )}
      </section>
    </section>
  );
}
