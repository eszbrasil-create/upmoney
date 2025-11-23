// src/components/cards/CardDividendosCash.jsx
import React, { useEffect, useMemo, useState } from "react";

const LS_KEY = "cc_carteira_cash_v1";
const MESES = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];

function toNum(x) {
  if (x === "" || x === null || x === undefined) return 0;
  const n = Number(String(x).replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

export default function CardDividendosCash() {
  const [carteiraCash, setCarteiraCash] = useState([]);

  // lê localStorage da Carteira Cash
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      setCarteiraCash(Array.isArray(parsed) ? parsed : []);
    } catch {
      setCarteiraCash([]);
    }
  }, []);

  // soma DY por mês (estilo CarteiraCash)
  const { dyTotaisMes, totalAno } = useMemo(() => {
    const dyMesTotal = Array(12).fill(0);

    carteiraCash.forEach((r) => {
      const arrMeses = Array.isArray(r.dyMeses) ? r.dyMeses : [];
      for (let i = 0; i < 12; i++) {
        dyMesTotal[i] += toNum(arrMeses[i]);
      }
    });

    return {
      dyTotaisMes: dyMesTotal,
      totalAno: dyMesTotal.reduce((a, b) => a + b, 0),
    };
  }, [carteiraCash]);

  const max = Math.max(1, ...dyTotaisMes);

  return (
    <div className="rounded-2xl bg-slate-800/70 border border-white/10 shadow-lg p-4 w-[605px] min-w-[590px] max-w-[605px] h-[360px] overflow-hidden shrink-0">
      <div className="flex items-center justify-between mb-3">
        <span className="text-slate-100 font-semibold text-lg">
          Dividendos (Carteira Cash)
        </span>
        <span className="text-xs px-2 py-1 rounded bg-slate-700/60 text-slate-200">
          Total ano:{" "}
          {totalAno.toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL",
            maximumFractionDigits: 0,
          })}
        </span>
      </div>

      {/* gráfico no estilo do CardEvolucao */}
      <div className="h-[286px] rounded-xl border border-white/10 bg-slate-900/80 p-3 overflow-x-auto overflow-y-hidden">
        {totalAno <= 0 ? (
          <div className="text-[12px] text-slate-500">
            Preencha os DY mensais na Carteira Cash para visualizar o gráfico.
          </div>
        ) : (
          <div className="flex items-end gap-1 min-w-max h-full">
            {dyTotaisMes.map((v, i) => {
              const h = Math.max(4, Math.round((v / max) * 220));
              return (
                <div key={i} className="flex flex-col items-center gap-2 w-10">
                  <div
                    className="w-full rounded-md bg-sky-400/80 transition-all duration-700 ease-out"
                    style={{ height: `${h}px` }}
                    title={v.toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                      maximumFractionDigits: 2,
                    })}
                  />
                  <div className="text-[13px] text-slate-300 text-center leading-tight whitespace-nowrap">
                    {MESES[i]}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
