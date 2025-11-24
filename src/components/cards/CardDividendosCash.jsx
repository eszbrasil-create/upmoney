// src/components/cards/CardDividendosCash.jsx
import React, { useEffect, useMemo, useState } from "react";

const MESES = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
const LS_KEY_CARTEIRA = "cc_carteira_cash_v1";

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

function toNum(x) {
  if (x === "" || x === null || x === undefined) return 0;
  const n = Number(String(x).replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

export default function CardDividendosCash({ columns = [] }) {
  const normalizedColumns = useMemo(
    () => columns.map(normalizeMesAno),
    [columns]
  );

  // ordena Jan->Dez dentro de cada ano
  const sortedColumns = useMemo(() => {
    const cols = [...normalizedColumns];
    cols.sort((a, b) => {
      const [ma, ya] = a.split("/");
      const [mb, yb] = b.split("/");

      const yearA = parseInt(ya, 10) || 0;
      const yearB = parseInt(yb, 10) || 0;

      const idxA = MESES.indexOf(ma);
      const idxB = MESES.indexOf(mb);

      if (yearA !== yearB) return yearA - yearB;
      return idxA - idxB;
    });
    return cols;
  }, [normalizedColumns]);

  const carteira = useMemo(() => {
    try {
      const raw = localStorage.getItem(LS_KEY_CARTEIRA);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }, []);

  const totals = useMemo(() => {
    if (!sortedColumns.length) return [];
    return sortedColumns.map((col) => {
      const [mesStr] = col.split("/");
      const idxMes = MESES.indexOf(mesStr);
      if (idxMes < 0) return 0;

      return carteira.reduce((acc, r) => {
        const arr = Array.isArray(r.dyMeses) ? r.dyMeses : [];
        return acc + toNum(arr[idxMes]);
      }, 0);
    });
  }, [sortedColumns, carteira]);

  const max = Math.max(1, ...totals);

  const [animate, setAnimate] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setAnimate(true), 50);
    return () => clearTimeout(t);
  }, []);

  const [tip, setTip] = useState(null);

  // altura-base das barras (menor pra acompanhar cards mais baixos)
  const BAR_MAX_HEIGHT = 260;

  return (
    // ✅ agora o card é flex e a altura pode ser a que você quiser no layout
    <div className="rounded-3xl bg-slate-800/70 border border-white/10 shadow-lg p-4 w-[590px] h-[380px] overflow-hidden shrink-0 flex flex-col">
      {/* header fixo */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-slate-100 font-semibold text-lg">
          Meus Dividendos
        </span>
        <span className="text-xs px-2 py-1 rounded-lg bg-slate-700/60 text-slate-200">
          Mensal
        </span>
      </div>

      {/* ✅ área interna agora ocupa o restante do card automaticamente */}
      <div className="flex-1 min-h-0 rounded-2xl border border-white/10 bg-slate-900/80 p-3 overflow-x-auto overflow-y-hidden">
        <div className="flex items-end gap-1 min-w-max h-full">
          {totals.map((valor, i) => {
            const alturaReal = Math.max(
              4,
              Math.round((valor / max) * BAR_MAX_HEIGHT)
            );
            const altura = animate ? alturaReal : 4;

            const [mes, ano] = sortedColumns[i].split("/");

            return (
              <div key={i} className="flex flex-col items-center gap-2 w-10">
                <div
                  className="w-full rounded-xl bg-emerald-400/80 hover:bg-emerald-300 transition-all duration-700 ease-out"
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
