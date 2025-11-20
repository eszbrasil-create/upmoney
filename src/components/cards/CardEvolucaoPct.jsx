// src/components/cards/CardEvolucaoPct.jsx
// CardEvolucaoPct — tabela de % vs mês anterior (com linha TOTAL)
import React, { useMemo } from "react";

export default function CardEvolucaoPct({ columns = [], rows = [] }) {
  // % por ativo vs mês anterior
  const pctRows = useMemo(() => {
    return rows.map((r) => {
      const pcts = r.valores.map((v, i) => {
        if (i === 0) return null; // primeiro mês não tem comparação
        const prev = Number(r.valores[i - 1]) || 0;
        if (prev === 0) return null;
        return ((Number(v) - prev) / prev) * 100;
      });
      return { ativo: r.ativo, pcts };
    });
  }, [rows]);

  // TOTAL da carteira: soma por mês -> % vs mês anterior
  const totalPct = useMemo(() => {
    if (!columns.length) return [];
    const sumByMonth = columns.map((_, i) =>
      rows.reduce((acc, r) => acc + (Number(r.valores?.[i]) || 0), 0)
    );
    return sumByMonth.map((sum, i) => {
      if (i === 0) return null;
      const prev = Number(sumByMonth[i - 1]) || 0;
      if (prev === 0) return null;
      return ((sum - prev) / prev) * 100;
    });
  }, [columns, rows]);

  const fmtPct = (x) => `${x >= 0 ? "+" : ""}${x.toFixed(1)}%`;

  return (
    <div className="rounded-2xl bg-slate-800/70 border border-white/10 shadow-lg p-4 w-[640px] h-[360px] overflow-hidden shrink-0">
      <div className="mb-3 text-slate-100 font-semibold">Evolução %</div>

      <div className="relative h-[300px] overflow-auto rounded-xl border border-white/10 bg-slate-900/30">
        <table className="min-w-full border-separate border-spacing-0">
          {/* Cabeçalho */}
          <thead className="sticky top-0 z-20 bg-slate-800/80 backdrop-blur">
            <tr className="text-left text-slate-300 text-sm">
              <th
                className="sticky left-0 z-30 bg-slate-800/80 backdrop-blur px-3 py-2 font-medium border-b border-white/10"
                style={{ minWidth: 160, width: 160 }}
              >
                Ativos
              </th>
              {columns.map((m) => (
                <th
                  key={m}
                  className="px-3 py-2 font-medium border-b border-white/10 text-slate-300 whitespace-nowrap"
                >
                  {m}
                </th>
              ))}
            </tr>
          </thead>

          {/* Corpo */}
          <tbody>
            {pctRows.map((row) => (
              <tr key={row.ativo} className="text-sm">
                {/* célula fixa */}
                <td
                  className="sticky left-0 z-20 bg-slate-800/80 backdrop-blur px-3 py-2 border-b border-white/10 text-slate-100"
                  style={{ minWidth: 160, width: 160 }}
                >
                  {row.ativo}
                </td>

                {columns.map((_, i) => {
                  const v = row.pcts[i];
                  if (i === 0) {
                    return (
                      <td
                        key={i}
                        className="px-3 py-2 border-b border-white/10 text-slate-400 whitespace-nowrap"
                      >
                        —
                      </td>
                    );
                  }
                  const isUp = v !== null && v >= 0;
                  return (
                    <td
                      key={i}
                      className={`px-3 py-2 border-b border-white/10 whitespace-nowrap ${
                        v === null
                          ? "text-slate-400"
                          : isUp
                          ? "text-emerald-400"
                          : "text-rose-400"
                      }`}
                    >
                      {v === null ? "—" : fmtPct(v)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>

          {/* Rodapé TOTAL */}
          <tfoot className="sticky bottom-0 z-20 bg-slate-800/80 backdrop-blur">
            <tr className="text-sm font-semibold">
              <td
                className="sticky left-0 z-30 bg-slate-800/80 backdrop-blur px-3 py-2 border-t border-white/10 text-slate-100"
                style={{ minWidth: 160, width: 160 }}
              >
                Total
              </td>
              {columns.map((_, i) => {
                const v = totalPct[i];
                if (i === 0) {
                  return (
                    <td
                      key={i}
                      className="px-3 py-2 border-t border-white/10 text-slate-400 whitespace-nowrap"
                    >
                      —
                    </td>
                  );
                }
                const isUp = v !== null && v >= 0;
                return (
                  <td
                    key={i}
                    className={`px-3 py-2 border-t border-white/10 whitespace-nowrap ${
                      v === null
                        ? "text-slate-400"
                        : isUp
                        ? "text-emerald-400"
                        : "text-rose-400"
                    }`}
                  >
                    {v === null ? "—" : fmtPct(v)}
                  </td>
                );
              })}
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
