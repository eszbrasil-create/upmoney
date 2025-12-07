// src/components/cards/CardEvolucao.jsx
import React, { useEffect, useMemo, useState } from "react";

const MESES = [
  "Jan","Fev","Mar","Abr","Mai","Jun",
  "Jul","Ago","Set","Out","Nov","Dez"
];

// Normaliza "11/26", "nov/26", "Nov-2026" etc para "Nov/2026"
function normalizeMesAno(str) {
  if (!str || !str.includes("/")) return str;

  let [mes, ano] = str.split("/").map((s) => s.trim());

  // mês numérico → abreviação
  if (/^\d+$/.test(mes)) {
    const idx = Number(mes) - 1;
    if (idx >= 0 && idx < 12) mes = MESES[idx];
  } else {
    mes = mes.charAt(0).toUpperCase() + mes.slice(1, 3).toLowerCase();
    const found = MESES.find((m) => m.toLowerCase() === mes.toLowerCase());
    if (found) mes = found;
  }

  // ano 2 dígitos → 4 dígitos
  if (/^\d{2}$/.test(ano)) ano = `20${ano}`;

  return `${mes}/${ano}`;
}

// Tooltip
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
  // Meses normalizados
  const normalizedColumns = useMemo(
    () => columns.map(normalizeMesAno),
    [columns]
  );

  // Total por mês
  const totals = useMemo(() => {
    return normalizedColumns.map((_, colIdx) =>
      rows.reduce((acc, r) => acc + (r.valores?.[colIdx] || 0), 0)
    );
  }, [normalizedColumns, rows]);

  const max = Math.max(1, ...totals);

  // Animação
  const [animate, setAnimate] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setAnimate(true), 80);
    return () => clearTimeout(t);
  }, []);

  // Tooltip
  const [tip, setTip] = useState(null);

  return (
    <div className="rounded-3xl bg-slate-800/70 border border-white/10 shadow-lg p-4 w-[590px] flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center mb-2">
        <span className="text-slate-100 font-semibold text-lg">Evolução</span>
        <span className="text-xs px-2 py-1 rounded-lg bg-slate-700/60 text-slate-300">
          Mensal
        </span>
      </div>

      {/*
        Área do gráfico:
        - mantém a mesma altura do card que você já tinha (min-h)
        - flex + items-end para colar as barras na parte de baixo
      */}
      <div className="flex-1 min-h-[345px] rounded-2xl border border-white/10 bg-slate-900/80 px-3 pt-3 pb-2 overflow-x-auto overflow-y-hidden flex items-end">
        <div className="flex items-end gap-1 min-w-max h-full w-full">
          {totals.map((valor, i) => {
            const proporcao = max > 0 ? valor / max : 0;
            // altura em % da área disponível (a maior barra chega perto de 100%)
            const alturaPct = animate ? Math.max(proporcao * 100, 3) : 2;

            const [mes, ano] = normalizedColumns[i].split("/");

            return (
              <div
                key={i}
                className="flex flex-col items-center w-10 h-full"
              >
                {/* Zona da barra ocupa todo o espaço acima do texto */}
                <div className="w-full flex-1 flex items-end">
                  <div
                    className="w-full rounded-xl bg-sky-400/80 hover:bg-sky-300 transition-all duration-700 ease-out cursor-pointer"
                    style={{ height: `${alturaPct}%` }}
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
                    onMouseMove={(e) => {
                      setTip((prev) =>
                        prev ? { ...prev, x: e.clientX, y: e.clientY - 12 } : prev
                      );
                    }}
                    onMouseLeave={() => setTip(null)}
                  />
                </div>

                {/* Labels embaixo, fora da área da barra */}
                <div className="mt-1 text-[12px] text-slate-300 text-center leading-tight whitespace-nowrap">
                  {mes}
                  <br />
                  <span className="text-[11px] opacity-70">{ano}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {tip && <Tooltip {...tip} />}
    </div>
  );
}
