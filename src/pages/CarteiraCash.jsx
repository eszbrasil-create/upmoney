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
  ReferenceLine,
} from "recharts";

const PIE_COLORS = {
  RF: "#22c55e",
  ACOES: "#0ea5e9",
  FII: "#fbbf24",
};

const BAR_BASE = "#22c55e";
const MESES = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];

// Carteira base (modelo inicial)
const BASE_ROWS = [
  // AÇÕES
  { id: 1, tipo: "ACOES", ticker: "VALE3", nome: "Vale", dataEntrada: "", qtd: "", entrada: "", valorAtual: "", dy: "", dyMeses: Array(12).fill("") },
  { id: 2, tipo: "ACOES", ticker: "ITUB4", nome: "Itaú Unibanco", dataEntrada: "", qtd: "", entrada: "", valorAtual: "", dy: "", dyMeses: Array(12).fill("") },
  { id: 3, tipo: "ACOES", ticker: "GGBR4", nome: "Gerdau", dataEntrada: "", qtd: "", entrada: "", valorAtual: "", dy: "", dyMeses: Array(12).fill("") },
  { id: 4, tipo: "ACOES", ticker: "AXIA6", nome: "AXIA6", dataEntrada: "", qtd: "", entrada: "", valorAtual: "", dy: "", dyMeses: Array(12).fill("") },
  { id: 5, tipo: "ACOES", ticker: "DIRR3", nome: "Direcional", dataEntrada: "", qtd: "", entrada: "", valorAtual: "", dy: "", dyMeses: Array(12).fill("") },
  { id: 6, tipo: "ACOES", ticker: "CYRE3", nome: "Cyrela", dataEntrada: "", qtd: "", entrada: "", valorAtual: "", dy: "", dyMeses: Array(12).fill("") },
  { id: 7, tipo: "ACOES", ticker: "PETR4", nome: "Petrobras PN", dataEntrada: "", qtd: "", entrada: "", valorAtual: "", dy: "", dyMeses: Array(12).fill("") },
  { id: 8, tipo: "ACOES", ticker: "SLCE3", nome: "SLC Agrícola", dataEntrada: "", qtd: "", entrada: "", valorAtual: "", dy: "", dyMeses: Array(12).fill("") },
  { id: 9, tipo: "ACOES", ticker: "VIVT3", nome: "Vivo (Telefônica)", dataEntrada: "", qtd: "", entrada: "", valorAtual: "", dy: "", dyMeses: Array(12).fill("") },

  // RENDA FIXA
  { id: 10, tipo: "RF", ticker: "SELIC", nome: "Selic Simples", dataEntrada: "", qtd: "", entrada: "1", valorAtual: "", dy: "", dyMeses: Array(12).fill("") },
  { id: 11, tipo: "RF", ticker: "IPCA35", nome: "Tesouro IPCA+ 2035", dataEntrada: "", qtd: "", entrada: "1", valorAtual: "", dy: "", dyMeses: Array(12).fill("") },

  // FIIs
  { id: 12, tipo: "FII", ticker: "HGLG11", nome: "CSHG Logística", dataEntrada: "", qtd: "", entrada: "", valorAtual: "", dy: "", dyMeses: Array(12).fill("") },
  { id: 13, tipo: "FII", ticker: "KNCR11", nome: "Kinea Rendimentos", dataEntrada: "", qtd: "", entrada: "", valorAtual: "", dy: "", dyMeses: Array(12).fill("") },
];

const LS_KEY = "cc_carteira_cash_v1";

