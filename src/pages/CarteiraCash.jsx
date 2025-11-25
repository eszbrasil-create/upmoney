// src/pages/CarteiraCash.jsx
import React, {
  useEffect,
  useMemo,
  useState,
  useRef,
  useLayoutEffect,
} from "react";

const PIE_COLORS = {
  RF: "#22c55e",
  ACOES: "#0ea5e9",
  FII: "#fbbf24",
};

const MESES = [
  "Jan","Fev","Mar","Abr","Mai","Jun",
  "Jul","Ago","Set","Out","Nov","Dez"
];

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
const LS_KEY_LANC = "cc_carteira_cash_lancamentos_v1";

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

// helper para criar lançamento vazio
function createEmptyLancamento(id) {
  return {
    id,
    dataEntrada: "",
    ticker: "",
    tipo: "ACOES",
    quantidade: "",
    preco: "",
  };
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

  // ✅ lançamentos (planilha simples tipo Excel)
  const [lancamentos, setLancamentos] = useState(() => {
    try {
      const raw = localStorage.getItem(LS_KEY_LANC);
      if (!raw) return [createEmptyLancamento(1)];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed) || parsed.length === 0) {
        return [createEmptyLancamento(1)];
      }
      return parsed.map((l, idx) => ({
        id: l.id ?? idx + 1,
        dataEntrada: l.dataEntrada ?? "",
        ticker: l.ticker ?? "",
        tipo: l.tipo ?? "ACOES",
        quantidade: l.quantidade ?? "",
        preco: l.preco ?? "",
      }));
    } catch {
      return [createEmptyLancamento(1)];
    }
  });

  // exibir/ocultar quadro de lançamentos
  const [showLancamentos, setShowLancamentos] = useState(false);

  // Persiste alterações
  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(carteira));
    } catch {}
  }, [carteira]);

  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY_LANC, JSON.stringify(lancamentos));
    } catch {}
  }, [lancamentos]);

  const updateRow = (id, patch) => {
    setCarteira((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...patch } : r))
    );
  };

  const updateLancamento = (id, patch) => {
    setLancamentos((prev) =>
      prev.map((l) => (l.id === id ? { ...l, ...patch } : l))
    );
  };

  const addLancamento = () => {
    setLancamentos((prev) => {
      const nextId =
        prev.reduce((max, l) => Math.max(max, l.id || 0), 0) + 1;
      return [...prev, createEmptyLancamento(nextId)];
    });
  };

  const removeLancamento = (id) => {
    setLancamentos((prev) => {
      if (prev.length === 1) {
        const only = prev[0];
        if (only.id !== id) return prev;
        return [createEmptyLancamento(only.id)];
      }
      return prev.filter((l) => l.id !== id);
    });
  };

  // ✅ Cálculos globais (2 donuts + DY)
  const {
    totalGeral,
    piePartsAtivos,
    piePartsTipos,
    dyBarData,
  } = useMemo(() => {
    let total = 0;

    const somaPorAtivo = {};
    const somaPorTipo = { RF: 0, ACOES: 0, FII: 0 };
    const dyMesTotal = Array(12).fill(0);

    carteira.forEach((r) => {
      const qtd = toNum(r.qtd);
      const entrada = toNum(r.entrada);
      const valorAtual = toNum(r.valorAtual) || entrada;
      const valorPosicao = qtd * valorAtual;

      total += valorPosicao;

      // por ativo
      const ativoKey = (r.ticker || r.nome || "Ativo").toUpperCase();
      if (!somaPorAtivo[ativoKey]) somaPorAtivo[ativoKey] = 0;
      somaPorAtivo[ativoKey] += valorPosicao;

      // por tipo
      const tipoKey = r.tipo;
      if (!somaPorTipo[tipoKey]) somaPorTipo[tipoKey] = 0;
      somaPorTipo[tipoKey] += valorPosicao;

      // DY mensal total
      const arrMeses = Array.isArray(r.dyMeses) ? r.dyMeses : [];
      for (let i = 0; i < 12; i++) {
        dyMesTotal[i] += toNum(arrMeses[i]);
      }
    });

    // ==== donut por ATIVO ====
    const ativosRaw = Object.entries(somaPorAtivo)
      .map(([key, value]) => ({ key, name: key, value }))
      .filter((d) => d.value > 0)
      .sort((a, b) => b.value - a.value);

    const getColor = (i) => {
      const hue = (i * 47) % 360;
      return `hsl(${hue} 70% 55%)`;
    };

    const piePartsAtivos = ativosRaw.map((p, i) => ({
      ...p,
      color: getColor(i),
      pct: total > 0 ? (p.value / total) * 100 : 0,
    }));

    // ==== donut por TIPO ====
    const tiposRaw = [
      { key: "RF", name: "RF", value: somaPorTipo.RF, color: PIE_COLORS.RF },
      { key: "ACOES", name: "Ações", value: somaPorTipo.ACOES, color: PIE_COLORS.ACOES },
      { key: "FII", name: "FIIs", value: somaPorTipo.FII, color: PIE_COLORS.FII },
    ].filter((d) => d.value > 0);

    const piePartsTipos = tiposRaw.map((p) => ({
      ...p,
      pct: total > 0 ? (p.value / total) * 100 : 0,
    }));

    const dyBarData = MESES.map((m, idx) => ({
      name: m,
      dy: dyMesTotal[idx],
    }));

    return { totalGeral: total, piePartsAtivos, piePartsTipos, dyBarData };
  }, [carteira]);

  /* ===========================
     Donut por ATIVO (sem legenda)
  =========================== */
  const [activeIdxAtivo, setActiveIdxAtivo] = useState(null);
  const [hoverIdxAtivo, setHoverIdxAtivo] = useState(null);
  const idxShownAtivo = hoverIdxAtivo ?? activeIdxAtivo;

  /* ===========================
     Donut por TIPO (sem legenda)
  =========================== */
  const [activeIdxTipo, setActiveIdxTipo] = useState(null);
  const [hoverIdxTipo, setHoverIdxTipo] = useState(null);
  const idxShownTipo = hoverIdxTipo ?? activeIdxTipo;

  // donuts compactos
  const size = 180;
  const cx = size / 2;
  const cy = size / 2;
  const rOuter = 78;
  const rInner = 48;

  const anglesAtivo = useMemo(() => {
    let acc = 0;
    return piePartsAtivos.map((p) => {
      const start = acc;
      const end = acc + (p.pct / 100) * 360;
      acc = end;
      return { start, end };
    });
  }, [piePartsAtivos]);

  const anglesTipo = useMemo(() => {
    let acc = 0;
    return piePartsTipos.map((p) => {
      const start = acc;
      const end = acc + (p.pct / 100) * 360;
      acc = end;
      return { start, end };
    });
  }, [piePartsTipos]);

  const centerAtivo = useMemo(() => {
    if (
      idxShownAtivo == null ||
      idxShownAtivo < 0 ||
      idxShownAtivo >= piePartsAtivos.length ||
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
    const it = piePartsAtivos[idxShownAtivo];
    return {
      title: it.name,
      line1: it.value.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
        maximumFractionDigits: 0,
      }),
      line2: `${it.pct.toFixed(1)}%`,
    };
  }, [idxShownAtivo, piePartsAtivos, totalGeral]);

  const centerTipo = useMemo(() => {
    if (
      idxShownTipo == null ||
      idxShownTipo < 0 ||
      idxShownTipo >= piePartsTipos.length ||
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
    const it = piePartsTipos[idxShownTipo];
    return {
      title: it.name,
      line1: it.value.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
        maximumFractionDigits: 0,
      }),
      line2: `${it.pct.toFixed(1)}%`,
    };
  }, [idxShownTipo, piePartsTipos, totalGeral]);

  /* ===========================
     DY mensal total — estilo CardDividendos
  =========================== */
  const dyTotals = dyBarData.map((d) => d.dy || 0);
  const dyMax = Math.max(1, ...dyTotals);

  // animação
  const [animateDy, setAnimateDy] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setAnimateDy(true), 50);
    return () => clearTimeout(t);
  }, []);

  // tooltip premium
  const [dyTip, setDyTip] = useState(null);

  const TooltipDy = ({ x, y, mes, valor }) => (
    <div
      className="fixed z-[9999] pointer-events-none"
      style={{ left: x, top: y }}
    >
      <div className="rounded-xl bg-slate-950/95 border border-white/10 px-3 py-2 shadow-2xl">
        <div className="text-[11px] text-slate-300 font-medium">
          {mes}
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

  // calcula altura máxima real usando o tamanho do chart
  const dyChartRef = useRef(null);
  const [dyBarMaxHeight, setDyBarMaxHeight] = useState(110);

  useLayoutEffect(() => {
    if (!dyChartRef.current) return;
    const el = dyChartRef.current;

    const compute = () => {
      const h = el.clientHeight || 0;
      const reservedForLabels = 44; // labels dos meses
      const topGap = 16;
      const usable = Math.max(60, h - reservedForLabels - topGap);
      setDyBarMaxHeight(usable);
    };

    compute();
    const ro = new ResizeObserver(compute);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // (futuro) handler para clicar nos modelos
  const handleModeloClick = (tipo) => {
    console.log("Modelo selecionado:", tipo);
  };

  return (
    <div className="pt-0 pr-3 pl-0 relative">
      {/* FAIXA FIXA COM BALÃO EXPANSÍVEL */}
      <div className="mb-2">
        <div className="fixed left-48 right-6 top-3 z-30">
          <div className="rounded-2xl bg-gradient-to-r from-emerald-500 via-sky-500 to-fuchsia-500 p-[1px] shadow-xl">
            <div
              className={`
                w-full rounded-2xl bg-slate-950/95 px-3 pt-2 pb-2
                flex flex-col gap-2
                transition-all duration-300
                ${openCarteiras ? "pb-3" : ""}
              `}
            >
              {/* Cabeçalho clicável */}
              <button
                type="button"
                onClick={() => setOpenCarteiras((prev) => !prev)}
                className="w-full flex items-center justify-between hover:bg-slate-900/95 rounded-xl px-2 py-1 transition"
                title="Sugestões de carteiras modelo"
              >
                <div className="flex items-center gap-2 text-left">
                  <div className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(34,197,94,0.6)]" />
                  <div className="flex flex-col">
                    <span className="text-[12px] sm:text-[13px] font-semibold text-slate-100">
                      Carteiras Modelo UpMoney
                    </span>
                    <span className="hidden sm:block text-[11px] text-slate-400">
                      Clique para ver sugestões de carteiras temáticas
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Pill Ver modelos em laranja, com animação */}
                  <span
                    className="
                      text-[11px] font-semibold
                      px-2 py-1 rounded-lg
                      bg-amber-400 text-slate-950
                      shadow-sm
                      animate-pulse
                    "
                  >
                    {openCarteiras ? "Escolher agora" : "Ver modelos"}
                  </span>
                  <span className="text-xs text-slate-200">
                    {openCarteiras ? "▲" : "▼"}
                  </span>
                </div>
              </button>

              {/* Conteúdo expandido: sugestões de carteiras */}
              {openCarteiras && (
                <div
                  className="
                    mt-1 grid grid-cols-1 sm:grid-cols-3 gap-2
                    text-[12px]
                  "
                >
                  {/* CTA principal: Dividendos */}
                  <button
                    type="button"
                    onClick={() => handleModeloClick("dividendos")}
                    className="
                      rounded-xl px-3 py-3 text-left
                      bg-gradient-to-br from-emerald-400 via-emerald-500 to-emerald-600
                      shadow-lg shadow-emerald-500/30
                      hover:brightness-110 hover:shadow-emerald-400/40
                      transition
                    "
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-semibold text-slate-950 text-[13px]">
                        Carteira de Dividendos
                      </div>
                      <span className="text-[10px] font-bold uppercase bg-emerald-900/20 text-emerald-50 px-2 py-0.5 rounded-full">
                        Mais indicada
                      </span>
                    </div>
                    <div className="text-[11px] text-emerald-50/90 mt-1.5">
                      Foco em renda recorrente com empresas e FIIs pagadores.
                    </div>
                  </button>

                  {/* CTA Criptomoedas */}
                  <button
                    type="button"
                    onClick={() => handleModeloClick("cripto")}
                    className="
                      rounded-xl px-3 py-3 text-left
                      bg-gradient-to-br from-violet-500 via-fuchsia-500 to-sky-500
                      shadow-lg shadow-fuchsia-500/30
                      hover:brightness-110 hover:shadow-fuchsia-400/40
                      transition
                    "
                  >
                    <div className="font-semibold text-white text-[13px]">
                      Carteira de Criptomoedas
                    </div>
                    <div className="text-[11px] text-white/90 mt-1.5">
                      Exposição a ativos digitais com visão de longo prazo.
                    </div>
                  </button>

                  {/* CTA FIIs */}
                  <button
                    type="button"
                    onClick={() => handleModeloClick("fiis")}
                    className="
                      rounded-xl px-3 py-3 text-left
                      bg-gradient-to-br from-amber-300 via-amber-500 to-orange-500
                      shadow-lg shadow-amber-500/30
                      hover:brightness-110 hover:shadow-amber-400/40
                      transition
                    "
                  >
                    <div className="font-semibold text-slate-950 text-[13px]">
                      Carteira de Fundos Imobiliários
                    </div>
                    <div className="text-[11px] text-slate-950/80 mt-1.5">
                      Renda mensal com fundos de tijolo e papel.
                    </div>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Espaço para não sobrepor o conteúdo do dashboard */}
        <div className="h-24" />
      </div>

      {/* BALÃO: 2 donuts + 1 barra */}
      <div className="rounded-xl bg-slate-800/70 border border-white/10 shadow-lg p-4 mb-4">
        {totalGeral <= 0 ? (
          <p className="text-[11px] text-slate-500">
            Preencha <strong>Quantidade</strong>, <strong>Entrada</strong>,{" "}
            <strong>Valor atual</strong> e os <strong>DY por mês</strong> na
            tabela para visualizar os gráficos.
          </p>
        ) : (
          <div className="grid gap-4 md:grid-cols-4 items-stretch">

            {/* Donut 1: por ATIVO (sem legenda) */}
            <div className="md:col-span-1">
              <div className="h-full rounded-lg bg-slate-900/70 border border-slate-700/70 p-3 flex flex-col">
                <div className="text-slate-100 text-sm font-semibold mb-2">
                  Participação por ativo
                </div>

                <div className="flex-1 flex items-center justify-center">
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

                      {piePartsAtivos.map((p, i) => {
                        const { start, end } = anglesAtivo[i];
                        const d = arcPath(cx, cy, rOuter, rInner, start, end);
                        const selected = i === idxShownAtivo;

                        return (
                          <path
                            key={p.key}
                            d={d}
                            fill={p.color}
                            fillOpacity={selected ? 1 : 0.85}
                            className={`transition-all duration-150 cursor-pointer ${
                              selected
                                ? "drop-shadow-[0_0_8px_rgba(34,197,94,0.5)]"
                                : ""
                            }`}
                            onMouseEnter={() => setHoverIdxAtivo(i)}
                            onMouseLeave={() => setHoverIdxAtivo(null)}
                            onClick={() =>
                              setActiveIdxAtivo((prev) => (prev === i ? null : i))
                            }
                          />
                        );
                      })}

                      {idxShownAtivo != null && (
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
                          {centerAtivo.title}
                        </div>
                        <div className="text-slate-100 text-lg font-extrabold">
                          {centerAtivo.line1}
                        </div>
                        {centerAtivo.line2 ? (
                          <div className="text-slate-300 text-sm mt-0.5">
                            {centerAtivo.line2}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Donut 2: por TIPO (sem legenda) */}
            <div className="md:col-span-1">
              <div className="h-full rounded-lg bg-slate-900/70 border border-slate-700/70 p-3 flex flex-col">
                <div className="text-slate-100 text-sm font-semibold mb-2">
                  Participação por tipo
                </div>

                <div className="flex-1 flex items-center justify-center">
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

                      {piePartsTipos.map((p, i) => {
                        const { start, end } = anglesTipo[i];
                        const d = arcPath(cx, cy, rOuter, rInner, start, end);
                        const selected = i === idxShownTipo;

                        return (
                          <path
                            key={p.key}
                            d={d}
                            fill={p.color}
                            fillOpacity={selected ? 1 : 0.85}
                            className={`transition-all duration-150 cursor-pointer ${
                              selected
                                ? "drop-shadow-[0_0_8px_rgba(56,189,248,0.5)]"
                                : ""
                            }`}
                            onMouseEnter={() => setHoverIdxTipo(i)}
                            onMouseLeave={() => setHoverIdxTipo(null)}
                            onClick={() =>
                              setActiveIdxTipo((prev) => (prev === i ? null : i))
                            }
                          />
                        );
                      })}

                      {idxShownTipo != null && (
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
                          {centerTipo.title}
                        </div>
                        <div className="text-slate-100 text-lg font-extrabold">
                          {centerTipo.line1}
                        </div>
                        {centerTipo.line2 ? (
                          <div className="text-slate-300 text-sm mt-0.5">
                            {centerTipo.line2}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Barras DY */}
            <div className="md:col-span-2">
              <div className="h-full rounded-lg bg-slate-900/70 border border-slate-700/70 p-3 flex flex-col relative">
                <div className="text-slate-100 text-sm font-semibold mb-2">
                  DY mensal total
                </div>

                <div
                  ref={dyChartRef}
                  className="
                    flex-1 min-h-0 rounded-2xl border border-white/10
                    bg-slate-900/80 p-3 pt-2
                    overflow-x-auto overflow-y-hidden
                  "
                >
                  <div className="flex items-end gap-1 min-w-max h-full">
                    {dyBarData.map((d, i) => {
                      const v = d.dy || 0;

                      const alturaReal = Math.max(
                        4,
                        Math.round((v / dyMax) * dyBarMaxHeight)
                      );
                      const altura = animateDy ? alturaReal : 4;

                      return (
                        <div key={i} className="flex flex-col items-center gap-2 w-10">
                          <div
                            className="
                              w-full rounded-xl
                              bg-emerald-500/90
                              hover:bg-emerald-400
                              transition-all duration-700 ease-out
                              hover:shadow-[0_0_12px_rgba(16,185,129,0.55)]
                            "
                            style={{ height: `${altura}px` }}
                            onMouseEnter={(e) => {
                              const rect = e.currentTarget.getBoundingClientRect();
                              setDyTip({
                                x: rect.left + rect.width / 2,
                                y: rect.top - 8,
                                mes: d.name,
                                valor: v,
                              });
                            }}
                            onMouseMove={(e) => {
                              setDyTip((prev) =>
                                prev
                                  ? { ...prev, x: e.clientX, y: e.clientY - 12 }
                                  : prev
                              );
                            }}
                            onMouseLeave={() => setDyTip(null)}
                          />

                          <div
                            className="text-[12px] text-slate-300 text-center leading-tight whitespace-nowrap font-medium"
                            style={{ textShadow: "0 1px 6px rgba(0,0,0,0.6)" }}
                          >
                            {d.name}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {dyTip && (
                  <TooltipDy
                    x={dyTip.x}
                    y={dyTip.y}
                    mes={dyTip.mes}
                    valor={dyTip.valor}
                  />
                )}
              </div>
            </div>

          </div>
        )}
      </div>

      {/* ======= Bloco inferior: Lançamentos + Tabela de carteira ======= */}
      <div className="rounded-xl bg-slate-800/70 border border-white/10 shadow-lg p-4">
        {/* Header: botão para abrir lançamentos */}
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-slate-200 text-sm font-medium">
            Lançamentos de ativos
          </h2>
          <button
            type="button"
            onClick={() => setShowLancamentos((v) => !v)}
            className="
              inline-flex items-center gap-1
              rounded-lg border border-emerald-400/60 bg-emerald-500/10
              px-3 py-1.5 text-[12px] font-semibold
              text-emerald-100 hover:bg-emerald-500/20 transition
            "
          >
            {showLancamentos ? "Fechar lançamentos" : "Adicionar ativos"}
          </button>
        </div>

        {/* Quadro de lançamentos (tipo Excel) */}
        {showLancamentos && (
          <div className="mb-4 rounded-xl border border-white/10 bg-slate-900/60 p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[12px] text-slate-200 font-medium">
                Base de operações (compras ao longo do tempo)
              </span>
              <button
                type="button"
                onClick={addLancamento}
                className="
                  text-[11px] px-2 py-1 rounded-lg
                  border border-slate-500 bg-slate-800
                  text-slate-100 hover:bg-slate-700 transition
                "
              >
                + Nova linha
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-[720px] w-full text-xs">
                <thead className="text-slate-300">
                  <tr className="border-b border-slate-700/70">
                    <th className="px-2 py-1 text-left font-medium w-32">
                      Data entrada
                    </th>
                    <th className="px-2 py-1 text-left font-medium w-28">
                      Ticker
                    </th>
                    <th className="px-2 py-1 text-left font-medium w-28">
                      Tipo
                    </th>
                    <th className="px-2 py-1 text-right font-medium w-24">
                      Quantidade
                    </th>
                    <th className="px-2 py-1 text-right font-medium w-28">
                      Preço (R$)
                    </th>
                    <th className="px-2 py-1 text-right font-medium w-32">
                      Custo total (R$)
                    </th>
                    <th className="px-2 py-1 text-center font-medium w-10">
                      {/* lixeira */}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {lancamentos.map((l) => {
                    const qtdNum = toNum(l.quantidade);
                    const precoNum = toNum(l.preco);
                    const custo = qtdNum * precoNum;

                    return (
                      <tr
                        key={l.id}
                        className="border-b border-slate-800/60 hover:bg-slate-800/40"
                      >
                        <td className="px-2 py-1">
                          <input
                            type="date"
                            className="
                              w-full bg-slate-900 border border-slate-700
                              rounded-md px-2 py-1
                              text-[11px] text-slate-100
                              focus:outline-none focus:ring-1 focus:ring-emerald-400
                            "
                            value={l.dataEntrada}
                            onChange={(e) =>
                              updateLancamento(l.id, {
                                dataEntrada: e.target.value,
                              })
                            }
                          />
                        </td>

                        <td className="px-2 py-1">
                          <input
                            className="
                              w-full bg-transparent outline-none
                              text-slate-100 placeholder:text-slate-600
                              text-[12px]
                            "
                            placeholder="VALE3"
                            value={l.ticker}
                            onChange={(e) =>
                              updateLancamento(l.id, {
                                ticker: e.target.value.toUpperCase(),
                              })
                            }
                          />
                        </td>

                        <td className="px-2 py-1">
                          <select
                            className="
                              w-full bg-slate-900 border border-slate-700
                              rounded-md px-2 py-1
                              text-[11px] text-slate-100
                              focus:outline-none focus:ring-1 focus:ring-emerald-400
                            "
                            value={l.tipo}
                            onChange={(e) =>
                              updateLancamento(l.id, { tipo: e.target.value })
                            }
                          >
                            <option value="RF">RF</option>
                            <option value="ACOES">Ações</option>
                            <option value="FII">FII</option>
                          </select>
                        </td>

                        <td className="px-2 py-1 text-right">
                          <input
                            className="
                              w-full bg-transparent text-right outline-none
                              text-slate-100 placeholder:text-slate-600
                              text-[12px]
                            "
                            inputMode="decimal"
                            placeholder="0"
                            value={l.quantidade}
                            onChange={(e) =>
                              updateLancamento(l.id, {
                                quantidade: e.target.value,
                              })
                            }
                            onBlur={(e) => {
                              const n = toNum(e.target.value);
                              updateLancamento(l.id, {
                                quantidade: n === 0 ? "" : String(n),
                              });
                            }}
                          />
                        </td>

                        <td className="px-2 py-1 text-right">
                          <input
                            className="
                              w-full bg-transparent text-right outline-none
                              text-slate-100 placeholder:text-slate-600
                              text-[12px]
                            "
                            inputMode="decimal"
                            placeholder="0,00"
                            value={l.preco}
                            onChange={(e) =>
                              updateLancamento(l.id, {
                                preco: e.target.value,
                              })
                            }
                            onBlur={(e) => {
                              const n = toNum(e.target.value);
                              updateLancamento(l.id, {
                                preco: n === 0 ? "" : String(n),
                              });
                            }}
                          />
                        </td>

                        <td className="px-2 py-1 text-right text-slate-100">
                          {custo > 0
                            ? custo.toLocaleString("pt-BR", {
                                style: "currency",
                                currency: "BRL",
                              })
                            : "—"}
                        </td>

                        <td className="px-2 py-1 text-center">
                          <button
                            type="button"
                            onClick={() => removeLancamento(l.id)}
                            className="
                              inline-flex items-center justify-center
                              h-7 w-7 rounded-full
                              bg-slate-800 text-slate-300
                              hover:bg-rose-600 hover:text-white
                              transition
                            "
                            title="Excluir linha"
                          >
                            🗑️
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="mt-3 flex justify-end">
              <button
                type="button"
                onClick={() => setShowLancamentos(false)}
                className="
                  text-[12px] px-3 py-1.5 rounded-lg
                  border border-slate-500 bg-slate-800
                  text-slate-100 hover:bg-slate-700 transition
                "
              >
                Concluir
              </button>
            </div>
          </div>
        )}

        {/* Título e legenda da tabela de carteira */}
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-slate-200 text-sm font-medium">
            Detalhamento da carteira modelo
          </h2>
          <span className="text-[11px] text-slate-400">
            Edite tipo, setor, data de entrada, quantidade, entrada, valor atual e todos os DYs.
          </span>
        </div>

        {/* Tabela de ativos (inalterada) */}
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
