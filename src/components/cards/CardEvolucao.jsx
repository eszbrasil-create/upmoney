// src/components/cards/CardEvolucao.jsx
import React, { useEffect, useMemo, useState } from "react";

const MESES = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];

function normalizeMesAno(str) {
  if (!str || !str.includes("/")) return str;
  let [mes, ano] = str.split("/").map(s => s.trim());

  if (/^\d+$/.test(mes)) {
    const idx = Number(mes) - 1;
    if (idx >= 0 && idx < 12) mes = MESES[idx];
  } else {
    mes = mes.charAt(0).toUpperCase() + mes.slice(1, 3).toLowerCase();
    const found = MESES.find(m => m.toLowerCase() === mes.toLowerCase());
    if (found) mes = found;
  }

  if (/^\d{2}$/.test(ano)) ano = `20${ano}`;

  return `${mes}/${ano}`;
}

function Tooltip({ x, y, mes, ano, valor }) {
  return (
    <div className="fixed z-50 pointer-events-none" style={{ left: x, top: y }}>
      <div className="rounded-xl bg-slate-950/95 border border-white/10 px-3 py-2 shadow-2xl">
        <div className="text-[11px] text-slate-300 font-medium">{mes}/{ano}</div>
        <div className="text-sm text-slate-100 font-semibold">
          {valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
        </div>
      </div>
    </div>
  );
}

export default function CardEvolucao({ columns = [], rows = [] }) {
  const normalizedColumns = useMemo(() => columns.map(normalizeMesAno), [columns]);

  const totals = useMemo(() => {
    return normalizedColumns.map((_, i) =>
      rows.reduce((acc, r) => acc + (r.valores?.[i] || 0), 0)
    );
  }, [normalizedColumns, rows]);

  const max = Math.max(1, ...totals);

  const [animate, setAnimate] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setAnimate(true), 80);
    return () => clearTimeout(t);
  }, []);

  const [tip, setTip] = useState(null);

  const MAX_BAR_HEIGHT = 260;

  return (
    <div className="rounded-3xl bg-slate-800/70 border border-white/10 shadow-lg p-4 w-[590px] flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center mb-2">
        <span className="text-slate-100 font-semibold text-lg">Evolução</span>
        <span className="text-xs px-2 py-1 rounded-lg bg-slate-700/60 text-slate-300">Mensal</span>
      </div>

      {/* Gráfico */}
      <div className="flex-1 min-h-[345px] rounded-2xl border border-white/10 bg-slate-900/80 px-3 pt-6 pb-14 relative overflow-hidden">
        {/* Container absoluto: barras + labels na base */}
        <div className="absolute inset-x-3 bottom-0 h-full flex flex-col justify-end">
          
          {/* BARRAS (em cima) */}
          <div className="flex items-end gap-1 h-full pb-10">
            {totals.map((valor, i) => {
              const altura = animate
                ? Math.max(6, Math.round((valor / max) * MAX_BAR_HEIGHT))
                : 4;

              return (
                <div
                  key={i}
                  className="flex-1 flex justify-center"
                  onMouseEnter={(e) => {
                    const rect = e.currentTarget.getBoundingClientRects()[0];
                    const [mes, ano] = normalizedColumns[i].split("/");
                    setTip({ x: rect.left + rect.width / 2, y: rect.top - 10, mes, ano, valor });
                  }}
                  onMouseMove={(e) => setTip(prev => prev ? { ...prev, x: e.clientX, y: e.clientY - 12 } : prev)}
                  onMouseLeave={() => setTip(null)}
                >
                  <div
                    className="w-10 rounded-xl bg-sky-400/80 hover:bg-sky-300 transition-all duration-700 ease-out cursor-pointer"
                    style={{ height: `${altura}px` }}
                  />
                </div>
              );
            })}
          </div>

          {/* LABELS (embaixo das barras) */}
          <div className="flex justify-between gap-1">
            {normalizedColumns.map((col, i) => {
              const [mes, ano] = col.split("/");
              return (
                <div key={i} className="flex-1 text-center">
                  <div className="text-[12px] text-slate-300 font-medium">{mes}</div>
                  <div className="text-[10px] text-slate-400 opacity-80 mt-0.5">{ano}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {tip && <Tooltip {...tip} />}
    </div>
  );
}