// Helper para converter texto em número
function toNum(x) {
  if (x === "" || x === null || x === undefined) return 0;
  const n = Number(String(x).replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

export default function CarteiraCash() {
  // Estado da carteira (editável)
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

  // Persiste alterações
  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(carteira));
    } catch {}
  }, [carteira]);

  const updateRow = (id, patch) => {
    setCarteira((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...patch } : r))
    );
  };

  // Cálculos globais
  const {
    distAtual,
    totalGeral,
    pieData,
    dyBarData,
    totalDyMensal,
    mediaDyMensal,
    maxDyMes,
  } = useMemo(() => {
    const somaPorTipo = { RF: 0, ACOES: 0, FII: 0 };
    let total = 0;

    const dyMesTotal = Array(12).fill(0);

    carteira.forEach((r) => {
      const qtd = toNum(r.qtd);
      const entrada = toNum(r.entrada);
      const valorAtual = toNum(r.valorAtual) || entrada;
      const valorPosicao = qtd * valorAtual;
      const tipoKey = r.tipo;

      if (!somaPorTipo[tipoKey]) somaPorTipo[tipoKey] = 0;
      somaPorTipo[tipoKey] += valorPosicao;
      total += valorPosicao;

      const arrMeses = Array.isArray(r.dyMeses) ? r.dyMeses : [];
      for (let i = 0; i < 12; i++) {
        dyMesTotal[i] += toNum(arrMeses[i]);
      }
    });

    let dist = { RF: 0, ACOES: 0, FII: 0 };
    if (total > 0) {
      dist = {
        RF: (somaPorTipo.RF / total) * 100 || 0,
        ACOES: (somaPorTipo.ACOES / total) * 100 || 0,
        FII: (somaPorTipo.FII / total) * 100 || 0,
      };
    }

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
    const mesesComDy = dyMesTotal.filter((v) => v > 0).length || 1;
    const mediaDyMensal = totalDyMensal / mesesComDy;
    const maxDyMes = Math.max(0, ...dyMesTotal);

    return {
      distAtual: dist,
      totalGeral: total,
      pieData,
      dyBarData,
      totalDyMensal,
      mediaDyMensal,
      maxDyMes,
    };
  }, [carteira]);

  // Tooltip premium do gráfico de pizza
  const PieTooltip = ({ active, payload }) => {
    if (!active || !payload || !payload.length) return null;
    const { name, value } = payload[0];
    const perc =
      totalGeral > 0 ? ((value / totalGeral) * 100).toFixed(1) : "0.0";

    return (
      <div className="rounded-lg bg-black/95 border border-amber-300/30 px-3 py-2 text-xs text-slate-100 shadow-xl">
        <div className="font-semibold text-slate-100">{name}</div>
        <div className="mt-0.5">
          {value.toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL",
          })}{" "}
          <span className="text-slate-400">({perc}%)</span>
        </div>
      </div>
    );
  };

  // Tooltip premium do gráfico de barras (DY)
  const BarTooltip = ({ active, payload, label }) => {
    if (!active || !payload || !payload.length) return null;
    const v = payload[0].value || 0;
    const pctTotal = totalDyMensal > 0 ? (v / totalDyMensal) * 100 : 0;

    return (
      <div className="rounded-lg bg-black/95 border border-emerald-300/30 px-3 py-2 text-xs text-slate-100 shadow-xl">
        <div className="font-semibold text-slate-100">DY em {label}</div>
        <div className="mt-0.5">
          {v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
        </div>
        <div className="text-slate-400 mt-0.5">
          {pctTotal.toFixed(1)}% do total anual
        </div>
      </div>
    );
  };

  // Legenda premium do donut: nome esquerda, % direita
  const PieLegend = () => {
    if (!pieData.length) return null;

    return (
      <div className="mt-1 space-y-1">
        {pieData.map((p) => {
          const pct = totalGeral > 0 ? (p.value / totalGeral) * 100 : 0;
          return (
            <div
              key={p.key}
              className="flex items-center text-[11px] text-slate-200"
            >
              <span
                className="inline-block h-2.5 w-2.5 rounded-full mr-2"
                style={{ backgroundColor: PIE_COLORS[p.key] || "#64748b" }}
              />
              <span className="flex-1 truncate">{p.name}</span>
              <span className="ml-auto tabular-nums text-slate-300">
                {pct.toFixed(1)}%
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="pt-0 pr-3 pl-0 relative">
      {/* FAIXA DE PRODUTOS / CARTEIRAS MODELO – FIXA NA TELA (reduzida) */}
      <div className="mb-3">
        <div className="fixed left-48 right-6 top-3 z-30">
          <div className="rounded-2xl bg-gradient-to-r from-emerald-500 via-sky-500 to-fuchsia-500 p-[1px] shadow-xl">
            <div className="rounded-2xl bg-slate-950/95 p-2">
              <div className="grid gap-2 md:grid-cols-3">
                {/* Carteira Dividendos */}
                <div className="rounded-xl bg-emerald-500/10 border border-emerald-400/40 px-3 py-1.5 flex items-center justify-between gap-2">
                  <div>
                    <h2 className="text-emerald-300 text-xs font-semibold leading-tight">
                      Carteira Dividendos
                    </h2>
                    <p className="text-slate-200/80 text-[10px] leading-tight">
                      Renda recorrente.
                    </p>
                  </div>
                  <button
                    type="button"
                    className="inline-flex items-center justify-center rounded-lg bg-emerald-400 text-slate-900 text-[10px] font-semibold px-2.5 py-1 hover:bg-emerald-300 transition whitespace-nowrap"
                  >
                    Baixar PDF
                  </button>
                </div>

                {/* Carteira Fundos Imobiliários */}
                <div className="rounded-xl bg-amber-500/10 border border-amber-400/40 px-3 py-1.5 flex items-center justify-between gap-2">
                  <div>
                    <h2 className="text-amber-300 text-xs font-semibold leading-tight">
                      Carteira FIIs
                    </h2>
                    <p className="text-slate-200/80 text-[10px] leading-tight">
                      Renda mensal.
                    </p>
                  </div>
                  <button
                    type="button"
                    className="inline-flex items-center justify-center rounded-lg bg-amber-400 text-slate-900 text-[10px] font-semibold px-2.5 py-1 hover:bg-amber-300 transition whitespace-nowrap"
                  >
                    Baixar PDF
                  </button>
                </div>

                {/* Carteira Criptomoedas */}
                <div className="rounded-xl bg-sky-500/10 border border-sky-400/40 px-3 py-1.5 flex items-center justify-between gap-2">
                  <div>
                    <h2 className="text-sky-300 text-xs font-semibold leading-tight">
                      Carteira Cripto
                    </h2>
                    <p className="text-slate-200/80 text-[10px] leading-tight">
                      Longo prazo.
                    </p>
                  </div>
                  <button
                    type="button"
                    className="inline-flex items-center justify-center rounded-lg bg-sky-400 text-slate-900 text-[10px] font-semibold px-2.5 py-1 hover:bg-sky-300 transition whitespace-nowrap"
                  >
                    Baixar PDF
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Espaço reservado menor */}
        <div className="h-20" />
      </div>

      {/* CARD: gráficos premium */}
      <div className="rounded-xl bg-slate-800/70 border border-white/10 shadow-lg p-4 mb-4">
        {totalGeral <= 0 ? (
          <p className="text-[11px] text-slate-500">
            Preencha <strong>Quantidade</strong>, <strong>Entrada</strong>,{" "}
            <strong>Valor atual</strong> e os <strong>DY por mês</strong> na
            tabela para visualizar os gráficos.
          </p>
        ) : (
          <div className="grid gap-4 md:grid-cols-3 items-stretch">
            {/* Donut premium */}
            <div className="md:col-span-1 h-48">
              <div className="h-full rounded-lg bg-slate-900/70 border border-slate-700/70 px-2 py-2 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={70}
                      innerRadius={42}
                      paddingAngle={3}
                      isAnimationActive
                      animationDuration={450}
                    >
                      {pieData.map((entry) => (
                        <Cell
                          key={entry.key}
                          fill={PIE_COLORS[entry.key] || "#64748b"}
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<PieTooltip />} />
                  </PieChart>
                </ResponsiveContainer>

                {/* Centro premium */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="text-center leading-tight">
                    <div className="text-[11px] text-slate-400 font-medium">
                      Patrimônio atual
                    </div>
                    <div className="text-slate-100 text-lg font-extrabold drop-shadow-sm">
                      {totalGeral.toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                        maximumFractionDigits: 0,
                      })}
                    </div>
                  </div>
                </div>

                {/* Legenda premium */}
                <div className="absolute bottom-2 left-2 right-2">
                  <PieLegend />
                </div>
              </div>
            </div>

            {/* Barras DY premium */}
            <div className="md:col-span-2 h-48">
              <div className="h-full rounded-lg bg-slate-900/70 border border-slate-700/70 px-2 py-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dyBarData} barCategoryGap={8}>
                    <defs>
                      <linearGradient id="dyGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#34d399" stopOpacity={1} />
                        <stop offset="100%" stopColor="#15803d" stopOpacity={1} />
                      </linearGradient>
                    </defs>

                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 11, fill: "#cbd5f5" }}
                      axisLine={{ stroke: "rgba(148,163,184,0.25)" }}
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
                    <Tooltip content={<BarTooltip />} />

                    {/* Linha de média */}
                    {mediaDyMensal > 0 && (
                      <ReferenceLine
                        y={mediaDyMensal}
                        stroke="rgba(251,191,36,0.9)"
                        strokeDasharray="4 4"
                        ifOverflow="extendDomain"
                        label={{
                          value: "média",
                          position: "right",
                          fill: "rgba(251,191,36,0.95)",
                          fontSize: 10,
                        }}
                      />
                    )}

                    <Bar
                      dataKey="dy"
                      radius={[8, 8, 0, 0]}
                      fill="url(#dyGrad)"
                      isAnimationActive
                      animationDuration={500}
                    />
                  </BarChart>
                </ResponsiveContainer>

                {/* Pequeno destaque do melhor mês */}
                {maxDyMes > 0 && (
                  <div className="mt-1 text-[10px] text-slate-400 text-right pr-1">
                    Pico:{" "}
                    {maxDyMes.toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                      maximumFractionDigits: 0,
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tabela de ativos */}
      <div className="rounded-xl bg-slate-800/70 border border-white/10 shadow-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-slate-200 text-sm font-medium">
            Detalhamento da carteira modelo
          </h2>
          <span className="text-[11px] text-slate-400">
            Edite tipo, setor, data de entrada, quantidade, entrada, valor atual e todos os DYs.
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

                  const totalGeralPos = totalGeral || 0;
                  const partAtual =
                    totalGeralPos > 0 ? (valorPosicao / totalGeralPos) * 100 : 0;
                  const partStr =
                    totalGeralPos > 0 && valorPosicao > 0
                      ? `${partAtual.toFixed(2)}%`
                      : "—";

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
                          title="Ticker do ativo"
                        />
                      </td>

                      <td className="px-3 py-2">
                        <button
                          className="px-3 py-1.5 rounded-lg border border-white/10 bg-slate-800 text-slate-100 text-xs hover:bg-slate-700"
                          type="button"
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
                          title="Setor ou categoria do ativo"
                        />
                      </td>

                      <td className="px-3 py-2 text-left">
                        <input
                          type="date"
                          className="bg-slate-900 border border-slate-700 rounded-md px-2 py-1 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-sky-500"
                          value={r.dataEntrada ?? ""}
                          onChange={(e) => updateRow(r.id, { dataEntrada: e.target.value })}
                          title="Data de entrada no ativo"
                        />
                      </td>

                      <td className="px-3 py-2 text-right">
                        <input
                          className="w-full bg-transparent text-right outline-none text-slate-100 placeholder:text-slate-600 text-sm"
                          inputMode="decimal"
                          placeholder="0"
                          value={r.qtd ?? ""}
                          onChange={(e) => updateRow(r.id, { qtd: e.target.value })}
                          onBlur={(e) => {
                            const n = toNum(e.target.value);
                            updateRow(r.id, { qtd: n === 0 ? "" : String(n) });
                          }}
                          title="Quantidade de cotas/ações"
                        />
                      </td>

                      <td className="px-3 py-2 text-right">
                        <input
                          className="w-full bg-transparent text-right outline-none text-slate-100 placeholder:text-slate-600 text-sm"
                          inputMode="decimal"
                          placeholder="0,00"
                          value={r.entrada ?? ""}
                          onChange={(e) => updateRow(r.id, { entrada: e.target.value })}
                          onBlur={(e) => {
                            const n = toNum(e.target.value);
                            updateRow(r.id, { entrada: n === 0 ? "" : String(n) });
                          }}
                          title="Preço médio de entrada"
                        />
                      </td>

                      <td className="px-3 py-2 text-right">
                        <input
                          className="w-full bg-transparent text-right outline-none text-slate-100 placeholder:text-slate-600 text-sm"
                          inputMode="decimal"
                          placeholder="0,00"
                          value={r.valorAtual ?? ""}
                          onChange={(e) => updateRow(r.id, { valorAtual: e.target.value })}
                          onBlur={(e) => {
                            const n = toNum(e.target.value);
                            updateRow(r.id, { valorAtual: n === 0 ? "" : String(n) });
                          }}
                          title="Preço atual estimado"
                        />
                      </td>

                      <td className="px-3 py-2 text-right text-slate-200">
                        {valorPosicao > 0
                          ? valorPosicao.toLocaleString("pt-BR", {
                              style: "currency",
                              currency: "BRL",
                            })
                          : "—"}
                      </td>

                      <td className={`px-3 py-2 text-right ${varClass}`}>
                        {hasVar ? `${varPerc.toFixed(2)}%` : "—"}
                      </td>

                      <td className="px-3 py-2 text-right text-slate-200">
                        {partStr}
                      </td>

                      <td className="px-3 py-2 text-right text-slate-200 font-semibold">
                        {dy12mValor > 0
                          ? dy12mValor.toLocaleString("pt-BR", {
                              style: "currency",
                              currency: "BRL",
                            })
                          : "—"}
                      </td>

                      {MESES.map((_, idx) => (
                        <td key={idx} className="px-3 py-2 text-right">
                          <input
                            className="w-full bg-transparent text-right outline-none text-slate-100 placeholder:text-slate-600 text-sm"
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
                              novo[idx] = n === 0 ? "" : String(n);
                              updateRow(r.id, { dyMeses: novo });
                            }}
                            title={`DY em ${MESES[idx]} (R$)`}
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
    </div>
  );
}
