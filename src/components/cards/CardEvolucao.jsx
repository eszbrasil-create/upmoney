// src/components/cards/CardEvolucao.jsx
import React, { useEffect, useMemo, useState } from "react";

const MESES = [
  "Jan",
  "Fev",
  "Mar",
  "Abr",
  "Mai",
  "Jun",
  "Jul",
  "Ago",
  "Set",
  "Out",
  "Nov",
  "Dez",
];

function normalizeMesAno(str) {
  if (!str || !str.includes("/")) return str;
  let [mes, ano] = str.split("/").map((s) => s.trim());

  // mês numérico -> texto
  if (/^\d+$/.test(mes)) {
    const idx = Number(mes) - 1;
    if (idx >= 0 && idx < 12) mes = MESES[idx];
  } else {
    mes = mes.charAt(0).toUpperCase() + mes.slice(1, 3).toLowerCase();
    const found = MESES.find((m) => m.toLowerCase() === mes.toLowerCase());
    if (found) mes = found;
  }

  // ano 2 dígitos -> 4 dígitos
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
  // normaliza colunas
  const normalizedColumns = useMemo(
    () => columns.map(normalizeMesAno),
    [columns]
  );

  // soma total por mês (coluna)
  const totals = useMemo(
    () =>
      normalizedColumns.map((_, colIdx) =>
        rows.reduce(
          (acc, r) => acc + Number(r.valores?.[colIdx] || 0),
          0
        )
      ),
    [normalizedColumns, rows]
  );

  // evita max = 0 ou NaN
  const max = Math.max(...totals) || 1;

  const [animate, setAnimate] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setAnimate(true), 80);
    return () => clearTimeout(t);
  }, []);

  const [tip, setTip] = useState(null);

  // altura máxima ocupando praticamente todo o espaço útil do gráfico
  const MAX_BAR_HEIGHT = 260;

  return (
    <div className="rounded-3xl bg-slate-800/70 border border-white/10 shadow-lg p-4 w-[590px] flex flex-col">
      {/* Cabeçalho */}
      <div className="flex justify-between items-center mb-2">
        <span className="text-slate-100 font-semibold text-lg">Evolução</span>
        <span className="text-xs px-2 py-1 rounded-lg bg-slate-700/60 text-slate-300">
          Mensal
        </span>
      </div>

      {/* Container do gráfico */}
      <div className="flex-1 rounded-2xl border border-white/10 bg-slate-900/80 px-3 pt-4 pb-3 overflow-x-auto overflow-y-hidden">
        <div className="h-full flex flex-col min-w-max">
          {/* Área das barras ocupa quase tudo */}
          <div className="flex-1 flex items-end gap-2">
            {totals.map((valor, i) => {
              const altura = animate
                ? Math.max(
                    6,
                    Math.round((valor / max) * MAX_BAR_HEIGHT)
                  )
                : 6;

              const [mes, ano] = normalizedColumns[i].split("/");

              return (
                <div
                  key={i}
                  className="flex flex-col items-center justify-end"
                  onMouseEnter={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    setTip({
                      x: rect.left + rect.width / 2,
                      y: rect.top - 10,
                      mes,
                      ano,
                      valor,
                    });
                  }}
                  onMouseMove={(e) =>
                    setTip((prev) =>
                      prev
                        ? { ...prev, x: e.clientX, y: e.clientY - 12 }
                        : prev
                    )
                  }
                  onMouseLeave={() => setTip(null)}
                >
                  {/* Barra */}
                  <div
                    className="w-10 rounded-t-xl bg-sky-400/80 hover:bg-sky-300 transition-all duration-700 ease-out cursor-pointer"
                    style={{ height: `${altura}px` }}
                  />
                </div>
              );
            })}
          </div>

          {/* Labels embaixo, colados na base do card */}
          <div className="mt-2 flex gap-2">
            {normalizedColumns.map((col, i) => {
              const [mes, ano] = col.split("/");
              return (
                <div
                  key={i}
                  className="w-10 text-center leading-tight whitespace-nowrap"
                >
                  <div className="text-[12px] text-slate-300 font-medium">
                    {mes}
                  </div>
                  <div className="text-[10px] text-slate-400 opacity-80">
                    {ano}
                  </div>
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
