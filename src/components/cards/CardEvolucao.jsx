// src/components/cards/CardEvolucao.jsx
import React, { useEffect, useMemo, useState } from "react";

const MESES = [
  "Jan","Fev","Mar","Abr","Mai","Jun",
  "Jul","Ago","Set","Out","Nov","Dez"
];

// ... (normalizeMesAno e Tooltip permanecem iguais)

export default function CardEvolucao({ columns = [], rows = [] }) {
  const normalizedColumns = useMemo(
    () => columns.map(normalizeMesAno),
    [columns]
  );

  const totals = useMemo(() => {
    return normalizedColumns.map((_, colIdx) =>
      rows.reduce((acc, r) => acc + (r.valores?.[colIdx] || 0), 0)
    );
  }, [normalizedColumns, rows]);

  const max = Math.max(1, ...totals);

  const [animate, setAnimate] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setAnimate(true), 50);
    return () => clearTimeout(t);
  }, []);

  const [tip, setTip] = useState(null);

  return (
    <div className="rounded-3xl bg-slate-800/70 border border-white/10 shadow-lg p-4 w-[600px] h-[415px] shrink-0 flex flex-col">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-slate-100 font-semibold text-lg">Evolução</span>
        <span className="text-xs px-2 py-1 rounded-lg bg-slate-700/60 text-slate-200">
          Mensal
        </span>
      </div>

      {/* ÁREA DO GRÁFICO + LABELS FIXOS ABAIXO */}
      <div className="flex-1 flex flex-col">
        {/* Só as barras (com scroll horizontal se necessário) */}
        <div className="flex-1 rounded-2xl border border-white/10 bg-slate-900/80 px-3 pt-3 pb-2 overflow-x-auto overflow-y-hidden">
          <div className="flex items-end gap-1 min-w-max h-full">
            {totals.map((valor, i) => {
              const alturaReal = Math.max(4, Math.round((valor / max) * 300));
              const altura = animate ? alturaReal : 4;

              return (
                <div key={i} className="w-10 flex flex-col justify-end">
                  <div
                    className="w-full rounded-xl bg-sky-400/80 hover:bg-sky-300 transition-all duration-700 ease-out"
                    style={{ height: `${altura}px` }}
                    onMouseEnter={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const [mes, ano] = normalizedColumns[i].split("/");
                      setTip({
                        x: rect.left + rect.width / 2,
                        y: rect.top - 8,
                        mes,
                        ano,
                        valor,
                      });
                    }}
                    onMouseMove={(e) => {
                      setTip((prev) =>
                        prev ? { ...prev, x: e.clientX, y: e.clientY - 12 } : prev
                      );
                    }}
                    onMouseLeave={() => setTip(null)}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Labels fixos abaixo (não rolam) */}
        <div className="flex gap-1 px-3 mt-2 overflow-x-auto">
          {normalizedColumns.map((col, i) => {
            const [mes, ano] = col.split("/");
            return (
              <div key={i} className="w-10 flex flex-col items-center">
                <div className="text-[13px] text-slate-200 text-center leading-tight whitespace-nowrap font-medium">
                  {mes}
                  <br />
                  <span className="text-[12px] opacity-70 font-normal text-slate-300">
                    {ano}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tooltip */}
      {tip && (
        <Tooltip
          x={tip.x}
          y={tip.y}
          mes={tip.mes}
          ano={tip.ano}
          valor={tip.valor}
        />
      )}
    </div>
  );
}