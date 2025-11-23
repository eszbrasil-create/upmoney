// src/pages/CarteiraCash.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from "recharts";

/* ---------------------------
   Paleta premium UpMoney
---------------------------- */
const COLORS = {
  bg: "#0b1220",           // fundo premium
  surface: "rgba(15,23,42,0.7)",
  surface2: "rgba(2,6,23,0.8)",
  border: "rgba(255,255,255,0.08)",
  text: "#e2e8f0",
  subtext: "rgba(226,232,240,0.7)",
  gold: "#d6af5f",
  emerald: "#22c55e",
  sky: "#38bdf8",
  amber: "#f59e0b",
};

const PIE_COLORS = {
  RF: COLORS.emerald,
  ACOES: COLORS.sky,
  FII: COLORS.amber,
};

const BAR_COLOR = COLORS.emerald;
const MESES = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];

/* ---------------------------
   Carteira base
---------------------------- */
const BASE_ROWS = [
  { id: 1, tipo: "ACOES", ticker: "VALE3", nome: "Vale", dataEntrada: "", qtd: "", entrada: "", valorAtual: "", dy: "", dyMeses: Array(12).fill("") },
  { id: 2, tipo: "ACOES", ticker: "ITUB4", nome: "Itaú Unibanco", dataEntrada: "", qtd: "", entrada: "", valorAtual: "", dy: "", dyMeses: Array(12).fill("") },
  { id: 3, tipo: "ACOES", ticker: "GGBR4", nome: "Gerdau", dataEntrada: "", qtd: "", entrada: "", valorAtual: "", dy: "", dyMeses: Array(12).fill("") },
  { id: 4, tipo: "ACOES", ticker: "AXIA6", nome: "AXIA6", dataEntrada: "", qtd: "", entrada: "", valorAtual: "", dy: "", dyMeses: Array(12).fill("") },
  { id: 5, tipo: "ACOES", ticker: "DIRR3", nome: "Direcional", dataEntrada: "", qtd: "", entrada: "", valorAtual: "", dy: "", dyMeses: Array(12).fill("") },
  { id: 6, tipo: "ACOES", ticker: "CYRE3", nome: "Cyrela", dataEntrada: "", qtd: "", entrada: "", valorAtual: "", dy: "", dyMeses: Array(12).fill("") },
  { id: 7, tipo: "ACOES", ticker: "PETR4", nome: "Petrobras PN", dataEntrada: "", qtd: "", entrada: "", valorAtual: "", dy: "", dyMeses: Array(12).fill("") },
  { id: 8, tipo: "ACOES", ticker: "SLCE3", nome: "SLC Agrícola", dataEntrada: "", qtd: "", entrada: "", valorAtual: "", dy: "", dyMeses: Array(12).fill("") },
  { id: 9, tipo: "ACOES", ticker: "VIVT3", nome: "Vivo (Telefônica)", dataEntrada: "", qtd: "", entrada: "", valorAtual: "", dy: "", dyMeses: Array(12).fill("") },

  { id: 10, tipo: "RF", ticker: "SELIC", nome: "Selic Simples", dataEntrada: "", qtd: "", entrada: "1", valorAtual: "", dy: "", dyMeses: Array(12).fill("") },
  { id: 11, tipo: "RF", ticker: "IPCA35", nome: "Tesouro IPCA+ 2035", dataEntrada: "", qtd: "", entrada: "1", valorAtual: "", dy: "", dyMeses: Array(12).fill("") },

  { id: 12, tipo: "FII", ticker: "HGLG11", nome: "CSHG Logística", dataEntrada: "", qtd: "", entrada: "", valorAtual: "", dy: "", dyMeses: Array(12).fill("") },
  { id: 13, tipo: "FII", ticker: "KNCR11", nome: "Kinea Rendimentos", dataEntrada: "", qtd: "", entrada: "", valorAtual: "", dy: "", dyMeses: Array(12).fill("") },
];

const LS_KEY = "cc_carteira_cash_v2";

