// src/components/cards/CardDividendosCash.jsx
import React, { useEffect, useMemo, useState } from "react";

const MESES = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];

// Normaliza "11/26", "nov/26", "Nov-2026", etc
function normalizeMesAno(str) {
  if (!str || !str.includes("/")) return str;

  let [mes, ano] = str.split("/").map(s => s.trim());

  if (/^\d+$/.test(mes)) {
    const idx = Number(mes) - 1;
    if (idx >= 0 && idx < 12) mes = MESES[idx];
  } else {
    mes = mes.charAt(0).toUpperCase() + mes.slice(1,3).toLowerCase();
    if (!MESES.includes(mes)) {
      const found = MESES.find(m => m.toLowerCase() === mes.toLowerCase());
      if (found) mes = found;
    }
  }

  if (/^\d{2}$/.test(ano)) ano = `20${ano}`;
  return `${mes}/${ano}`;
}

// Tooltip simples e premium (copiado 1:1 do Evolução)
function Tooltip({ x, y, mes, ano, valor }) {
  return (
    <div
      className="fixed z-50 pointer-events-none"
      style={{ left: x, top: y }}
    >
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

/**
 * rows esperado no mesmo formato do CashControl:
 * [
 *   { nome: "BCFF11", tipo: "dividendo", valores: [..por mes..] },
 *   { nome: "MXRF11", tipo: "dividendo", valores: [..] },
 *   ...
 * ]
 *
 * Se seus dividendos ficam com outro "tipo",
 * troque o filtro abaixo.
 */
export default function CardDividendosCash({ columns = [], rows = [] }) {
  const normalizedColumns = useMemo(
    () => columns.map(normalizeMesAno),
    [columns]
  );

  // ✅ soma SÓ dividendos por mês
  const totals = useMemo(() => {
    return normalizedColumns.map((_, colIdx) =>
      rows
        .filter(r => (r.tipo || "").toLowerCase() === "dividendo")
        .reduce((acc, r) => acc + (r.valores?.[colIdx] || 0), 0)
    );
  }, [normalizedColumns, rows]);

  const max = Math.max(1, ...totals);

  // ✅ animação
  const [animate, setAnimate] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setAnimate(true), 50);
    return () => clearTimeout(t);
  }, []);

  // ✅ tooltip state
  const [tip, setTip] = useState(null);

  return (
    <div className="rounded-3xl bg-slate-800/70 border border-white/10 shadow-lg p-4 w-[590px] h-[460px] overflow-hidden shrink-0">
      <div className="flex items-center justify-between mb-3">
        <span className="text-slate-100 font-semibold text-lg">Meus Dividendos</span>
        <span className="text-xs px-2 py-1 rounded-lg bg-slate-700/60 text-slate-200">
          Mensal
        </span>
      </div>

      <div className="h-[380px] rounded-2xl border border-white/10 bg-slate-900/80 p-3 overflow-x-auto overflow-y-hidden">
        <div className="flex items-end gap-1 min-w-max">
          {totals.map((valor, i) => {
            const alturaReal = Math.max(4, Math.round((valor / max) * 300));
            const altura = animate ? alturaReal : 4;

            const [mes, ano] = normalizedColumns[i].split("/");

            return (
              <div key={i} className="flex flex-col items-center gap-2 w-10">
                {/* Barra com animação */}
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

                {/* Labels */}
                <div
                  className="text-[13px] text-slate-200 text-center leading-tight whitespace-nowrap font-medium"
                  style={{ textShadow: "0 1px 6px rgba(0,0,0,0.6)" }}
                >
                  {mes}
                  <br />
                  <span
                    className="text-[12px] opacity-70 font-normal text-slate-300"
                    style={{ textShadow: "0 1px 6px rgba(0,0,0,0.6)" }}
                  >
                    {ano}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tooltip render */}
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
