// src/components/cards/CardEvolucao.jsx
import React, { useEffect, useMemo, useState, useRef } from "react";

const MESES = [/* ... mesmo de antes ... */];

// normalizeMesAno e Tooltip permanecem exatamente iguais

export default function CardEvolucao({ columns = [], rows = [] }) {
  const normalizedColumns = useMemo(() => columns.map(normalizeMesAno), [columns]);

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

  // Referência para sincronizar o scroll dos labels com as barras
  const scrollRef = useRef(null);
  const labelsRef = useRef(null);

  const handleScroll = (e) => {
    if (labelsRef.current) {
      labelsRef.current.scrollLeft = e.target.scrollLeft;
    }
  };

  return (
    <div className="rounded-3xl bg-slate-800/70 border border-white/10 shadow-lg p-4 w-[600px] h-[415px] shrink-0 flex flex-col">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-slate-100 font-semibold text-lg">Evolução</span>
        <span className="text-xs px-2 py-1 rounded-lg bg-slate-700/60 text-slate-200">
          Mensal
        </span>
      </div>

      {/* GRÁFICO */}
      <div className="flex-1 rounded-2xl border border-white/10 bg-slate-900/80 overflow-hidden flex flex-col">
        {/* Barras (rolam) */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex-1 overflow-x-auto overflow-y-hidden px-3 pt-3 scrollbar-hide"
        >
          <div className="flex items-end gap-1 min-w-max h-full">
            {totals.map((valor, i) => {
              const alturaReal = Math.max(4, Math.round((valor / max) * 300));
              const altura = animate ? alturaReal : 4;
              const [mes, ano] = normalizedColumns[i].split("/");

              return (
                <div key={i} className="w-10 flex flex-col justify-end">
                  <div
                    className="w-full rounded-xl bg-sky-400/80 hover:bg-sky-300 transition-all duration-700 ease-out"
                    style={{ height: `${altura}px` }}
                    onMouseEnter={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      setTip({
                        x: rect.left + rect.width / 2,
                        y: rect.top - 8,
                        mes,
                        ano,
                        valor,
                      });
                    }}
                    onMouseMove={(e) =>
                      setTip((prev) =>
                        prev ? { ...prev, x: e.clientX, y: e.clientY - 12 } : prev
                      )
                    }
                    onMouseLeave={() => setTip(null)}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Labels fixos embaixo, mas com mesmo scroll */}
        <div
          ref={labelsRef}
          className="flex gap-1 px-3 py-2 border-t border-white/5 overflow-x-auto scrollbar-hide"
        >
          {normalizedColumns.map((col, i) => {
            const [mes, ano] = col.split("/");
            return (
              <div key={i} className="w-10 text-center">
                <div className="text-[13px] text-slate-200 font-medium leading-none">
                  {mes}
                </div>
                <div className="text-[11px] text-slate-400">
                  {ano}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tooltip */}
      {tip && (
        <Tooltip x={tip.x} y={tip.y} mes={tip.mes} ano={tip.ano} valor={tip.valor} />
      )}
    </div>
  );
}