/* ---------------------------
   Helpers numéricos BR
---------------------------- */
function toNum(x) {
  if (x === "" || x === null || x === undefined) return 0;
  const n = Number(String(x).replace(/\./g, "").replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

function fmtBR(n, digits = 2) {
  return Number(n || 0).toLocaleString("pt-BR", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

/* ---------------------------
   Tooltip barra premium
---------------------------- */
const BarTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const v = payload[0]?.value || 0;

  return (
    <div className="rounded-md bg-slate-900/95 border border-slate-700 px-2 py-1 text-xs text-slate-100 shadow-lg">
      <div className="font-semibold">{label}</div>
      <div>
        {Number(v).toLocaleString("pt-BR", {
          style: "currency",
          currency: "BRL",
        })}
      </div>
    </div>
  );
};

export default function CarteiraCash() {
  const [carteira, setCarteira] = useState(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      const parsed = raw ? JSON.parse(raw) : BASE_ROWS;
      return parsed.map((r) => ({
        ...r,
        dataEntrada: r.dataEntrada ?? "",
        dyMeses: Array.isArray(r.dyMeses)
          ? [...r.dyMeses, ...Array(12 - r.dyMeses.length).fill("")].slice(0, 12)
          : Array(12).fill(""),
      }));
    } catch {
      return BASE_ROWS;
    }
  });

  const [activeReport, setActiveReport] = useState(null);

  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(carteira));
    } catch {}
  }, [carteira]);

  const updateRow = (id, patch) => {
    setCarteira((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };

  const resetModelo = () => {
    setCarteira(BASE_ROWS);
    localStorage.removeItem(LS_KEY);
  };

  /* ---------------------------
     Cálculos globais
  ---------------------------- */
  const {
    distAtual,
    totalGeral,
    pieData,
    dyBarData,
    totalDyMensal,
    mediaDyMensal,
  } = useMemo(() => {
    const somaPorTipo = { RF: 0, ACOES: 0, FII: 0 };
    let total = 0;
    const dyMesTotal = Array(12).fill(0);

    carteira.forEach((r) => {
      const qtd = toNum(r.qtd);
      const entrada = toNum(r.entrada);
      const valorAtual = toNum(r.valorAtual) || entrada;
      const valorPosicao = qtd * valorAtual;

      somaPorTipo[r.tipo] = (somaPorTipo[r.tipo] || 0) + valorPosicao;
      total += valorPosicao;

      const arrMeses = Array.isArray(r.dyMeses) ? r.dyMeses : [];
      for (let i = 0; i < 12; i++) dyMesTotal[i] += toNum(arrMeses[i]);
    });

    const dist =
      total > 0
        ? {
            RF: (somaPorTipo.RF / total) * 100 || 0,
            ACOES: (somaPorTipo.ACOES / total) * 100 || 0,
            FII: (somaPorTipo.FII / total) * 100 || 0,
          }
        : { RF: 0, ACOES: 0, FII: 0 };

    const pieData = [
      { key: "RF", name: "RF", value: somaPorTipo.RF },
      { key: "ACOES", name: "Ações", value: somaPorTipo.ACOES },
      { key: "FII", name: "FIIs", value: somaPorTipo.FII },
    ].filter((d) => d.value > 0);

    const dyBarData = MESES.map((m, idx) => ({
      name: m,
      dy: dyMesTotal[idx],
    }));

    const totalDyMensal = dyMesTotal.reduce((a, b) => a + b, 0);
    const mediaDyMensal = totalDyMensal / 12;

    return {
      distAtual: dist,
      totalGeral: total,
      pieData,
      dyBarData,
      totalDyMensal,
      mediaDyMensal,
    };
  }, [carteira]);

  /* ---------------------------
     Exportação CSV / JSON
  ---------------------------- */
  const exportCSV = (tipo) => {
    const rows = carteira.filter((r) => r.tipo === tipo);
    const header = [
      "ticker","nome","tipo","qtd","entrada","valorAtual",
      ...MESES.map((m)=>`dy_${m}`)
    ];
    const lines = [header.join(";")];

    rows.forEach((r) => {
      const line = [
        r.ticker, r.nome, r.tipo,
        r.qtd, r.entrada, r.valorAtual,
        ...(r.dyMeses || [])
      ]
        .map((x) => `"${String(x ?? "").replace(/"/g, '""')}"`)
        .join(";");
      lines.push(line);
    });

    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `carteira_${tipo.toLowerCase()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(carteira, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `carteira_modelo.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  /* ---------------------------
     Tooltip pizza premium
  ---------------------------- */
  const PieTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const { name, value } = payload[0];
    const perc = totalGeral > 0 ? ((value / totalGeral) * 100).toFixed(1) : "0.0";

    return (
      <div className="rounded-md bg-slate-900/95 border border-slate-700 px-2 py-1 text-xs text-slate-100 shadow-lg">
        <div className="font-semibold">{name}</div>
        <div>
          {Number(value).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}{" "}
          <span className="text-slate-400">({perc}%)</span>
        </div>
      </div>
    );
  };

  return (
    <div className="pt-0 pr-3 pl-0 relative">
      {/* ---------------------------
          BLOCO FIXO TOPO (reduzido)
      ---------------------------- */}
      <div className="mb-2">
        {/* Desktop: fixed / Mobile: sticky */}
        <div className="md:fixed md:left-48 md:right-6 md:top-3 sticky top-2 z-30 px-1">
          <div className="rounded-2xl bg-gradient-to-r from-emerald-500 via-sky-500 to-fuchsia-500 p-[1px] shadow-lg">
            <div className="rounded-2xl bg-slate-950/95 px-2 py-2">
              <div className="grid gap-2 md:grid-cols-3">
                {/* Carteira Dividendos */}
                <div className="rounded-xl bg-emerald-500/10 border border-emerald-400/30 px-3 py-1.5 flex items-center justify-between">
                  <div className="min-w-0">
                    <h2 className="text-emerald-200 text-xs font-semibold truncate">
                      Carteira Dividendos
                    </h2>
                    <p className="text-slate-200/80 text-[10px] leading-snug truncate">
                      Renda recorrente via dividendos.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => exportCSV("ACOES")}
                    className="ml-2 inline-flex items-center justify-center rounded-lg bg-emerald-300 text-slate-950 text-[10px] font-bold px-2 py-1 hover:bg-emerald-200 transition whitespace-nowrap"
                  >
                    Baixar
                  </button>
                </div>

                {/* Carteira FIIs */}
                <div className="rounded-xl bg-amber-500/10 border border-amber-400/30 px-3 py-1.5 flex items-center justify-between">
                  <div className="min-w-0">
                    <h2 className="text-amber-200 text-xs font-semibold truncate">
                      Carteira FIIs
                    </h2>
                    <p className="text-slate-200/80 text-[10px] leading-snug truncate">
                      Renda mensal em imóveis.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => exportCSV("FII")}
                    className="ml-2 inline-flex items-center justify-center rounded-lg bg-amber-300 text-slate-950 text-[10px] font-bold px-2 py-1 hover:bg-amber-200 transition whitespace-nowrap"
                  >
                    Baixar
                  </button>
                </div>

                {/* Carteira Cripto */}
                <div className="rounded-xl bg-sky-500/10 border border-sky-400/30 px-3 py-1.5 flex items-center justify-between">
                  <div className="min-w-0">
                    <h2 className="text-sky-200 text-xs font-semibold truncate">
                      Carteira Cripto
                    </h2>
                    <p className="text-slate-200/80 text-[10px] leading-snug truncate">
                      Exposição longa em cripto.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => exportCSV("RF")} // placeholder: use RF p/ cripto quando criar tipo
                    className="ml-2 inline-flex items-center justify-center rounded-lg bg-sky-300 text-slate-950 text-[10px] font-bold px-2 py-1 hover:bg-sky-200 transition whitespace-nowrap"
                  >
                    Baixar
                  </button>
                </div>
              </div>

              {/* Ações rápidas (muito compactas) */}
              <div className="mt-2 flex items-center gap-2 justify-end">
                <button
                  onClick={exportJSON}
                  className="rounded-lg bg-white/5 hover:bg-white/10 text-[10px] text-slate-200 px-2 py-1 border border-white/10 transition"
                >
                  Exportar JSON
                </button>
                <button
                  onClick={resetModelo}
                  className="rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-[10px] text-rose-200 px-2 py-1 border border-rose-400/20 transition"
                >
                  Reset modelo
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* altura reservada menor */}
        <div className="md:h-24 h-32" />
      </div>

      {/* ---------------------------
          CARD GRÁFICOS
      ---------------------------- */}
      <div className="rounded-xl bg-slate-800/70 border border-white/10 shadow-lg p-4 mb-4">
        {totalGeral <= 0 ? (
          <p className="text-[11px] text-slate-500">
            Preencha <strong>Quantidade</strong>, <strong>Entrada</strong>,{" "}
            <strong>Valor atual</strong> e os <strong>DY por mês</strong> na
            tabela para visualizar os gráficos.
          </p>
        ) : (
          <div className="grid gap-4 md:grid-cols-3 items-stretch">
            {/* Pizza */}
            <div className="md:col-span-1 h-48">
              <div className="h-full rounded-lg bg-slate-900/70 border border-slate-700/70 px-2 py-1">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={60}
                      innerRadius={30}
                      paddingAngle={3}
                      isAnimationActive
                      animationDuration={700}
                    >
                      {pieData.map((entry) => (
                        <Cell key={entry.key} fill={PIE_COLORS[entry.key] || "#64748b"} />
                      ))}
                    </Pie>
                    <Tooltip content={<PieTooltip />} />
                    <Legend
                      verticalAlign="bottom"
                      height={24}
                      formatter={(value) => (
                        <span className="text-[11px] text-slate-200">{value}</span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Barras */}
            <div className="md:col-span-2 h-48">
              <div className="h-full rounded-lg bg-slate-900/70 border border-slate-700/70 px-2 py-1">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dyBarData}>
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#cbd5f5" }} />
                    <YAxis
                      tick={{ fontSize: 10, fill: "#cbd5f5" }}
                      tickFormatter={(v) =>
                        Number(v).toLocaleString("pt-BR", { maximumFractionDigits: 0 })
                      }
                    />

                    {/* média */}
                    <ReferenceLine
                      y={mediaDyMensal}
                      stroke={COLORS.gold}
                      strokeDasharray="4 4"
                      strokeOpacity={0.9}
                      label={{
                        value: "Média",
                        position: "right",
                        fill: COLORS.gold,
                        fontSize: 10,
                      }}
                    />

                    <Tooltip content={<BarTooltip />} />
                    <Bar
                      dataKey="dy"
                      radius={[6, 6, 0, 0]}
                      fill={BAR_COLOR}
                      isAnimationActive
                      animationDuration={800}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ---------------------------
          TABELA ATIVOS
      ---------------------------- */}
      <div className="rounded-xl bg-slate-800/70 border border-white/10 shadow-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-slate-200 text-sm font-medium">
            Detalhamento da carteira modelo
          </h2>
          <span className="text-[11px] text-slate-400">
            Edite tipo, setor, data de entrada, quantidade, entrada, valor atual e DYs.
          </span>
        </div>

        <div className="rounded-xl border border-white/10 bg-slate-900/40 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-[2000px] w-full text-sm">
              <thead className="bg-slate-800/70 text-slate-300">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium sticky left-0 bg-slate-800/70 z-20">#</th>
                  <th className="px-3 py-2 text-left text-xs font-medium sticky left-[2.5rem] bg-slate-800/70 z-20">Ticker</th>
                  <th className="px-3 py-2 text-left text-xs font-medium">Relatório</th>
                  <th className="px-3 py-2 text-left text-xs font-medium">Tipo</th>
                  <th className="px-3 py-2 text-left text-xs font-medium w-32">Setor</th>
                  <th className="px-3 py-2 text-left text-xs font-medium">Data entrada</th>
                  <th className="px-3 py-2 text-right text-xs font-medium">Quantidade</th>
                  <th className="px-3 py-2 text-right text-xs font-medium">Entrada (R$)</th>
                  <th className="px-3 py-2 text-right text-xs font-medium">Valor atual (R$)</th>
                  <th className="px-3 py-2 text-right text-xs font-medium">Posição (R$)</th>
                  <th className="px-3 py-2 text-right text-xs font-medium">% Var</th>
                  <th className="px-3 py-2 text-right text-xs font-medium">Part. %</th>
                  <th className="px-3 py-2 text-right text-xs font-medium">DY (12m)</th>
                  {MESES.map((m) => (
                    <th key={m} className="px-3 py-2 text-right text-xs font-medium">
                      DY {m}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {carteira.map((r, i) => {
                  const qtdNum = toNum(r.qtd);
                  const entradaNum = toNum(r.entrada);
                  const valorAtualNum = toNum(r.valorAtual) || entradaNum;
                  const valorPosicao = qtdNum * valorAtualNum;

                  const partAtual =
                    totalGeral > 0 ? (valorPosicao / totalGeral) * 100 : 0;

                  let varPerc = 0;
                  let hasVar = false;
                  if (entradaNum > 0 && valorAtualNum > 0) {
                    varPerc = (valorAtualNum / entradaNum - 1) * 100;
                    hasVar = true;
                  }
                  const varClass =
                    !hasVar
                      ? "text-slate-400"
                      : varPerc >= 0
                      ? "text-emerald-300 font-semibold"
                      : "text-rose-300 font-semibold";

                  const dyMeses = Array.isArray(r.dyMeses)
                    ? [...r.dyMeses, ...Array(12 - r.dyMeses.length).fill("")].slice(0, 12)
                    : Array(12).fill("");

                  const dy12mValor = dyMeses.reduce((acc, v) => acc + toNum(v), 0);

                  return (
                    <tr key={r.id} className="border-t border-white/5 hover:bg-slate-800/30">
                      <td className="px-3 py-2 text-slate-500 text-xs sticky left-0 bg-slate-900/90 z-10">
                        {i + 1}
                      </td>

                      <td className="px-3 py-2 text-left sticky left-[2.5rem] bg-slate-900/90 z-10">
                        <input
                          className="w-full bg-transparent outline-none text-slate-100 placeholder:text-slate-600 text-sm"
                          value={r.ticker ?? ""}
                          onChange={(e) =>
                            updateRow(r.id, { ticker: e.target.value.toUpperCase() })
                          }
                        />
                      </td>

                      <td className="px-3 py-2">
                        <button
                          className="px-3 py-1.5 rounded-lg border border-white/10 bg-slate-800 text-slate-100 text-xs hover:bg-slate-700"
                          type="button"
                          onClick={() => setActiveReport(r)}
                        >
                          Ver
                        </button>
                      </td>

                      <td className="px-3 py-2">
                        <select
                          className="bg-slate-900 border border-slate-700 rounded-md px-2 py-1 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-sky-500"
                          value={r.tipo}
                          onChange={(e) => updateRow(r.id, { tipo: e.target.value })}
                        >
                          <option value="RF">RF</option>
                          <option value="ACOES">Ações</option>
                          <option value="FII">FII</option>
                        </select>
                      </td>

                      <td className="px-3 py-2 text-slate-200 w-32 truncate">
                        <input
                          className="w-full bg-transparent outline-none text-slate-100 placeholder:text-slate-600 text-sm"
                          value={r.nome ?? ""}
                          onChange={(e) => updateRow(r.id, { nome: e.target.value })}
                          placeholder="Setor"
                        />
                      </td>

                      <td className="px-3 py-2 text-left">
                        <input
                          type="date"
                          className="bg-slate-900 border border-slate-700 rounded-md px-2 py-1 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-sky-500"
                          value={r.dataEntrada ?? ""}
                          onChange={(e) => updateRow(r.id, { dataEntrada: e.target.value })}
                        />
                      </td>

                      <td className="px-3 py-2 text-right">
                        <input
                          className="w-full bg-transparent text-right outline-none text-slate-100 placeholder:text-slate-600 text-sm tabular-nums"
                          inputMode="decimal"
                          placeholder="0"
                          value={r.qtd ?? ""}
                          onChange={(e) => updateRow(r.id, { qtd: e.target.value })}
                          onBlur={(e) => {
                            const n = toNum(e.target.value);
                            updateRow(r.id, { qtd: n === 0 ? "" : fmtBR(n, 0) });
                          }}
                        />
                      </td>

                      <td className="px-3 py-2 text-right">
                        <input
                          className="w-full bg-transparent text-right outline-none text-slate-100 placeholder:text-slate-600 text-sm tabular-nums"
                          inputMode="decimal"
                          placeholder="0,00"
                          value={r.entrada ?? ""}
                          onChange={(e) => updateRow(r.id, { entrada: e.target.value })}
                          onBlur={(e) => {
                            const n = toNum(e.target.value);
                            updateRow(r.id, { entrada: n === 0 ? "" : fmtBR(n) });
                          }}
                        />
                      </td>

                      <td className="px-3 py-2 text-right">
                        <input
                          className="w-full bg-transparent text-right outline-none text-slate-100 placeholder:text-slate-600 text-sm tabular-nums"
                          inputMode="decimal"
                          placeholder="0,00"
                          value={r.valorAtual ?? ""}
                          onChange={(e) => updateRow(r.id, { valorAtual: e.target.value })}
                          onBlur={(e) => {
                            const n = toNum(e.target.value);
                            updateRow(r.id, { valorAtual: n === 0 ? "" : fmtBR(n) });
                          }}
                        />
                      </td>

                      <td className="px-3 py-2 text-right text-slate-200 tabular-nums">
                        {valorPosicao > 0
                          ? valorPosicao.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
                          : "—"}
                      </td>

                      <td className={`px-3 py-2 text-right ${varClass} tabular-nums`}>
                        {hasVar ? `${varPerc.toFixed(2)}%` : "—"}
                      </td>

                      <td className="px-3 py-2 text-right text-slate-200 tabular-nums">
                        {totalGeral > 0 && valorPosicao > 0
                          ? `${partAtual.toFixed(2)}%`
                          : "—"}
                      </td>

                      <td className="px-3 py-2 text-right text-slate-200 font-semibold tabular-nums">
                        {dy12mValor > 0
                          ? dy12mValor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
                          : "—"}
                      </td>

                      {MESES.map((_, idx) => (
                        <td key={idx} className="px-3 py-2 text-right">
                          <input
                            className="w-full bg-transparent text-right outline-none text-slate-100 placeholder:text-slate-600 text-sm tabular-nums"
                            inputMode="decimal"
                            placeholder="0,00"
                            value={dyMeses[idx] ?? ""}
                            onChange={(e) => {
                              const novo = [...dyMeses];
                              novo[idx] = e.target.value;
                              updateRow(r.id, { dyMeses: novo });
                            }}
                            onBlur={(e) => {
                              const n = toNum(e.target.value);
                              const novo = [...dyMeses];
                              novo[idx] = n === 0 ? "" : fmtBR(n);
                              updateRow(r.id, { dyMeses: novo });
                            }}
                          />
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <p className="mt-3 text-[11px] text-slate-500">
          Esta carteira é um modelo educacional e não constitui recomendação de investimento.
        </p>
      </div>

      {/* ---------------------------
          Modal simples de relatório
      ---------------------------- */}
      {activeReport && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setActiveReport(null)}>
          <div
            className="w-full max-w-md rounded-2xl bg-slate-950 border border-white/10 p-5 shadow-2xl"
            onClick={(e)=>e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-slate-100 font-semibold text-lg">
                {activeReport.ticker}
              </h3>
              <button
                className="text-slate-400 hover:text-slate-100 text-xl"
                onClick={() => setActiveReport(null)}
              >
                ×
              </button>
            </div>

            <div className="space-y-2 text-sm text-slate-200">
              <div><span className="text-slate-400">Nome:</span> {activeReport.nome}</div>
              <div><span className="text-slate-400">Tipo:</span> {activeReport.tipo}</div>
              <div><span className="text-slate-400">Qtd:</span> {activeReport.qtd || "—"}</div>
              <div><span className="text-slate-400">Entrada:</span> {activeReport.entrada || "—"}</div>
              <div><span className="text-slate-400">Valor atual:</span> {activeReport.valorAtual || "—"}</div>
              <div className="pt-2 text-xs text-slate-400">
                Relatório educacional — sem recomendação individual.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
