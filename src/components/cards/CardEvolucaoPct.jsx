// src/components/cards/CardEvolucaoPct.jsx
import React, { useMemo } from "react";

const MESES = [
  "Jan","Fev","Mar","Abr","Mai","Jun",
  "Jul","Ago","Set","Out","Nov","Dez"
];

const LEFT_COL_WIDTH = 130; // alinhado com CardRegistro

function normalizeMesAno(str) {
  if (!str || !str.includes("/")) return str;
  let [mes, ano] = str.split("/").map(s => s.trim());

  if (/^\d+$/.test(mes)) {
    const idx = Number(mes) - 1;
    if (idx >= 0 && idx < 12) mes = MESES[idx];
  } else {
    mes = mes.charAt(0).toUpperCase() + mes.slice(1,3).toLowerCase();
    const found = MESES.find(m => m.toLowerCase() === mes.toLowerCase());
    if (found) mes = found;
  }

  if (/^\d{2}$/.test(ano)) ano = `20${ano}`;
  return `${mes}/${ano}`;
}

export default function CardEvolucaoPct({ columns = [], rows = [] }) {

  const normalizedColumns = useMemo(
    () => columns.map(normalizeMesAno),
    [columns]
  );

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

  const totalPct = useMemo(() => {
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

  const fmtPct = (x) => `${x >= 0 ? "+" : ""}${Math.round(x)}%`;

  return (
    <div className="rounded-3xl bg-slate-800/70 border border-white/10 shadow-lg p-4 w-[640px] h-[360px] overflow-hidden shrink-0">
      <div className="flex items-center justify-between mb-3">
        <div className="text-slate-100 font-semibold text-lg">Evolução %</div>
        <div className="text-[11px] text-slate-400">% vs mês anterior</div>
      </div>

      {/* Área da tabela com scroll interno */}
      <div className="relative h-[300px] overflow-x-auto overflow-y-auto rounded-2xl border border-white/10 bg-slate-900/40">
        {/* conteúdo rolável (head + linhas) */}
        <div className="min-w-max pb-10">
          <table className="border-separate border-spacing-0 w-full">
            {/* Header */}
            <thead className="sticky top-0 z-40 bg-slate-800/90 backdrop-blur">
              <tr className="text-left text-slate-300 text-sm">
                {/* Coluna fixa (Ativos) igual ao CardRegistro */}
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
                      className="px-4 py-1 font-medium border-b border-white/10 text-slate-300"
                      style={{ minWidth: 85, width: 85 }}
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

            {/* Body */}
            <tbody>
              {pctRows.map((row, rowIdx) => {
                const zebra = rowIdx % 2 === 0;
                return (
                  <tr
                    key={row.ativo}
                    className={`${zebra ? "bg-white/[0.02]" : "bg-transparent"} hover:bg-white/[0.05] transition text-sm`}
                  >
                    {/* sticky com z menor que header para não sobrepor */}
                    <td
                      className="sticky left-0 z-10 bg-slate-950/60 px-3 py-2 border-b border-white/10 text-slate-100 font-medium"
                      style={{ minWidth: LEFT_COL_WIDTH, width: LEFT_COL_WIDTH }}
                    >
                      {row.ativo}
                    </td>

                    {row.pcts.map((v, i) => {
                      const isUp = v !== null && v >= 0;

                      if (i === 0)
                        return (
                          <td
                            key={i}
                            className="px-3 py-2 border-b border-white/10 text-slate-500 text-left"
                          >
                            —
                          </td>
                        );

                      return (
                        <td
                          key={i}
                          className={`px-3 py-2 border-b border-white/10 text-left tabular-nums
                            ${
                              v === null
                                ? "text-slate-500"
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
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Rodapé TOTAL fixo no fundo do card – mesmo comportamento do CardRegistro */}
        {normalizedColumns.length > 0 && (
          <div className="pointer-events-none absolute bottom-0 left-0 right-0">
            <div className="min-w-max">
              <table className="border-separate border-spacing-0 w-full">
                <tfoot>
                  <tr className="bg-slate-800/90 backdrop-blur text-sm font-semibold">
                    <td
                      className="sticky left-0 z-50 bg-slate-800/90 backdrop-blur px-3 py-2 border-t border-white/10 text-slate-100"
                      style={{ minWidth: LEFT_COL_WIDTH, width: LEFT_COL_WIDTH }}
                    >
                      Total
                    </td>

                    {totalPct.map((v, i) => {
                      const isUp = v !== null && v >= 0;

                      if (i === 0)
                        return (
                          <td
                            key={i}
                            className="px-3 py-2 border-t border-white/10 text-slate-400 text-left"
                          >
                            —
                          </td>
                        );

                      return (
                        <td
                          key={i}
                          className={`px-3 py-2 border-t border-white/10 text-left tabular-nums
                            ${
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
        )}
      </div>
    </div>
  );
}
