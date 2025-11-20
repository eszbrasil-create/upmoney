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
} from "recharts";

const PIE_COLORS = {
  RF: "#22c55e",
  ACOES: "#0ea5e9",
  FII: "#fbbf24",
};

const BAR_COLOR = "#22c55e"; // cor da barra de DY mensal total
const MESES = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];

// Carteira base (modelo inicial)
const BASE_ROWS = [
  // AÇÕES
  {
    id: 1,
    tipo: "ACOES",
    ticker: "VALE3",
    nome: "Vale",
    dataEntrada: "",
    qtd: "",
    entrada: "",
    valorAtual: "",
    dy: "",
    dyMeses: Array(12).fill(""),
  },
  {
    id: 2,
    tipo: "ACOES",
    ticker: "ITUB4",
    nome: "Itaú Unibanco",
    dataEntrada: "",
    qtd: "",
    entrada: "",
    valorAtual: "",
    dy: "",
    dyMeses: Array(12).fill(""),
  },
  {
    id: 3,
    tipo: "ACOES",
    ticker: "GGBR4",
    nome: "Gerdau",
    dataEntrada: "",
    qtd: "",
    entrada: "",
    valorAtual: "",
    dy: "",
    dyMeses: Array(12).fill(""),
  },
  {
    id: 4,
    tipo: "ACOES",
    ticker: "AXIA6",
    nome: "AXIA6",
    dataEntrada: "",
    qtd: "",
    entrada: "",
    valorAtual: "",
    dy: "",
    dyMeses: Array(12).fill(""),
  },
  {
    id: 5,
    tipo: "ACOES",
    ticker: "DIRR3",
    nome: "Direcional",
    dataEntrada: "",
    qtd: "",
    entrada: "",
    valorAtual: "",
    dy: "",
    dyMeses: Array(12).fill(""),
  },
  {
    id: 6,
    tipo: "ACOES",
    ticker: "CYRE3",
    nome: "Cyrela",
    dataEntrada: "",
    qtd: "",
    entrada: "",
    valorAtual: "",
    dy: "",
    dyMeses: Array(12).fill(""),
  },
  {
    id: 7,
    tipo: "ACOES",
    ticker: "PETR4",
    nome: "Petrobras PN",
    dataEntrada: "",
    qtd: "",
    entrada: "",
    valorAtual: "",
    dy: "",
    dyMeses: Array(12).fill(""),
  },
  {
    id: 8,
    tipo: "ACOES",
    ticker: "SLCE3",
    nome: "SLC Agrícola",
    dataEntrada: "",
    qtd: "",
    entrada: "",
    valorAtual: "",
    dy: "",
    dyMeses: Array(12).fill(""),
  },
  {
    id: 9,
    tipo: "ACOES",
    ticker: "VIVT3",
    nome: "Vivo (Telefônica)",
    dataEntrada: "",
    qtd: "",
    entrada: "",
    valorAtual: "",
    dy: "",
    dyMeses: Array(12).fill(""),
  },

  // RENDA FIXA
  {
    id: 10,
    tipo: "RF",
    ticker: "SELIC",
    nome: "Selic Simples",
    dataEntrada: "",
    qtd: "",
    entrada: "1",
    valorAtual: "",
    dy: "",
    dyMeses: Array(12).fill(""),
  },
  {
    id: 11,
    tipo: "RF",
    ticker: "IPCA35",
    nome: "Tesouro IPCA+ 2035",
    dataEntrada: "",
    qtd: "",
    entrada: "1",
    valorAtual: "",
    dy: "",
    dyMeses: Array(12).fill(""),
  },

  // FIIs
  {
    id: 12,
    tipo: "FII",
    ticker: "HGLG11",
    nome: "CSHG Logística",
    dataEntrada: "",
    qtd: "",
    entrada: "",
    valorAtual: "",
    dy: "",
    dyMeses: Array(12).fill(""),
  },
  {
    id: 13,
    tipo: "FII",
    ticker: "KNCR11",
    nome: "Kinea Rendimentos",
    dataEntrada: "",
    qtd: "",
    entrada: "",
    valorAtual: "",
    dy: "",
    dyMeses: Array(12).fill(""),
  },
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
      // garante que todas as linhas tenham dyMeses[12] e dataEntrada
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
    distAtual,
    totalGeral,
    pieData,
    dyBarData,
    totalDyMensal,
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

    return {
      distAtual: dist,
      totalGeral: total,
      pieData,
      dyBarData,
      totalDyMensal,
    };
  }, [carteira]);

  // Tooltip customizado do gráfico de pizza (valor + %)
  const PieTooltip = ({ active, payload }) => {
    if (!active || !payload || !payload.length) return null;
    const { name, value } = payload[0];
    const perc =
      totalGeral > 0 ? ((value / totalGeral) * 100).toFixed(1) : "0.0";

    return (
      <div className="rounded-md bg-slate-900/95 border border-slate-700 px-2 py-1 text-xs text-slate-100">
        <div className="font-semibold">{name}</div>
        <div>
          {value.toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL",
          })}{" "}
          <span className="text-slate-400">({perc}%)</span>
        </div>
      </div>
    );
  };

  return (
    <div className="pt-0 pr-3 pl-0 relative">
      {/* FAIXA DE PRODUTOS / CARTEIRAS MODELO – FIXA NA TELA */}
      <div className="mb-4">
        {/* barra fixa alinhada ao conteúdo (ajuste left/right se precisar) */}
        <div className="fixed left-48 right-6 top-3 z-30">
          <div className="rounded-2xl bg-gradient-to-r from-emerald-500 via-sky-500 to-fuchsia-500 p-[1px] shadow-xl">
            <div className="rounded-2xl bg-slate-950/95 p-3 sm:p-4">
              <div className="grid gap-3 md:grid-cols-3">
                {/* Carteira Dividendos */}
                <div className="rounded-xl bg-emerald-500/10 border border-emerald-400/40 px-4 py-2 flex flex-col gap-1.5">
                  <h2 className="text-emerald-300 text-sm font-semibold">
                    Carteira Dividendos
                  </h2>
                  <p className="text-slate-200/90 text-[11px] leading-snug">
                    Seleção de ativos focados em geração de renda recorrente via dividendos.
                  </p>
                  <div className="mt-1">
                    <button
                      type="button"
                      className="inline-flex items-center justify-center rounded-lg bg-emerald-400 text-slate-900 text-[11px] font-semibold px-3 py-1 hover:bg-emerald-300 transition"
                    >
                      Baixar carteira (PDF)
                    </button>
                  </div>
                </div>

                {/* Carteira Fundos Imobiliários */}
                <div className="rounded-xl bg-amber-500/10 border border-amber-400/40 px-4 py-2 flex flex-col gap-1.5">
                  <h2 className="text-amber-300 text-sm font-semibold">
                    Carteira Fundos Imobiliários
                  </h2>
                  <p className="text-slate-200/90 text-[11px] leading-snug">
                    Conjunto de FIIs para renda mensal e exposição diversificada ao mercado.
                  </p>
                  <div className="mt-1">
                    <button
                      type="button"
                      className="inline-flex items-center justify-center rounded-lg bg-amber-400 text-slate-900 text-[11px] font-semibold px-3 py-1 hover:bg-amber-300 transition"
                    >
                      Baixar carteira (PDF)
                    </button>
                  </div>
                </div>

                {/* Carteira Criptomoedas */}
                <div className="rounded-xl bg-sky-500/10 border border-sky-400/40 px-4 py-2 flex flex-col gap-1.5">
                  <h2 className="text-sky-300 text-sm font-semibold">
                    Carteira Criptomoedas
                  </h2>
                  <p className="text-slate-200/90 text-[11px] leading-snug">
                    Estrutura pensada para exposição a cripto com foco em longo prazo e risco.
                  </p>
                  <div className="mt-1">
                    <button
                      type="button"
                      className="inline-flex items-center justify-center rounded-lg bg-sky-400 text-slate-900 text-[11px] font-semibold px-3 py-1 hover:bg-sky-300 transition"
                    >
                      Baixar carteira (PDF)
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Espaço reservado para não sobrepor o conteúdo abaixo */}
        <div className="h-32" />
      </div>

      {/* CARD: gráficos */}
      <div className="rounded-xl bg-slate-800/70 border border-white/10 shadow-lg p-4 mb-4">
        {totalGeral <= 0 ? (
          <p className="text-[11px] text-slate-500">
            Preencha <strong>Quantidade</strong>, <strong>Entrada</strong>,{" "}
            <strong>Valor atual</strong> e os <strong>DY por mês</strong> na
            tabela para visualizar os gráficos.
          </p>
        ) : (
          <div className="grid gap-4 md:grid-cols-3 items-stretch">
            {/* Pizza: altura menor */}
            <div className="md:col-span-1 h-40">
              <div className="h-full rounded-lg bg-slate-900/70 border border-slate-700/70 px-2 py-1">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={50}
                      innerRadius={26}
                      paddingAngle={3}
                    >
                      {pieData.map((entry) => (
                        <Cell
                          key={entry.key}
                          fill={PIE_COLORS[entry.key] || "#64748b"}
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<PieTooltip />} />
                    <Legend
                      verticalAlign="bottom"
                      height={24}
                      formatter={(value) => (
                        <span className="text-[11px] text-slate-200">
                          {value}
                        </span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Barras: só o gráfico, altura menor */}
            <div className="md:col-span-2 h-40">
              <div className="h-full rounded-lg bg-slate-900/70 border border-slate-700/70 px-2 py-1">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dyBarData}>
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 10, fill: "#cbd5f5" }}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: "#cbd5f5" }}
                      tickFormatter={(v) =>
                        v.toLocaleString("pt-BR", {
                          maximumFractionDigits: 0,
                        })
                      }
                    />
                    <Tooltip
                      formatter={(v) =>
                        v.toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        })
                      }
                    />
                    <Bar
                      dataKey="dy"
                      radius={[4, 4, 0, 0]}
                      fill={BAR_COLOR}
                    />
                  </BarChart>
                </ResponsiveContainer>
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
                  <th className="px-3 py-2 text-left text-xs font-medium">
                    Relatório
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium">
                    Tipo
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium w-32">
                    Setor
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium">
                    Data entrada
                  </th>
                  <th className="px-3 py-2 text-right text-xs font-medium">
                    Quantidade
                  </th>
                  <th className="px-3 py-2 text-right text-xs font-medium">
                    Entrada (R$)
                  </th>
                  <th className="px-3 py-2 text-right text-xs font-medium">
                    Valor atual (R$)
                  </th>
                  <th className="px-3 py-2 text-right text-xs font-medium">
                    Posição (R$)
                  </th>
                  <th className="px-3 py-2 text-right text-xs font-medium">
                    % Var
                  </th>
                  <th className="px-3 py-2 text-right text-xs font-medium">
                    Part. %
                  </th>
                  <th className="px-3 py-2 text-right text-xs font-medium">
                    DY (12m)
                  </th>
                  {MESES.map((m) => (
                    <th
                      key={m}
                      className="px-3 py-2 text-right text-xs font-medium"
                    >
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

                  // % Var = valorAtual / entrada - 1
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
                    ? [...r.dyMeses, ...Array(12 - r.dyMeses.length).fill("")].slice(
                        0,
                        12
                      )
                    : Array(12).fill("");

                  // DY 12m = soma dos DY mensais
                  const dy12mValor = dyMeses.reduce(
                    (acc, v) => acc + toNum(v),
                    0
                  );

                  return (
                    <tr
                      key={r.id}
                      className="border-t border-white/5 hover:bg-slate-800/30"
                    >
                      {/* índice - sticky */}
                      <td className="px-3 py-2 text-slate-500 text-xs sticky left-0 bg-slate-900/90 z-10">
                        {i + 1}
                      </td>

                      {/* Ticker STICKY */}
                      <td className="px-3 py-2 text-left sticky left-[2.5rem] bg-slate-900/90 z-10">
                        <input
                          className="w-full bg-transparent outline-none text-slate-100 placeholder:text-slate-600 text-sm"
                          value={r.ticker ?? ""}
                          onChange={(e) =>
                            updateRow(r.id, {
                              ticker: e.target.value.toUpperCase(),
                            })
                          }
                          title="Ticker do ativo"
                        />
                      </td>

                      {/* Relatório (placeholder) */}
                      <td className="px-3 py-2">
                        <button
                          className="px-3 py-1.5 rounded-lg border border-white/10 bg-slate-800 text-slate-100 text-xs hover:bg-slate-700"
                          type="button"
                        >
                          Ver
                        </button>
                      </td>

                      {/* Tipo: seletor RF / Ações / FII */}
                      <td className="px-3 py-2">
                        <select
                          className="bg-slate-900 border border-slate-700 rounded-md px-2 py-1 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-sky-500"
                          value={r.tipo}
                          onChange={(e) =>
                            updateRow(r.id, { tipo: e.target.value })
                          }
                        >
                          <option value="RF">RF</option>
                          <option value="ACOES">Ações</option>
                          <option value="FII">FII</option>
                        </select>
                      </td>

                      {/* Setor EDITÁVEL */}
                      <td className="px-3 py-2 text-slate-200 w-32 truncate">
                        <input
                          className="w-full bg-transparent outline-none text-slate-100 placeholder:text-slate-600 text-sm"
                          value={r.nome ?? ""}
                          onChange={(e) =>
                            updateRow(r.id, { nome: e.target.value })
                          }
                          placeholder="Setor"
                          title="Setor ou categoria do ativo"
                        />
                      </td>

                      {/* Data de entrada */}
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

                      {/* Quantidade (editável) */}
                      <td className="px-3 py-2 text-right">
                        <input
                          className="w-full bg-transparent text-right outline-none text-slate-100 placeholder:text-slate-600 text-sm"
                          inputMode="decimal"
                          placeholder="0"
                          value={r.qtd ?? ""}
                          onChange={(e) =>
                            updateRow(r.id, { qtd: e.target.value })
                          }
                          onBlur={(e) => {
                            const n = toNum(e.target.value);
                            updateRow(r.id, {
                              qtd: n === 0 ? "" : String(n),
                            });
                          }}
                          title="Quantidade de cotas/ações"
                        />
                      </td>

                      {/* Entrada (editável) */}
                      <td className="px-3 py-2 text-right">
                        <input
                          className="w-full bg-transparent text-right outline-none text-slate-100 placeholder:text-slate-600 text-sm"
                          inputMode="decimal"
                          placeholder="0,00"
                          value={r.entrada ?? ""}
                          onChange={(e) =>
                            updateRow(r.id, { entrada: e.target.value })
                          }
                          onBlur={(e) => {
                            const n = toNum(e.target.value);
                            updateRow(r.id, {
                              entrada: n === 0 ? "" : String(n),
                            });
                          }}
                          title="Preço médio de entrada"
                        />
                      </td>

                      {/* Valor atual (editável) */}
                      <td className="px-3 py-2 text-right">
                        <input
                          className="w-full bg-transparent text-right outline-none text-slate-100 placeholder:text-slate-600 text-sm"
                          inputMode="decimal"
                          placeholder="0,00"
                          value={r.valorAtual ?? ""}
                          onChange={(e) =>
                            updateRow(r.id, { valorAtual: e.target.value })
                          }
                          onBlur={(e) => {
                            const n = toNum(e.target.value);
                            updateRow(r.id, {
                              valorAtual: n === 0 ? "" : String(n),
                            });
                          }}
                          title="Preço atual estimado"
                        />
                      </td>

                      {/* Posição (R$) */}
                      <td className="px-3 py-2 text-right text-slate-200">
                        {valorPosicao > 0
                          ? valorPosicao.toLocaleString("pt-BR", {
                              style: "currency",
                              currency: "BRL",
                            })
                          : "—"}
                      </td>

                      {/* % Var */}
                      <td className={`px-3 py-2 text-right ${varClass}`}>
                        {hasVar ? `${varPerc.toFixed(2)}%` : "—"}
                      </td>

                      {/* Part. % */}
                      <td className="px-3 py-2 text-right text-slate-200">
                        {partStr}
                      </td>

                      {/* DY (12m) = soma dos DY Jan–Dez (R$) */}
                      <td className="px-3 py-2 text-right text-slate-200 font-semibold">
                        {dy12mValor > 0
                          ? dy12mValor.toLocaleString("pt-BR", {
                              style: "currency",
                              currency: "BRL",
                            })
                          : "—"}
                      </td>

                      {/* DY por mês (Jan..Dez) */}
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
