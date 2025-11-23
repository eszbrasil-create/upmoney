// src/components/cards/CardDividendosCash.jsx
import React, { useMemo, useState } from "react";

const LS_KEY = "cc_carteira_cash_v1";
const MESES = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];

function toNum(x){
  if (x === "" || x == null) return 0;
  const n = Number(String(x).replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

export default function CardDividendosCash() {
  // lê carteira do localStorage
  const carteira = useMemo(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }, []);

  // soma DY por mês
  const { dyMesTotal, totalAnual, maxDy } = useMemo(() => {
    const dyTot = Array(12).fill(0);

    carteira.forEach((r) => {
      const arr = Array.isArray(r?.dyMeses)
        ? [...r.dyMeses, ...Array(12 - r.dyMeses.length).fill("")].slice(0,12)
        : Array(12).fill("");

      for (let i = 0; i < 12; i++) {
        dyTot[i] += toNum(arr[i]);
      }
    });

    const total = dyTot.reduce((a,b)=>a+b,0);
    const max = Math.max(1, ...dyTot);

    return { dyMesTotal: dyTot, totalAnual: total, maxDy: max };
  }, [carteira]);

  // tooltip simples
  const [hoverIdx, setHoverIdx] = useState(null);

  const anoAtual = new Date().getFullYear();

  return (
    <div className="rounded-2xl bg-slate-800/70 border border-white/10 shadow-lg w-[605px] min-w-[590px] max-w-[605px] h-[360px] p-4 overflow-hidden">
      <div className="flex items-center justify-between mb-3">
        <span className="text-slate-100 font-semibold text-lg">
          Dividendos (Carteira Cash)
        </span>
        <span className="text-xs px-2 py-1 rounded bg-slate-700/60 text-slate-200">
          {anoAtual}
        </span>
      </div>

      {/* Topo com total anual */}
      <div className="mb-3 rounded-xl bg-slate-900/50 border border-white/10 px-3 py-2 flex items-center justify-between">
        <span className="text-slate-300 text-sm">Total no ano</span>
        <span className="text-slate-100 font-semibold">
          {totalAnual.toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL",
            maximumFractionDigits: 2,
          })}
        </span>
      </div>

      {/* Área do gráfico — estilo igual CardEvolução */}
      <div className="h-[240px] rounded-xl border border-white/10 bg-slate-900/80 p-3 overflow-x-auto overflow-y-hidden relative">
        <div className="flex items-end gap-2 min-w-max h-full">
          {dyMesTotal.map((v, i) => {
            const h = Math.max(4, Math.round((v / maxDy) * 170));

            return (
              <div
                key={i}
                className="flex flex-col items-center gap-2 w-10 relative"
                onMouseEnter={() => setHoverIdx(i)}
                onMouseLeave={() => setHoverIdx(null)}
              >
                {/* barra */}
                <div
                  className="w-full rounded-xl bg-sky-400/90 transition-all duration-700 ease-out"
                  style={{ height: `${h}px` }}
                  title={v.toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  })}
                />

                {/* label mês/ano igual Evolução */}
                <div className="text-[13px] text-slate-300 text-center leading-tight whitespace-nowrap">
                  {MESES[i]}
                  <br />
                  <span className="text-[12px] opacity-60">{anoAtual}</span>
                </div>

                {/* tooltip custom */}
                {hoverIdx === i && (
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 -translate-y-full z-20 rounded-md bg-slate-950/95 border border-white/10 px-2 py-1 text-[11px] text-slate-100 shadow-lg whitespace-nowrap">
                    {MESES[i]}:{" "}
                    {v.toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                      maximumFractionDigits: 2,
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-2 text-[11px] text-slate-400">
        Soma automática dos DYs registrados na Carteira Cash.
      </div>
    </div>
  );
}
