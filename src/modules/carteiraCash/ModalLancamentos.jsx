// src/modules/carteiraCash/ModalLancamentos.jsx
import React, { useMemo } from "react";

// Helpers locais (iguais aos do CarteiraCash)
function toNum(x) {
  if (x === "" || x === null || x === undefined) return 0;
  const n = Number(String(x).replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

function formatDateBR(iso) {
  if (!iso) return "—";
  const parts = iso.split("-");
  if (parts.length !== 3) return iso;
  const [y, m, d] = parts;
  return `${d}/${m}/${y}`;
}

export default function ModalLancamentos({
  isOpen,
  onClose,
  novoLanc,
  onChangeLanc,
  onSalvarLanc,
  lancamentos,
  onDeleteLanc,
}) {
  if (!isOpen) return null;

  // Lista de lançamentos ordenada: MAIS RECENTE → MAIS ANTIGO
  const lancOrdenados = useMemo(() => {
    const arr = [...(lancamentos || [])];

    return arr.sort((a, b) => {
      const da = a.dataEntrada || "";
      const db = b.dataEntrada || "";

      // ambos têm data → compara desc (mais recente primeiro)
      if (da && db) {
        if (da < db) return 1;
        if (da > db) return -1;
        return (b.id || 0) - (a.id || 0);
      }

      // quem tem data vem antes de quem não tem
      if (da && !db) return -1;
      if (!da && db) return 1;

      // nenhum tem data → id desc
      return (b.id || 0) - (a.id || 0);
    });
  }, [lancamentos]);

  return (
    <div className="fixed inset-0 z-40 bg-black/60 flex items-center justify-center p-4">
      <div className="w-[70vw] h-[90vh] rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-6 flex flex-col overflow-hidden">
        {/* Cabeçalho + formulário (fixo) */}
        <div className="flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-slate-100 font-semibold text-lg">
              Adicionar ativo à base
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-slate-100 text-xl leading-none"
            >
              ×
            </button>
          </div>

          <form onSubmit={onSalvarLanc} className="space-y-3">
            <div className="flex flex-nowrap items-end gap-3 overflow-x-auto">
              <div className="flex flex-col flex-[0_0_130px]">
                <label className="block text-[11px] text-slate-300 mb-1">
                  Ativo (ticker)
                </label>
                <input
                  name="ticker"
                  value={novoLanc.ticker}
                  onChange={onChangeLanc}
                  placeholder="ex: VALE3"
                  className="w-full rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:ring-1 focus:ring-emerald-400"
                  autoFocus
                />
              </div>

              <div className="flex flex-col flex-[0_0_110px]">
                <label className="block text-[11px] text-slate-300 mb-1">
                  Tipo
                </label>
                <select
                  name="tipo"
                  value={novoLanc.tipo}
                  onChange={onChangeLanc}
                  className="w-full rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-xs text-slate-100 outline-none focus:ring-1 focus:ring-emerald-400"
                >
                  <option value="ACOES">Ações</option>
                  <option value="FII">FII</option>
                  <option value="RF">Renda Fixa</option>
                </select>
              </div>

              <div className="flex flex-col flex-[0_0_150px]">
                <label className="block text-[11px] text-slate-300 mb-1">
                  Data de entrada
                </label>
                <input
                  type="date"
                  name="dataEntrada"
                  value={novoLanc.dataEntrada}
                  onChange={onChangeLanc}
                  className="w-full rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-xs text-slate-100 outline-none focus:ring-1 focus:ring-emerald-400"
                />
              </div>

              <div className="flex flex-col flex-[0_0_120px]">
                <label className="block text-[11px] text-slate-300 mb-1">
                  Quantidade
                </label>
                <input
                  name="qtd"
                  value={novoLanc.qtd}
                  onChange={onChangeLanc}
                  inputMode="decimal"
                  placeholder="0"
                  className="w-full rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:ring-1 focus:ring-emerald-400"
                />
              </div>

              <div className="flex flex-col flex-[0_0_160px]">
                <label className="block text-[11px] text-slate-300 mb-1">
                  Preço de compra (R$)
                </label>
                <input
                  name="preco"
                  value={novoLanc.preco}
                  onChange={onChangeLanc}
                  inputMode="decimal"
                  placeholder="0,00"
                  className="w-full rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:ring-1 focus:ring-emerald-400"
                />
              </div>

              <div className="flex flex-col flex-[0_0_auto]">
                <span className="block text-[11px] text-transparent mb-1">
                  &nbsp;
                </span>
                <button
                  type="submit"
                  className="
                    px-4 py-2 rounded-xl
                    bg-emerald-500 text-xs sm:text-sm font-semibold text-slate-950
                    hover:bg-emerald-400 whitespace-nowrap
                  "
                >
                  Salvar lançamento
                </button>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 max-w-xl">
              Cada lançamento é guardado na base escondida. A tabela principal
              abaixo mostra o consolidado por ativo (quantidade total, preço
              médio e data de entrada mais antiga).
            </p>
          </form>
        </div>

        {/* Lista com SCROLL interno */}
        <div className="mt-6 border-t border-slate-700 pt-4 flex-1 min-h-0 flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-slate-100 text-sm font-semibold">
              Lançamentos cadastrados
            </h3>
            <span className="text-[11px] text-slate-400">
              Total: {lancOrdenados.length} lançamento(s)
            </span>
          </div>

          {lancOrdenados.length === 0 ? (
            <p className="text-[11px] text-slate-500">
              Nenhum lançamento cadastrado ainda. Preencha os campos acima e
              clique em <strong>Salvar lançamento</strong>.
            </p>
          ) : (
            <div className="rounded-xl border border-slate-700 bg-slate-950/60 flex-1 min-h-0 overflow-y-auto">
              <table className="w-full text-xs">
                <thead className="bg-slate-800/80 text-slate-300">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">#</th>
                    <th className="px-3 py-2 text-left font-medium">Data</th>
                    <th className="px-1 py-2 text-center font-medium">
                      {/* lixeira */}
                    </th>
                    <th className="px-3 py-2 text-left font-medium">Ticker</th>
                    <th className="px-3 py-2 text-left font-medium">Tipo</th>
                    <th className="px-3 py-2 text-right font-medium">
                      Quantidade
                    </th>
                    <th className="px-3 py-2 text-right font-medium">
                      Preço (R$)
                    </th>
                    <th className="px-3 py-2 text-right font-medium">
                      Valor (R$)
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {lancOrdenados.map((l, idx) => {
                    const qtd = toNum(l.qtd);
                    const preco = toNum(l.preco);
                    const valor = qtd * preco;

                    return (
                      <tr
                        key={l.id}
                        className="border-t border-slate-800 hover:bg-slate-800/40"
                      >
                        <td className="px-3 py-1.5 text-slate-400">
                          {idx + 1}
                        </td>

                        {/* Data */}
                        <td className="px-3 py-1.5 text-slate-100">
                          {l.dataEntrada
                            ? formatDateBR(l.dataEntrada)
                            : "—"}
                        </td>

                        {/* Lixeira ao lado da data */}
                        <td className="px-1 py-1.5 text-center align-middle">
                          <button
                            type="button"
                            onClick={() => onDeleteLanc(l.id)}
                            className="
                              inline-flex items-center justify-center
                              h-6 w-6 rounded-full
                              text-slate-400 hover:text-rose-100
                              hover:bg-rose-500/70
                              text-[11px]
                              transition
                            "
                            title="Excluir lançamento"
                          >
                            🗑️
                          </button>
                        </td>

                        <td className="px-3 py-1.5 text-slate-100">
                          {(l.ticker || "").toUpperCase()}
                        </td>
                        <td className="px-3 py-1.5 text-slate-200">
                          {l.tipo === "RF"
                            ? "RF"
                            : l.tipo === "FII"
                            ? "FII"
                            : "Ações"}
                        </td>
                        <td className="px-3 py-1.5 text-right text-slate-100">
                          {l.qtd || "—"}
                        </td>
                        <td className="px-3 py-1.5 text-right text-slate-100">
                          {preco > 0
                            ? preco.toLocaleString("pt-BR", {
                                style: "currency",
                                currency: "BRL",
                              })
                            : "—"}
                        </td>
                        <td className="px-3 py-1.5 text-right text-slate-100">
                          {valor > 0
                            ? valor.toLocaleString("pt-BR", {
                                style: "currency",
                                currency: "BRL",
                              })
                            : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
