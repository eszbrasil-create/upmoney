// src/components/cards/CardEvolucaoPct.jsx
import React, { useMemo } from "react";

const MESES = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
const LEFT_COL_WIDTH = 130;

// normaliza "3/25", "mar/2025" etc -> "Mar/2025"
function normalizeMesAno(str) {
  if (!str || !str.includes("/")) return str;
  let [mes, ano] = str.split("/").map((s) => s.trim());

  // mês numérico -> MMM
  if (/^\d+$/.test(mes)) {
    const idx = Number(mes) - 1;
    if (idx >= 0 && idx < 12) mes = MESES[idx];
  } else {
    // texto -> MMM
    mes = mes.charAt(0).toUpperCase() + mes.slice(1, 3).toLowerCase();
    const found = MESES.find((m) => m.toLowerCase() === mes.toLowerCase());
    if (found) mes = found;
  }

  // ano 2 dígitos -> 4 dígitos
  if (/^\d{2}$/.test(ano)) ano = `20${ano}`;
  return `${mes}/${ano}`;
}

// formata percentual sem casas: +12%, -3%
const fmtPct = (x) => `${x >= 0 ? "+" : ""}${Math.round(x)}%`;

export default function CardEvolucaoPct({ columns = [], rows = [] }) {
  /** =========================================================
   *  1) Meses em ordem Jan → Dez e mapa de índices originais
   * ==========================================================*/
  const monthMeta = useMemo(() => {
    const norm = columns.map(normalizeMesAno);

    const getMonthIndex = (label) => {
      const [mes] = label.split("/");
      return MESES.indexOf(mes);
    };

    return norm
      .map((label, originalIndex) => ({ label, originalIndex }))
      .sort((a, b) => getMonthIndex(a.label) - getMonthIndex(b.label));
  }, [columns]);

  const normalizedColumns = useMemo(
    () => monthMeta.map((m) => m.label),
    [monthMeta]
  );

  /** =========================================================
   *  2) Linhas por ativo: % vs mês anterior (na ordem certa)
   * ==========================================================*/
  const pctRows = useMemo(() => {
    return rows.map((r) => {
      const orderedVals = monthMeta.map(
        ({ originalIndex }) => r.valores?.[originalIndex] ?? 0
      );

      const pcts = orderedVals.map((v, i) => {
        if (i === 0) return null;
        const atual = Number(v) || 0;
        const prev = Number(orderedVals[i - 1]) || 0;
        if (prev === 0) return null;
        return ((atual - prev) / prev) * 100;
      });

      return { ativo: r.ativo, pcts };
    });
  }, [rows, monthMeta]);

  /** =========================================================
   *  3) Total % por mês (soma de todos ativos)
   * ==========================================================*/
  const totalPct = useMemo(() => {
    // soma por mês (na ordem Jan→Dez que montamos)
    const sums = monthMeta.map(({ originalIndex }) =>
      rows.reduce(
        (acc, r) => acc + (Number(r.valores?.[originalIndex]) || 0),
        0
      )
    );

    // variação percentual mês a mês do TOTAL
    return sums.map((sum, i) => {
      if (i === 0) return null;
      const prev = Number(sums[i - 1]) || 0;
      if (prev === 0) return null;
      return ((sum - prev) / prev) * 100;
    });
  }, [rows, monthMeta]);

  return (
    <div className="rounded-3xl bg-slate-800/70 border border-white/10 shadow-lg w-[640px] h-[360px] p-4 overflow-hidden shrink-0">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-1">
        <div className="text-slate-100 font-semibold text-lg">Evolução %</div>
        <div className="text-[11px] text-slate-400">% vs mês anterior</div>
      </div>

      {/* WRAPPER: cabeçalho fixo, corpo rolável, total fixo embaixo */}
      <div className="relative h-[310px] rounded-2xl border border-white/10 bg-slate-900/40 flex flex-col">
        {/* ======= HEADER (sem scroll vertical, apenas horizontal) ======= */}
        <div className="overflow-x-auto">
          <table className="border-separate border-spacing-0 min-w-max w-full">
            <thead className="bg-slate-800/90 backdrop-blur">
              <tr className="text-left text-slate-300 text-sm">
                {/* coluna Ativos fixa à esquerda */}
                <th
                  className="sticky left-0 z-40 bg-slate-800/90 backdrop-blur px-3 py-1 font-medium border-b border-white/10"
                  style={{ minWidth: LEFT_COL_WIDTH, width: LEFT_COL_WIDTH }}
                >
                  Ativos
                </th>

                {normalizedColumns.map((m) => {
                  const [mes, ano] = m.split("/");
                  return (
                    <th
                      key={m}
                      className="px-3 py-1 font-medium border-b border-white/10 text-slate-300 whitespace-nowrap"
                    >
                      <div className="leading-tight text-left">
                        <div className="text-[13px] text-slate-200">{mes}</div>
                        <div className="text-[12px] text-slate-400">{ano}</div>
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
          </table>
        </div>

        {/* ======= BODY (scroll vertical + horizontal) ======= */}
        <div className="flex-1 overflow-x-auto overflow-y-auto">
          <table className="border-separate border-spacing-0 min-w-max w-full">
            <tbody>
              {pctRows.map((row, rowIdx) => {
                const zebra = rowIdx % 2 === 0;
                return (
                  <tr
                    key={row.ativo}
                    className={`text-sm ${
                      zebra ? "bg-white/[0.02]" : "bg-transparent"
                    } hover:bg-white/[0.04] transition`}
                  >
                    {/* Ativo fixo à esquerda */}
                    <td
                      className="sticky left-0 z-10 bg-slate-950/60 px-3 py-2 border-b border-white/10 text-slate-100 font-medium"
                      style={{ minWidth: LEFT_COL_WIDTH, width: LEFT_COL_WIDTH }}
                    >
                      {row.ativo}
                    </td>

                    {/* % por mês */}
                    {row.pcts.map((v, i) => {
                      if (i === 0) {
                        return (
                          <td
                            key={i}
                            className="px-3 py-2 border-b border-white/10 text-slate-500 whitespace-nowrap text-left tabular-nums"
                          >
                            —
                          </td>
                        );
                      }

                      if (v === null) {
                        return (
                          <td
                            key={i}
                            className="px-3 py-2 border-b border-white/10 text-slate-500 whitespace-nowrap text-left tabular-nums"
                          >
                            —
                          </td>
                        );
                      }

                      const isUp = v >= 0;

                      return (
                        <td
                          key={i}
                          className={`px-3 py-2 border-b border-white/10 whitespace-nowrap text-left tabular-nums ${
                            isUp ? "text-emerald-400" : "text-rose-400"
                          }`}
                        >
                          {fmtPct(v)}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}

              {pctRows.length === 0 && (
                <tr>
                  <td
                    colSpan={1 + normalizedColumns.length}
                    className="px-3 py-4 text-center text-xs text-slate-500"
                  >
                    Nenhum dado para calcular evolução.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* ======= TOTAL FIXO EMBAIXO DO CARD ======= */}
        <div className="overflow-x-auto border-t border-white/10">
          <table className="border-separate border-spacing-0 min-w-max w-full">
            <tfoot>
              <tr className="bg-slate-800/90 backdrop-blur text-sm">
                <td
                  className="sticky left-0 z-50 bg-slate-800/90 backdrop-blur px-3 py-2 text-slate-100 font-semibold"
                  style={{ minWidth: LEFT_COL_WIDTH, width: LEFT_COL_WIDTH }}
                >
                  Total
                </td>

                {totalPct.map((v, i) => {
                  if (i === 0 || v === null) {
                    return (
                      <td
                        key={i}
                        className="px-3 py-2 text-slate-400 whitespace-nowrap text-left tabular-nums"
                      >
                        —
                      </td>
                    );
                  }

                  const isUp = v >= 0;
                  return (
                    <td
                      key={i}
                      className={`px-3 py-2 whitespace-nowrap text-left tabular-nums ${
                        isUp ? "text-emerald-400" : "text-rose-400"
                      }`}
                    >
                      {fmtPct(v)}
                    </td>
                  );
                })}
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
