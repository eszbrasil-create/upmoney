// src/pages/CarteiraCash.jsx
import React, { useEffect, useMemo, useState } from "react";

const PIE_COLORS = {
  RF: "#22c55e",
  ACOES: "#0ea5e9",
  FII: "#fbbf24",
};

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

/* ===========================
   Helpers donut estilo Dash
=========================== */
function polarToCartesian(cx, cy, r, angleDeg) {
  const a = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
}
function arcPath(cx, cy, rOuter, rInner, startAngle, endAngle) {
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;

  const p1 = polarToCartesian(cx, cy, rOuter, endAngle);
  const p2 = polarToCartesian(cx, cy, rOuter, startAngle);
  const p3 = polarToCartesian(cx, cy, rInner, startAngle);
  const p4 = polarToCartesian(cx, cy, rInner, endAngle);

  return [
    `M ${p1.x} ${p1.y}`,
    `A ${rOuter} ${rOuter} 0 ${largeArc} 0 ${p2.x} ${p2.y}`,
    `L ${p3.x} ${p3.y}`,
    `A ${rInner} ${rInner} 0 ${largeArc} 1 ${p4.x} ${p4.y}`,
    "Z",
  ].join(" ");
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

  // Cálculos globais (distribuição e DY mensal total por mês)
  const {
    totalGeral,
    pieParts,     // já pronto pra donut por TIPO (opção B)
    dyBarData,
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

    const partsRaw = [
      { key: "RF", name: "RF", value: somaPorTipo.RF, color: PIE_COLORS.RF },
      { key: "ACOES", name: "Ações", value: somaPorTipo.ACOES, color: PIE_COLORS.ACOES },
      { key: "FII", name: "FIIs", value: somaPorTipo.FII, color: PIE_COLORS.FII },
    ].filter((d) => d.value > 0);

    const pieParts = partsRaw.map((p) => ({
      ...p,
      pct: total > 0 ? (p.value / total) * 100 : 0,
    }));

    const dyBarData = MESES.map((m, idx) => ({
      name: m,
      dy: dyMesTotal[idx],
    }));

    return { totalGeral: total, pieParts, dyBarData };
  }, [carteira]);

  /* ===========================
     Donut (Participação por tipo)
  =========================== */
  const [activeIdx, setActiveIdx] = useState(null);
  const [hoverIdx, setHoverIdx] = useState(null);
  const idxShown = hoverIdx ?? activeIdx;

  const size = 220;
  const cx = size / 2;
  const cy = size / 2;
  const rOuter = 95;
  const rInner = 58;

  const angles = useMemo(() => {
    let acc = 0;
    return pieParts.map((p) => {
      const start = acc;
      const end = acc + (p.pct / 100) * 360;
      acc = end;
      return { start, end };
    });
  }, [pieParts]);

  const center = useMemo(() => {
    if (
      idxShown == null ||
      idxShown < 0 ||
      idxShown >= pieParts.length ||
      totalGeral <= 0
    ) {
      return {
        title: "Total",
        line1: totalGeral.toLocaleString("pt-BR", {
          style: "currency",
          currency: "BRL",
          maximumFractionDigits: 0,
        }),
        line2: "",
      };
    }
    const it = pieParts[idxShown];
    return {
      title: it.name,
      line1: it.value.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
        maximumFractionDigits: 0,
      }),
      line2: `${it.pct.toFixed(1)}%`,
    };
  }, [idxShown, pieParts, totalGeral]);

  /* ===========================
     Barras DY (estilo CardEvolucao)
  =========================== */
  const dyTotals = dyBarData.map(d => d.dy || 0);
  const dyMax = Math.max(1, ...dyTotals);

  return (
    <div className="pt-0 pr-3 pl-0 relative">
      {/* FAIXA FIXA SUPER REDUZIDA (virará botão no futuro) */}
      <div className="mb-2">
        <div className="fixed left-48 right-6 top-3 z-30">
          <div className="rounded-2xl bg-gradient-to-r from-emerald-500 via-sky-500 to-fuchsia-500 p-[1px] shadow-xl">
            <button
              type="button"
              className="w-full rounded-2xl bg-slate-950/95 px-3 py-2 flex items-center justify-between hover:bg-slate-900/95 transition"
              title="Futuro acesso às carteiras"
            >
              <div className="flex items-center gap-2 text-left">
                <div className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(34,197,94,0.6)]" />
                <div className="text-[12px] sm:text-[13px] font-semibold text-slate-100">
                  Carteiras Modelo UpMoney
                </div>
                <div className="hidden sm:block text-[11px] text-slate-400">
                  Em breve: clique para ver meus ativos
                </div>
              </div>
              <div className="text-[11px] text-slate-300 bg-slate-800/60 px-2 py-1 rounded-lg">
                Acesso futuro
              </div>
            </button>
          </div>
        </div>

        {/* espaço bem menor pra não roubar tela */}
        <div className="h-16" />
      </div>

      {/* CARD: gráficos premium estilo Dash */}
      <div className="rounded-xl bg-slate-800/70 border border-white/10 shadow-lg p-4 mb-4">
        {totalGeral <= 0 ? (
          <p className="text-[11px] text-slate-500">
            Preencha <strong>Quantidade</strong>, <strong>Entrada</strong>,{" "}
            <strong>Valor atual</strong> e os <strong>DY por mês</strong> na
            tabela para visualizar os gráficos.
          </p>
        ) : (
          <div className="grid gap-4 md:grid-cols-3 items-stretch">
            {/* Donut premium (mesmo padrão do Dash) */}
            <div className="md:col-span-1">
              <div className="h-full rounded-lg bg-slate-900/70 border border-slate-700/70 p-3">
                <div className="text-slate-100 text-sm font-semibold mb-2">
                  Distribuição por tipo
                </div>

                <div className="grid grid-cols-[1fr_220px] gap-2 items-center">
                  {/* legenda */}
                  <div className="space-y-2 pr-2">
                    {pieParts.map((it, i) => {
                      const isActive = i === idxShown;
                      return (
                        <div
                          key={it.key}
                          onMouseEnter={() => setHoverIdx(i)}
                          onMouseLeave={() => setHoverIdx(null)}
                          onClick={() => setActiveIdx(prev => (prev === i ? null : i))}
                          className={`rounded-xl border border-white/10 bg-slate-950/50 px-3 py-2 cursor-pointer transition
                            ${isActive ? "ring-1 ring-sky-400/50 bg-slate-900/70" : ""}`}
                        >
                          <div className="flex items-center w-full">
                            <span
                              className="inline-block h-3 w-3 rounded-full mr-2"
                              style={{ backgroundColor: it.color }}
                            />
                            <span className="text-slate-100 text-sm truncate flex-1">
                              {it.name}
                            </span>
                            <span className="text-slate-300 text-sm ml-auto tabular-nums">
                              {it.pct.toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* donut */}
                  <div className="flex items-center justify-center">
                    <div className="relative" style={{ width: size, height: size }}>
                      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                        <circle
                          cx={cx}
                          cy={cy}
                          r={(rOuter + rInner) / 2}
                          stroke="#0b1220"
                          strokeOpacity="0.5"
                          strokeWidth={rOuter - rInner}
                          fill="none"
                        />

                        {pieParts.map((p, i) => {
                          const { start, end } = angles[i];
                          const d = arcPath(cx, cy, rOuter, rInner, start, end);
                          const selected = i === idxShown;

                          return (
                            <path
                              key={p.key}
                              d={d}
                              fill={p.color}
                              fillOpacity={selected ? 1 : 0.85}
                              className={`transition-all duration-150 cursor-pointer ${
                                selected ? "drop-shadow-[0_0_8px_rgba(56,189,248,0.5)]" : ""
                              }`}
                              onMouseEnter={() => setHoverIdx(i)}
                              onMouseLeave={() => setHoverIdx(null)}
                              onClick={() => setActiveIdx(prev => (prev === i ? null : i))}
                            />
                          );
                        })}

                        {idxShown != null && (
                          <circle
                            cx={cx}
                            cy={cy}
                            r={rInner - 6}
                            fill="none"
                            stroke="rgba(15,23,42,0.55)"
                            strokeWidth="12"
                          />
                        )}
                      </svg>

                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="text-center leading-tight px-3">
                          <div className="text-slate-200 text-sm font-semibold">
                            {center.title}
                          </div>
                          <div className="text-slate-100 text-xl font-extrabold">
                            {center.line1}
                          </div>
                          {center.line2 ? (
                            <div className="text-slate-300 text-sm mt-0.5">
                              {center.line2}
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* Barras DY premium (mesmo padrão Evolução) */}
            <div className="md:col-span-2">
              <div className="h-full rounded-lg bg-slate-900/70 border border-slate-700/70 p-3">
                <div className="text-slate-100 text-sm font-semibold mb-2">
                  DY mensal total
                </div>

                <div className="h-[180px] rounded-xl border border-white/10 bg-slate-900/50 p-3 overflow-x-auto overflow-y-hidden">
                  <div className="flex items-end gap-1 min-w-max">
                    {dyBarData.map((d, i) => {
                      const v = d.dy || 0;
                      const h = Math.max(4, Math.round((v / dyMax) * 140));

                      return (
                        <div key={i} className="flex flex-col items-center gap-2 w-10">
                          <div
                            className="w-full rounded-md bg-emerald-400/80 hover:bg-emerald-300 transition"
                            style={{ height: `${h}px` }}
                            title={v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                          />
                          <div className="text-[12px] text-slate-300 text-center leading-tight whitespace-nowrap">
                            {d.name}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

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
                  <th className="px-3 py-2 text-left text-xs font-medium sticky left-0 bg-slate-800/70 z-20">
                    #
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium sticky left-[2.5rem] bg-slate-800/70 z-20">
                    Ticker
                  </th>
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
                  const partStr =
                    totalGeral > 0 && valorPosicao > 0
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
                          onChange={(e) =>
                            updateRow(r.id, { dataEntrada: e.target.value })
                          }
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
