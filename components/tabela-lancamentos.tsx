// Tabela de lançamentos (a tela da usuária). Só recebe dados simples, então pode ser usada
// tanto em páginas do servidor quanto em componentes de cliente.
import Link from "next/link";
import {
  descricaoExibida,
  formatarData,
  formatarValor,
  type LancamentoComCategoria,
} from "@/lib/lancamentos-utils";

type TabelaLancamentosProps = {
  lancamentos: LancamentoComCategoria[];
  // Na lista "Todos" mostramos + e − para separar entradas de saídas.
  // Quando a lista já é só de saídas (ou só de entradas), o sinal não precisa.
  mostrarSinal?: boolean;
};

export function TabelaLancamentos({ lancamentos, mostrarSinal = false }: TabelaLancamentosProps) {
  return (
    <div className="tabela-wrap">
      <table className="tabela">
        <thead>
          <tr>
            <th>Data</th>
            <th>Descrição</th>
            <th className="esconde-celular">Categoria</th>
            <th className="direita">Valor</th>
            <th>
              <span className="so-leitor">Ações</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {lancamentos.map((l) => {
            const sinal = mostrarSinal ? (l.tipo === "entrada" ? "+ " : "− ") : "";
            return (
              <tr key={l.id}>
                <td className="data">{formatarData(l.data)}</td>
                <td>
                  <Link href={`/lancamentos/${l.id}`} className="nome">
                    {descricaoExibida(l)}
                  </Link>
                </td>
                <td className={l.categoria ? "esconde-celular" : "suave esconde-celular"}>
                  {l.categoria ? (
                    <span className="categoria-celula">
                      {l.categoria.cor && (
                        <span
                          className="bolinha-cor"
                          style={{ backgroundColor: l.categoria.cor }}
                          aria-hidden="true"
                        />
                      )}
                      {l.categoria.nome}
                    </span>
                  ) : (
                    "—"
                  )}
                </td>
                <td className={`valor ${l.tipo}`}>
                  {sinal}
                  {formatarValor(l.valor)}
                </td>
                <td className="acoes">
                  <Link href={`/lancamentos/${l.id}/editar`}>Editar</Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
