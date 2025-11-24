// src/components/cards/CardDividendosCash.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
} from "recharts";

const LS_KEY = "cc_carteira_cash_v1";
const MESES = [
  "Jan","Fev","Mar","Abr","Mai","Jun",
  "Jul","Ago","Set","Out","Nov","Dez"
];

function toNum(x) {
  if (x === "" || x === null || x === undefined) return 0;
  const n = Number(String(x).replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

export default function CardDividendosCash() {
  const [carteira, setCarteira] = useState([]);

  // ✅ Leitura segura do localStorage (não quebra SSR/preview)
  useEffect(() => {
    if (typeof window === "undefined") return;

    const readLS = () => {
      try {
        const raw = window.localStorage.getItem(LS_KEY);
        const parsed = raw ? JSON.parse(raw) : [];
        setCarteira(Array.isArray(parsed) ? parsed : []);
      } catch {
        setCarteira([]);
      }
    };

    readLS();

    // ✅ Atualiza se mudar em outra aba/janela
    const onStorage = (e) => {
      if (e.key === LS_KEY) readLS();
    };
    window.addEventListener("storage", onStorage);

    // ✅ Atualiza também na mesma aba (leve, evita wiring agora)
    const iv = setInterval(readLS, 1500);

    return () => {
      window.removeEventListener("storage", onStorage);
      clearInterval(iv);
    };
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

  const hasData = totalAnual > 0;

  return (
    <div className="rounded-2xl bg-slate-800/70 border border-white/10 shadow-lg w-[605px] min-w-[590px] max-w-[605px] h-[360px] p-4 overflow-hidden">
      <div className="flex items-center justify-between mb-3">
        <span className="text-slate-100 font-semibold text-lg">
          Dividendos (Carteira Cash)
        </span>
        <span className="text-xs px-2 py-1 rounded bg-slate-700/60 text-slate-200">
          Ano atual
        </span>
      </div>

      <div className="h-[286px] rounded-xl border border-white/10 bg-slate-900/80 p-3">
        {!hasData ? (
          <div className="h-full flex items-center justify-center text-slate-400 text-sm">
            Preencha os DY mensais na Carteira Cash para ver o gráfico.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
            >
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

              {/* linha de média premium */}
              <ReferenceLine
                y={mediaMensal}
                stroke="rgba(148,163,184,0.6)"
                strokeDasharray="4 4"
              />

              <Bar
                dataKey="dy"
                fill="#38bdf8"
                radius={[8, 8, 2, 2]}
                maxBarSize={36}
                isAnimationActive
                animationDuration={700}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* total anual */}
      <div className="mt-3 flex items-center justify-between text-sm">
        <span className="text-slate-300">Total anual</span>
        <span className="text-slate-100 font-semibold">
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
