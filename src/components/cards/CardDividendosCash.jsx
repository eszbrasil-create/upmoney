// src/components/cards/CardDividendosCash.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  CartesianGrid,
} from "recharts";

const LS_KEY = "cc_carteira_cash_v1";
const MESES = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];

function toNum(x) {
  if (x === "" || x === null || x === undefined) return 0;
  const n = Number(String(x).replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

export default function CardDividendosCash() {
  const [carteira, setCarteira] = useState([]);

  // lê do localStorage no client
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      setCarteira(Array.isArray(parsed) ? parsed : []);
    } catch {
      setCarteira([]);
    }
  }, []);

  const { data, totalAnual, mediaMensal } = useMemo(() => {
    const dyMesTotal = Array(12).fill(0);

    carteira.forEach((r) => {
      const arrMeses = Array.isArray(r.dyMeses) ? r.dyMeses : [];
      for (let i = 0; i < 12; i++) {
        dyMesTotal[i] += toNum(arrMeses[i]);
      }
    });

    const data = MESES.map((m, i) => ({
      name: m,
      dy: dyMesTotal[i],
    }));

    const totalAnual = dyMesTotal.reduce((a, b) => a + b, 0);
    const mediaMensal = totalAnual / 12;

    return { data, totalAnual, mediaMensal };
  }, [carteira]);

  const hasData = totalAnual > 0;

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    const v = payload[0].value || 0;
    return (
      <div className="rounded-md bg-slate-950/95 border border-white/10 px-2 py-1 text-xs text-slate-100 shadow-lg">
        <div className="font-semibold">{label}</div>
        <div>
          {v.toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL",
            maximumFractionDigits: 2,
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="rounded-3xl bg-slate-800/70 border border-white/10 shadow-lg w-[605px] min-w-[590px] max-w-[605px] h-[360px] p-4 overflow-hidden">
      {/* Header igual padrão premium */}
      <div className="flex items-center justify-between mb-3">
        <div className="text-slate-100 font-semibold text-lg">
          Dividendos (Carteira Cash)
        </div>
        <div className="text-[11px] text-slate-400">
          Evolução mensal
        </div>
      </div>

      {/* Área do gráfico no estilo CardEvolucao */}
      <div className="relative h-[286px] rounded-2xl border border-white/10 bg-slate-900/40 overflow-hidden">
        {!hasData ? (
          <div className="h-full flex items-center justify-center text-slate-400 text-sm">
            Preencha os DY mensais na Carteira Cash para ver a evolução.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 12, right: 12, left: 0, bottom: 0 }}
            >
              {/* grid sutil premium */}
              <CartesianGrid
                vertical={false}
                stroke="rgba(148,163,184,0.12)"
                strokeDasharray="3 3"
              />

              <XAxis
                dataKey="name"
                tick={{ fontSize: 12, fill: "#cbd5f5" }}
                axisLine={false}
                tickLine={false}
              />

              <YAxis
                tick={{ fontSize: 11, fill: "#cbd5f5" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) =>
                  v.toLocaleString("pt-BR", { maximumFractionDigits: 0 })
                }
              />

              <Tooltip content={<CustomTooltip />} />

              {/* linha média mensal */}
              <ReferenceLine
                y={mediaMensal}
                stroke="rgba(148,163,184,0.7)"
                strokeDasharray="4 4"
              />

              {/* gradiente do preenchimento */}
              <defs>
                <linearGradient id="dyGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#38bdf8" stopOpacity={0.55} />
                  <stop offset="100%" stopColor="#38bdf8" stopOpacity={0.05} />
                </linearGradient>
              </defs>

              {/* linha + área */}
              <Area
                type="monotone"
                dataKey="dy"
                stroke="#38bdf8"
                strokeWidth={2.5}
                fill="url(#dyGrad)"
                dot={false}
                activeDot={{ r: 4 }}
                isAnimationActive
                animationDuration={700}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* rodapé igual estilo do dash */}
      <div className="mt-3 flex items-center justify-between text-sm">
        <span className="text-slate-300">Total anual</span>
        <span className="text-slate-100 font-semibold tabular-nums">
          {totalAnual.toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL",
            maximumFractionDigits: 2,
          })}
        </span>
      </div>
    </div>
  );
}
