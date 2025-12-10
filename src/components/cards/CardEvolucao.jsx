// src/components/cards/CardEvolucao.jsx
import React, { useEffect, useMemo, useState } from "react";

const MESES = [
  "Jan","Fev","Mar","Abr","Mai","Jun",
  "Jul","Ago","Set","Out","Nov","Dez"
];

function normalizeMesAno(str) {
  if (!str || !str.includes("/")) return str;

  let [mes, ano] = str.split("/").map((s) => s.trim());

  if (/^\d+$/.test(mes)) {
    const idx = Number(mes) - 1;
    if (idx >= 0 && idx < 12) mes = MESES[idx];
  } else {
    mes = mes.charAt(0).toUpperCase() + mes.slice(1, 3).toLowerCase();
    if (!MESES.includes(mes)) {
      const found = MESES.find((m) => m.toLowerCase() === mes.toLowerCase());
      if (found) mes = found;
    }
  }

  if (/^\d{2}$/.test(ano)) ano = `20${ano}`;

  return `${mes}/${ano}`;
}

function Tooltip({ x, y, mes, ano, valor }) {
  return (
    <div className="fixed z-50 pointer-events-none" style={{ left: x, top: y }}>
      <div className="rounded-xl bg-slate-950/95 border border-white/10 px-3 py-2 shadow-2xl">
        <div className="text-[11px] text-slate-300 font-medium">
          {mes}/{ano}
        </div>
        <div className="text-sm text-slate-100 font-semibold">
          {valor.toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL",
          })}
        </div>
      </div>
    </div>
  );
}

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
    <div className="rounded-3xl bg-slate-800/70 border border-white/10 shadow-lg p-4 w-[600px] h-[390px] overflow-hidden shrink-0">
      <div className="flex items-center justify-between mb-3">
        <span className="text-slate-100 font-semibold text-lg">Evolução</span>
        <span className="text-xs px-2 py-1 rounded-lg bg-slate-700/60 text-slate-200">
          Mensal
        </span>
      </div>

      {/* ÁREA DO GRÁFICO  (ajustada) */}
      <div className="h-[350px] rounded-2xl border border-white/10 bg-slate-900/80 px-3 pt-3 pb-6 overflow-x-auto overflow-y-hidden">
        <div className="flex items-end gap-1 min-w-max">
          {totals.map((valor, i) => {
            const alturaReal = Math.max(
              4,
              Math.round((valor / max) * 300)
            );
            const altura = animate ? alturaReal : 4;
            const [mes, ano] = normalizedColumns[i].split("/");

            return (
              <div key={i} className="flex flex-col items-center gap-2 w-10">
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
                  onMouseMove={(e) => {
                    setTip((prev) =>
                      prev
                        ? { ...prev, x: e.clientX, y: e.clientY - 12 }
                        : prev
                    );
                  }}
                  onMouseLeave={() => setTip(null)}
                />

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
