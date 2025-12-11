// src/components/cards/CardEvolucaoPct.jsx
import React, { useMemo } from "react";

const MESES = [
  "Jan","Fev","Mar","Abr","Mai","Jun",
  "Jul","Ago","Set","Out","Nov","Dez",
];

const LEFT_COL_WIDTH = 130;

function normalizeMesAno(str) {
  if (!str || !str.includes("/")) return str;

  let [mes, ano] = str.split("/").map((s) => s.trim());

  // mês numérico -> MMM
  if (/^\d+$/.test(mes)) {
    const idx = Number(mes) - 1;
    if (idx >= 0 && idx < 12) mes = MESES[idx];
  } else {
    // mês texto -> MMM
    mes = mes.charAt(0).toUpperCase() + mes.slice(1, 3).toLowerCase();
    if (!MESES.includes(mes)) {
      const found = MESES.find((m) => m.toLowerCase() === mes.toLowerCase());
      if (found) mes = found;
    }
  }

  // ano 2 dígitos -> 4 dígitos
  if (/^\d{2}$/.test(ano)) ano = `20${ano}`;

  return `${mes}/${ano}`;
}

export default function CardEvolucaoPct({ columns = [], rows = [] }) {
  // meses sempre em ordem Jan → Dez
  const normalizedColumns = useMemo(() => {
    const norm = columns.map(normalizeMesAno);
    return norm.sort((a, b) => {
      const m1 = MESES.indexOf(a.split("/")[0]);
      const m2 = MESES.indexOf(b.split("/")[0]);
      return m1 - m2;
    });
  }, [columns]);

  // linhas com % vs mês anterior
  const pctRows = useMemo(() => {
    return rows.map((r) => {
      const pcts = normalizedColumns.map((_, i) => {
        if (i === 0) return null;
        const atual = Number(r.valores?.[i]) || 0;
        const prev = Number(r.valores?.[i - 1]) || 0;
        if (prev === 0) return null;
        return ((atual - prev) / prev) * 100;
      });
      return { ativo: r.ativo, pcts };
    });
  }, [rows, normalizedColumns]);

  // linha TOTAL com % vs mês anterior
  const totalPct = useMemo(() => {
    const somaMes = normalizedColumns.map((_, i) =>
      rows.reduce((acc, r) => acc + (Number(r.valores?.[i]) || 0), 0)
    );

    return somaMes.map((v, i) => {
      if (i === 0) return null;
      const prev = somaMes[i - 1];
      if (!prev) return null;
      return ((v - prev) / prev) * 100;
    });
  }, [rows, normalizedColumns]);

  const fmtPct = (x) => `${x >= 0 ? "+" : ""}${Math.round(x)}%`;

  return (
    <div className="rounded-3xl bg-slate-800/70 border border-white/10 shadow-lg w-[640px] h-[360px] p-4 overflow-hidden shrink-0">
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <div className="text-slate-100 font-semibold text-lg">Evolução %</div>
        <div className="text-[11px] text-slate-400">% vs mês anterior</div>
      </div>

      {/* Área rolável com tabela */}
      <div className="relative h-[310px] overflow-x-auto overflow-y-auto rounded-2xl border border-white/10 bg-slate-900/40 pb-0">
        {/* conteúdo que rola (sem o TOTAL) */}
        <div className="min-w-max pb-10">
          <table className="border-separate border-spacing-0 w-full">
            {/* Cabeçalho fixo */}
            <thead className="sticky top-0 z-30 bg-slate-800/90 backdrop-blur">
              <tr className="text-left text-slate-300 text-sm">
                {/* coluna Ativos fixa */}
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
                      className="px-3 py-1 font-medium border-b border-white/10 whitespace-nowrap"
                    >
                      <div className="flex flex-col leading-tight">
                        <span className="text-[13px] text-slate-200">{mes}</span>
                        <span className="text-[12px] text-slate-400">{ano}</span>
                      </div>
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
                    {/* Ativo fixo */}
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
                            className="px-3 py-2 border-b border-white/10 text-slate-500 whitespace-nowrap"
                          >
                            —
                          </td>
                        );
                      }

                      const isUp = v !== null && v >= 0;

                      return (
                        <td
                          key={i}
                          className={`px-3 py-2 border-b border-white/10 whitespace-nowrap tabular-nums ${
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

        {/* TOTAL fixo no fundo, igual ao card Registros */}
        <div className="pointer-events-none absolute bottom-0 left-0 right-0">
          <div className="min-w-max">
            <table className="border-separate border-spacing-0 w-full">
              <tfoot>
                <tr className="bg-slate-800/90 backdrop-blur text-sm">
                  {/* label Total, também sticky na primeira coluna */}
                  <td
                    className="sticky left-0 z-50 bg-slate-800/90 backdrop-blur px-3 py-2 border-t border-white/10 text-slate-100 font-semibold"
                    style={{ minWidth: LEFT_COL_WIDTH, width: LEFT_COL_WIDTH }}
                  >
                    Total
                  </td>

                  {totalPct.map((v, i) => {
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
                        className={`px-3 py-2 border-t border-white/10 whitespace-nowrap tabular-nums ${
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
      </div>
    </div>
  );
}
