import React, { useMemo } from "react";

export default function CardEvolucao({ columns = [], rows = [] }) {
  const totals = useMemo(() => {
    return columns.map((_, colIdx) =>
      rows.reduce((acc, r) => acc + (r.valores?.[colIdx] || 0), 0)
    );
  }, [columns, rows]);

  const max = Math.max(1, ...totals);

  return (
    <div className="rounded-2xl bg-slate-800/70 border border-white/10 shadow-lg p-4 w-[590px] h-[460px] overflow-hidden shrink-0"> 
      {/* ⬆️ AQUI adicionamos ml-56 */}
      
      <div className="flex items-center justify-between mb-3">
        <span className="text-slate-100 font-semibold text-lg">Evolução</span>
        <span className="text-xs px-2 py-1 rounded bg-slate-700/60 text-slate-200">
          Mensal
        </span>
      </div>

      <div className="h-[380px] rounded-xl border border-white/10 bg-slate-900/800 p-3 overflow-x-auto overflow-y-hidden">
        <div className="flex items-end gap-1 min-w-max">
          {totals.map((v, i) => {
            const h = Math.max(4, Math.round((v / max) * 300));
            const [mes, ano] = columns[i].split("/");

            return (
              <div key={i} className="flex flex-col items-center gap-2 w-10">
                <div
                  className="w-full rounded-md bg-sky-400/80"
                  style={{ height: `${h}px` }}
                  title={v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                />
                <div className="text-[10px] text-slate-300 text-center leading-tight whitespace-nowrap">
                  {mes}
                  <br />
                  <span className="text-[9px] opacity-60">{ano}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
