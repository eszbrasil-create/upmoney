// src/components/cards/CardEvolucaoPct.jsx
// CardEvolucaoPct — tabela de % vs mês anterior (com linha TOTAL)
import React, { useMemo } from "react";

const MESES = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];

function normalizeMesAno(str) {
  if (!str || !str.includes("/")) return str;

  let [mes, ano] = str.split("/").map(s => s.trim());

  // mês numérico -> MMM
  if (/^\d+$/.test(mes)) {
    const idx = Number(mes) - 1;
    if (idx >= 0 && idx < 12) mes = MESES[idx];
  } else {
    mes = mes.charAt(0).toUpperCase() + mes.slice(1,3).toLowerCase();
    const found = MESES.find(m => m.toLowerCase() === mes.toLowerCase());
    if (found) mes = found;
  }

  // ano 2 dígitos -> 4 dígitos
  if (/^\d{2}$/.test(ano)) ano = `20${ano}`;

  return `${mes}/${ano}`;
}

export default function CardEvolucaoPct({ columns = [], rows = [] }) {
  const normalizedColumns = useMemo(
    () => columns.map(normalizeMesAno),
    [columns]
  );

  // % por ativo vs mês anterior
  const pctRows = useMemo(() => {
    return rows.map((r) => {
      const pcts = r.valores.map((v, i) => {
        if (i === 0) return null;
        const prev = Number(r.valores[i - 1]) || 0;
        if (prev === 0) return null;
        return ((Number(v) - prev) / prev) * 100;
      });
      return { ativo: r.ativo, pcts };
    });
  }, [rows]);

  // TOTAL da carteira: soma por mês -> % vs mês anterior
  const totalPct = useMemo(() => {
    if (!normalizedColumns.length) return [];
    const sumByMonth = normalizedColumns.map((_, i) =>
      rows.reduce((acc, r) => acc + (Number(r.valores?.[i]) || 0), 0)
    );
    return sumByMonth.map((sum, i) => {
      if (i === 0) return null;
      const prev = Number(sumByMonth[i - 1]) || 0;
      if (prev === 0) return null;
      return ((sum - prev) / prev) * 100;
    });
  }, [normalizedColumns, rows]);

  // ✅ sem casas decimais
  const fmtPct = (x) => `${x >= 0 ? "+" : ""}${Math.round(x)}%`;

  return (
    <div className="rounded-3xl bg-slate-800/70 border border-white/10 shadow-lg p-4 w-[640px] h-[360px] overflow-hidden shrink-0">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="text-slate-100 font-semibold text-lg">Evolução %</div>
        <div className="text-[11px] text-slate-400">% vs mês anterior</div>
      </div>

      {/* Área da tabela com scroll interno */}
      <div className="relative h-[300px] overflow-auto rounded-2xl border border-white/10 bg-slate-900/30">
        <table className="min-w-full border-separate border-spacing-0">
          {/* Cabeçalho */}
          <thead className="sticky top-0 z-20 bg-slate-800/90 backdrop-blur">
            <tr className="text-left text-slate-300 text-sm">
              <th
                className="sticky left-0 z-30 bg-slate-800/90 backdrop-blur px-3 py-2 font-medium border-b border-white/10"
                style={{ minWidth: 130, width: 130 }}
              >
                Ativos
              </th>

              {normalizedColumns.map((m) => {
                const [mes, ano] = m.split("/");
                return (
                  <th
                    key={m}
                    className="px-3 py-2 font-medium border-b border-white/10 text-slate-300 whitespace-nowrap text-center"
                  >
                    <div className="text-[12px] leading-tight">{mes}</div>
                    <div className="text-[11px] opacity-60 leading-tight">{ano}</div>
                  </th>
                );
              })}
            </tr>
          </thead>

          {/* Corpo */}
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
                  {/* Primeira coluna fixa com transparência */}
                  <td
                    className="sticky left-0 z-20 bg-slate-900/40 backdrop-blur px-3 py-2 border-b border-white/10 text-slate-100 font-medium"
                    style={{ minWidth: 130, width: 130 }}
                  >
                    {row.ativo}
                  </td>

                  {normalizedColumns.map((_, i) => {
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
                        className={`px-3 py-2 border-b border-white/10 whitespace-nowrap text-left tabular-nums ${
                          v === null
                            ? "text-slate-400"
                            : isUp
                            ? "text-emerald-400 font-semibold"
                            : "text-rose-400 font-semibold"
                        }`}
                      >
                        {v === null ? "—" : fmtPct(v)}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>

          {/* Rodapé TOTAL */}
          <tfoot className="sticky bottom-0 z-20 bg-slate-800/90 backdrop-blur">
            <tr className="text-sm font-semibold">
              {/* Total fixo com transparência igual */}
              <td
                className="sticky left-0 z-30 bg-slate-900/40 backdrop-blur px-3 py-2 border-t border-white/10 text-slate-100"
                style={{ minWidth: 130, width: 130 }}
              >
                Total
              </td>

              {normalizedColumns.map((_, i) => {
                const v = totalPct[i];

                if (i === 0) {
                  return (
                    <td
                      key={i}
                      className="px-3 py-2 border-t border-white/10 text-slate-400 whitespace-nowrap text-left"
                    >
                      —
                    </td>
                  );
                }

                const isUp = v !== null && v >= 0;
                return (
                  <td
                    key={i}
                    className={`px-3 py-2 border-t border-white/10 whitespace-nowrap text-left tabular-nums ${
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
