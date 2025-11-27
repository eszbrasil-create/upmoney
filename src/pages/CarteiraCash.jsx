// src/pages/CarteiraCash.jsx
import React, {
  useEffect,
  useMemo,
  useState,
  useRef,
  useLayoutEffect,
} from "react";
import ModalLancamentos from "../modules/carteiraCash/ModalLancamentos.jsx";
import { useDyBase } from "../utils/dyBase";

const PIE_COLORS = {
  RF: "#22c55e",
  ACOES: "#0ea5e9",
  FII: "#fbbf24",
};

// Mapa fixo de meses em PT-BR
const PT_MESES = [
  "Jan",
  "Fev",
  "Mar",
  "Abr",
  "Mai",
  "Jun",
  "Jul",
  "Ago",
  "Set",
  "Out",
  "Nov",
  "Dez",
];

// 24 meses começando em Dez/2025
const DY_MONTHS = (() => {
  const result = [];
  let year = 2025;
  let month = 11; // 0=Jan, 11=Dez

  for (let i = 0; i < 24; i++) {
    const label = `${PT_MESES[month]} ${year}`;
    result.push({ label, month, year });

    month++;
    if (month > 11) {
      month = 0;
      year++;
    }
  }
  return result;
})();

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
    dyMeses: Array(DY_MONTHS.length).fill(""),
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
    dyMeses: Array(DY_MONTHS.length).fill(""),
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
    dyMeses: Array(DY_MONTHS.length).fill(""),
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
    dyMeses: Array(DY_MONTHS.length).fill(""),
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
    dyMeses: Array(DY_MONTHS.length).fill(""),
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
    dyMeses: Array(DY_MONTHS.length).fill(""),
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
    dyMeses: Array(DY_MONTHS.length).fill(""),
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
    dyMeses: Array(DY_MONTHS.length).fill(""),
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
    dyMeses: Array(DY_MONTHS.length).fill(""),
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
    dyMeses: Array(DY_MONTHS.length).fill(""),
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
    dyMeses: Array(DY_MONTHS.length).fill(""),
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
    dyMeses: Array(DY_MONTHS.length).fill(""),
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
    dyMeses: Array(DY_MONTHS.length).fill(""),
  },
];

const LS_KEY = "cc_carteira_cash_v1";
const LS_KEY_LANC = "cc_carteira_cash_lanc_v1";

// Helper para converter texto em número
function toNum(x) {
  if (x === "" || x === null || x === undefined) return 0;
  const n = Number(String(x).replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

// Helper para formatar data BR
function formatDateBR(iso) {
  if (!iso) return "—";
  const parts = iso.split("-");
  if (parts.length !== 3) return iso;
  const [y, m, d] = parts;
  return `${d}/${m}/${y}`;
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
  // 🔗 Lê a base de DY do GitHub
  const { dyBase, dyBaseLoading, dyBaseError } = useDyBase();

  // 👀 Log para debug
  useEffect(() => {
    console.log("Base DY carregada:", { dyBase, dyBaseLoading, dyBaseError });
  }, [dyBase, dyBaseLoading, dyBaseError]);

  // ✅ base escondida de lançamentos
  const [lancamentos, setLancamentos] = useState(() => {
    try {
      const raw = localStorage.getItem(LS_KEY_LANC);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  // Estado da carteira (tabela visível / agregada)
  const [carteira, setCarteira] = useState(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      const parsed = raw ? JSON.parse(raw) : BASE_ROWS;
      return parsed.map((r) => ({
        ...r,
        dataEntrada: r.dataEntrada ?? "",
        dyMeses: Array.isArray(r.dyMeses)
          ? [
              ...r.dyMeses,
              ...Array(DY_MONTHS.length - r.dyMeses.length).fill(""),
            ].slice(0, DY_MONTHS.length)
          : Array(DY_MONTHS.length).fill(""),
      }));
    } catch {
      return BASE_ROWS;
    }
  });

  // Balão "Sugestões UpMoney"
  const [openCarteiras, setOpenCarteiras] = useState(false);

  // Modal "Adicionar ativos"
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [novoLanc, setNovoLanc] = useState({
    ticker: "",
    tipo: "ACOES",
    dataEntrada: "",
    qtd: "",
    preco: "",
  });

  // Focar automaticamente no campo Ticker ao abrir o modal
  useEffect(() => {
    if (!isAddModalOpen) return;
    const t = setTimeout(() => {
      const el = document.querySelector('input[name="ticker"]');
      if (el) el.focus();
    }, 80);
    return () => clearTimeout(t);
  }, [isAddModalOpen]);

  // Ordenação da tabela principal
  const [sortConfig, setSortConfig] = useState({
    key: null, // "posicao" | "var" | "part" | "data"
    direction: "desc", // "asc" | "desc"
  });

  const handleSort = (key) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        return {
          key,
          direction: prev.direction === "asc" ? "desc" : "asc",
        };
      }
      return { key, direction: "desc" };
    });
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return "↕";
    return sortConfig.direction === "asc" ? "▲" : "▼";
  };

  // Persiste carteira (tabela visível)
  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(carteira));
    } catch {}
  }, [carteira]);

  // Persiste base de lançamentos
  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY_LANC, JSON.stringify(lancamentos));
    } catch {}
  }, [lancamentos]);

  // Sempre que a base escondida muda, recalcula a tabela agregada
  useEffect(() => {
    if (!lancamentos || lancamentos.length === 0) return;

    setCarteira((prevCarteira) => {
      const dyPorTicker = new Map();
      prevCarteira.forEach((r) => {
        const t = (r.ticker || "").toUpperCase();
        if (!t) return;
        dyPorTicker.set(t, {
          dyMeses: r.dyMeses || Array(DY_MONTHS.length).fill(""),
          dy: r.dy ?? "",
        });
      });

      const grupos = new Map(); // key = `${ticker}__${tipo}`

      lancamentos.forEach((l) => {
        const ticker = (l.ticker || "").toUpperCase();
        if (!ticker) return;
        const tipo = l.tipo || "ACOES";
        const key = `${ticker}__${tipo}`;

        const qtd = toNum(l.qtd);
        const preco = toNum(l.preco);
        const valor = qtd * preco;
        const data = l.dataEntrada || "";

        const atual = grupos.get(key) || {
          ticker,
          tipo,
          nome: "",
          somaQtd: 0,
          somaValor: 0,
          dataEntradaMaisAntiga: data || "",
        };

        atual.somaQtd += qtd;
        atual.somaValor += valor;

        if (!atual.dataEntradaMaisAntiga) {
          atual.dataEntradaMaisAntiga = data;
        } else if (data && data < atual.dataEntradaMaisAntiga) {
          atual.dataEntradaMaisAntiga = data;
        }

        grupos.set(key, atual);
      });

      const novasLinhas = Array.from(grupos.values()).map((g, idx) => {
        const precoMedio = g.somaQtd > 0 ? g.somaValor / g.somaQtd : 0;
        const t = g.ticker;
        const prevDy = dyPorTicker.get(t) || {};

        return {
          id: idx + 1,
          ticker: t,
          tipo: g.tipo,
          nome: g.nome || "",
          dataEntrada: g.dataEntradaMaisAntiga || "",
          qtd: g.somaQtd ? String(g.somaQtd) : "",
          entrada: precoMedio ? String(precoMedio.toFixed(2)) : "",
          valorAtual: precoMedio ? String(precoMedio.toFixed(2)) : "",
          dyMeses: prevDy.dyMeses || Array(DY_MONTHS.length).fill(""),
          dy: prevDy.dy || "",
        };
      });

      return novasLinhas;
    });
  }, [lancamentos]);

  // Integra DY + setor + valorAtual a partir do CSV (dyBase)
  // Também roda quando os lançamentos mudam
  useEffect(() => {
    if (dyBaseLoading || dyBaseError) return;
    if (!dyBase || dyBase.length === 0) return;

    setCarteira((prev) =>
      prev.map((row) => {
        const t = (row.ticker || "").toUpperCase();
        if (!t) return row;

        const fromCsv = dyBase.find((item) => item.ticker === t);
        if (!fromCsv) return row;

        const dyMesesCsvRaw = Array.isArray(fromCsv.dyMeses)
          ? [
              ...fromCsv.dyMeses,
              ...Array(DY_MONTHS.length - fromCsv.dyMeses.length).fill(0),
            ].slice(0, DY_MONTHS.length)
          : Array(DY_MONTHS.length).fill(0);

        const dyMesesCsv = dyMesesCsvRaw;

        return {
          ...row,
          nome: fromCsv.setor || fromCsv.nome || row.nome,
          valorAtual:
            fromCsv.valorAtual != null && fromCsv.valorAtual !== 0
              ? String(fromCsv.valorAtual)
              : row.valorAtual,
          dyMeses: dyMesesCsv,
        };
      })
    );
  }, [dyBase, dyBaseLoading, dyBaseError, lancamentos]);

  // Atualiza apenas campos editáveis da carteira (DYs)
  const updateRow = (id, patch) => {
    setCarteira((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...patch } : r))
    );
  };

  /* ===========================
     Cálculos globais (2 donuts + DY)
  =========================== */
  const { totalGeral, piePartsAtivos, piePartsTipos, dyBarData } = useMemo(() => {
    let total = 0;

    const somaPorAtivo = {};
    const somaPorTipo = { RF: 0, ACOES: 0, FII: 0 };
    const dyMesTotal = Array(DY_MONTHS.length).fill(0);

    carteira.forEach((r) => {
      const qtd = toNum(r.qtd);
      const entrada = toNum(r.entrada);
      const valorAtual = toNum(r.valorAtual) || entrada;
      const valorPosicao = qtd * valorAtual;

      total += valorPosicao;

      const ativoKey = (r.ticker || r.nome || "Ativo").toUpperCase();
      if (!somaPorAtivo[ativoKey]) somaPorAtivo[ativoKey] = 0;
      somaPorAtivo[ativoKey] += valorPosicao;

      const tipoKey = r.tipo;
      if (!somaPorTipo[tipoKey]) somaPorTipo[tipoKey] = 0;
      somaPorTipo[tipoKey] += valorPosicao;

      const arrMeses = Array.isArray(r.dyMeses) ? r.dyMeses : [];
      for (let i = 0; i < DY_MONTHS.length; i++) {
        dyMesTotal[i] += toNum(arrMeses[i]);
      }
    });

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

    const tiposRaw = [
      { key: "RF", name: "RF", value: somaPorTipo.RF, color: PIE_COLORS.RF },
      {
        key: "ACOES",
        name: "Ações",
        value: somaPorTipo.ACOES,
        color: PIE_COLORS.ACOES,
      },
      { key: "FII", name: "FIIs", value: somaPorTipo.FII, color: PIE_COLORS.FII },
    ].filter((d) => d.value > 0);

    const piePartsTipos = tiposRaw.map((p) => ({
      ...p,
      pct: total > 0 ? (p.value / total) * 100 : 0,
    }));

    const dyBarData = DY_MONTHS.map((m, idx) => ({
      name: m.label,
      dy: dyMesTotal[idx],
    }));

    return { totalGeral: total, piePartsAtivos, piePartsTipos, dyBarData };
  }, [carteira]);

  /* ===========================
     Donuts (sem legenda)
  =========================== */
  const [activeIdxAtivo, setActiveIdxAtivo] = useState(null);
  const [hoverIdxAtivo, setHoverIdxAtivo] = useState(null);
  const idxShownAtivo = hoverIdxAtivo ?? activeIdxAtivo;

  const [activeIdxTipo, setActiveIdxTipo] = useState(null);
  const [hoverIdxTipo, setHoverIdxTipo] = useState(null);
  const idxShownTipo = hoverIdxTipo ?? activeIdxTipo;

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
     DY mensal total — 24 meses
  =========================== */
  const dyTotals = dyBarData.map((d) => d.dy || 0);
  const dyMax = Math.max(1, ...dyTotals);

  const [animateDy, setAnimateDy] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setAnimateDy(true), 50);
    return () => clearTimeout(t);
  }, []);

  const [dyTip, setDyTip] = useState(null);

  const TooltipDy = ({ x, y, mes, valor }) => (
    <div
      className="fixed z-[9999] pointer-events-none"
      style={{ left: x, top: y }}
    >
      <div className="rounded-xl bg-slate-950/95 border border-white/10 px-3 py-2 shadow-2xl">
        <div className="text-[11px] text-slate-300 font-medium">{mes}</div>
        <div className="text-sm text-slate-100 font-semibold">
          {valor.toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL",
          })}
        </div>
      </div>
    </div>
  );

  const dyChartRef = useRef(null);
  const [dyBarMaxHeight, setDyBarMaxHeight] = useState(110);

  useLayoutEffect(() => {
    if (!dyChartRef.current) return;
    const el = dyChartRef.current;

    const compute = () => {
      const h = el.clientHeight || 0;
      const reservedForLabels = 44;
      const topGap = 16;
      const usable = Math.max(60, h - reservedForLabels - topGap);
      setDyBarMaxHeight(usable);
    };

    compute();
    const ro = new ResizeObserver(compute);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const handleModeloClick = (tipo) => {
    console.log("Modelo selecionado:", tipo);
  };

  // Handlers do modal "Adicionar ativos"
  const handleOpenAdd = () => {
    setNovoLanc({
      ticker: "",
      tipo: "ACOES",
      dataEntrada: "",
      qtd: "",
      preco: "",
    });
    setIsAddModalOpen(true);
  };

  const handleChangeLanc = (e) => {
    const { name, value } = e.target;
    setNovoLanc((prev) => ({ ...prev, [name]: value }));
  };

  const handleSalvarLanc = (e) => {
    e.preventDefault();

    const ticker = (novoLanc.ticker || "").toUpperCase().trim();
    const tipo = novoLanc.tipo || "ACOES";
    const dataEntrada = novoLanc.dataEntrada || "";
    const qtd = novoLanc.qtd || "";
    const preco = novoLanc.preco || "";

    if (!ticker || !qtd || !preco) {
      return;
    }

    const novo = {
      id: Date.now(),
      ticker,
      tipo,
      dataEntrada,
      qtd,
      preco,
    };

    setLancamentos((prev) => [...prev, novo]);

    // mantém o modal aberto e limpa campos principais
    setNovoLanc((prev) => ({
      ...prev,
      ticker: "",
      qtd: "",
      preco: "",
    }));
  };

  // 🔥 Deletar lançamento (usado pelo modal)
  const handleDeleteLanc = (id) => {
    setLancamentos((prev) => prev.filter((l) => l.id !== id));
  };

  // ====== Ordenação da carteira (tabela principal) ======
  const sortedCarteira = useMemo(() => {
    const arr = [...carteira];

    if (!sortConfig.key) return arr;

    return arr.sort((a, b) => {
      const qtdA = toNum(a.qtd);
      const qtdB = toNum(b.qtd);
      const entradaA = toNum(a.entrada);
      const entradaB = toNum(b.entrada);
      const valorAtualA = toNum(a.valorAtual) || entradaA;
      const valorAtualB = toNum(b.valorAtual) || entradaB;

      let valA = 0;
      let valB = 0;

      if (sortConfig.key === "posicao") {
        valA = qtdA * valorAtualA;
        valB = qtdB * valorAtualB;
      } else if (sortConfig.key === "var") {
        const hasA = entradaA > 0 && valorAtualA > 0;
        const hasB = entradaB > 0 && valorAtualB > 0;
        valA = hasA ? (valorAtualA / entradaA - 1) * 100 : -Infinity;
        valB = hasB ? (valorAtualB / entradaB - 1) * 100 : -Infinity;
      } else if (sortConfig.key === "part") {
        const posA = qtdA * (valorAtualA || 0);
        const posB = qtdB * (valorAtualB || 0);
        const partA = totalGeral > 0 ? (posA / totalGeral) * 100 : 0;
        const partB = totalGeral > 0 ? (posB / totalGeral) * 100 : 0;
        valA = partA;
        valB = partB;
      } else if (sortConfig.key === "data") {
        const da = a.dataEntrada || "";
        const db = b.dataEntrada || "";

        // datas vazias sempre no fim
        if (!da && !db) return 0;
        if (!da) return 1;
        if (!db) return -1;
        if (da === db) return 0;

        if (sortConfig.direction === "asc") {
          return da < db ? -1 : 1;
        } else {
          return da > db ? -1 : 1;
        }
      }

      if (sortConfig.key === "data") return 0;

      if (valA === valB) return 0;
      if (sortConfig.direction === "asc") {
        return valA - valB;
      }
      return valB - valA;
    });
  }, [carteira, sortConfig, totalGeral]);

  return (
    <div className="pt-0 pr-3 pl-0 relative">
      {/* FAIXA FIXA COM BALÃO EXPANSÍVEL */}
      <div className="mb-1">
        <div className="fixed left-48 right-3 top-3 z-30">
          <div className="rounded-2xl bg-gradient-to-r from-emerald-500 via-sky-500 to-fuchsia-500 p-[1px] shadow-xl">
            <div
              className={`
                w-full rounded-2xl bg-slate-950/95 px-3 pt-2 pb-2
                flex flex-col gap-2
                transition-all duration-300
                ${openCarteiras ? "pb-3" : ""}
              `}
            >
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
                      Sugestões UpMoney
                    </span>
                    <span className="hidden sm:block text-[11px] text-slate-400">
                      Clique para ver sugestões de carteiras temáticas
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
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

              {openCarteiras && (
                <div className="mt-1 grid grid-cols-1 sm:grid-cols-3 gap-2 text-[12px]">
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

        {/* Espaço para não sobrepor os cards abaixo */}
        <div className="h-20" />
      </div>

      {/* BALÃO: 2 donuts + 1 barra */}
      <div className="rounded-xl bg-slate-800/70 border border-white/10 shadow-lg p-4 mb-3">
        {totalGeral <= 0 ? (
          <p className="text-[11px] text-slate-500">
            Preencha os dados da carteira ou use o botão{" "}
            <strong>Adicionar ativos</strong> para visualizar os gráficos.
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
                    <svg
                      width={size}
                      height={size}
                      viewBox={`0 0 ${size} ${size}`}
                    >
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
                              setActiveIdxAtivo((prev) =>
                                prev === i ? null : i
                              )
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
                    <svg
                      width={size}
                      height={size}
                      viewBox={`0 0 ${size} ${size}`}
                    >
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
                              setActiveIdxTipo((prev) =>
                                prev === i ? null : i
                              )
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
                        <div
                          key={i}
                          className="flex flex-col items-center gap-2 w-10"
                        >
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
                              const rect =
                                e.currentTarget.getBoundingClientRect();
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
                                  ? {
                                      ...prev,
                                      x: e.clientX,
                                      y: e.clientY - 12,
                                    }
                                  : prev
                              );
                            }}
                            onMouseLeave={() => setDyTip(null)}
                          />

                          {/* LABEL: mês em cima, ano embaixo */}
                          <div
                            className="text-[11px] text-slate-300 text-center leading-tight whitespace-nowrap font-medium"
                            style={{ textShadow: "0 1px 6px rgba(0,0,0,0.6)" }}
                          >
                            {d.name.split(" ")[0]}
                            <br />
                            <span className="text-[10px] text-slate-500">
                              {d.name.split(" ")[1]}
                            </span>
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

      {/* ======= Tabela de ativos ======= */}
      <div className="rounded-xl bg-slate-800/70 border border-white/10 shadow-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <button
            type="button"
            onClick={handleOpenAdd}
            className="
              inline-flex items-center gap-2
              rounded-xl bg-emerald-500 px-4 py-2
              text-xs sm:text-sm font-semibold text-slate-950
              hover:bg-emerald-400 transition
            "
          >
            <span className="text-base leading-none">+</span>
            <span>Adicionar ativos</span>
          </button>

          <span className="text-[11px] text-slate-400">
            As colunas principais são preenchidas automaticamente pelos
            lançamentos. Edite apenas os DYs, se desejar (janela de 24 meses a
            partir de Dez/2025).
          </span>
        </div>

        <div className="rounded-xl border border-white/10 bg-slate-900/40 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-[1800px] w-full text-[13px]">
              <thead className="bg-slate-800/70 text-slate-300">
                <tr>
                  <th className="px-2 py-1.5 text-left text-[12px] font-semibold sticky left-0 bg-slate-800/70 z-20 w-8">
                    #
                  </th>

                  {/* Ticker – largura aumentada */}
                  <th className="px-2 py-1.5 text-left text-[12px] font-semibold sticky left-[2rem] bg-slate-800/70 z-20 w-28">
                    Ticker
                  </th>

                  {/* Tipo – largura aumentada + centralizado */}
                  <th className="px-2 py-1.5 text-center text-[12px] font-semibold w-32">
                    Tipo
                  </th>

                  {/* Setor – largura aumentada */}
                  <th className="px-2 py-1.5 text-left text-[12px] font-semibold w-40">
                    Setor
                  </th>

                  {/* Data entrada com ordenação */}
                  <th className="px-2 py-1.5 text-left text-[12px] font-semibold w-32">
                    <button
                      type="button"
                      onClick={() => handleSort("data")}
                      className="inline-flex items-center gap-1"
                    >
                      <span>Data entrada</span>
                      <span className="text-[10px]">
                        {getSortIcon("data")}
                      </span>
                    </button>
                  </th>

                  <th className="px-2 py-1.5 text-center text-[12px] font-semibold w-24">
                    Quantidade
                  </th>

                  {/* Entrada – largura aumentada + alinhada à esquerda */}
                  <th className="px-2 py-1.5 text-left text-[12px] font-semibold w-36">
                    Entrada (R$)
                  </th>

                  {/* Posição – largura aumentada + alinhada à esquerda */}
                  <th className="px-2 py-1.5 text-left text-[12px] font-semibold w-36">
                    <button
                      type="button"
                      onClick={() => handleSort("posicao")}
                      className="inline-flex items-center gap-1"
                    >
                      <span>Posição (R$)</span>
                      <span className="text-[10px]">
                        {getSortIcon("posicao")}
                      </span>
                    </button>
                  </th>

                  {/* % Var – largura aumentada */}
                  <th className="px-2 py-1.5 text-right text-[12px] font-semibold w-28">
                    <button
                      type="button"
                      onClick={() => handleSort("var")}
                      className="inline-flex items-center gap-1"
                    >
                      <span>% Var</span>
                      <span className="text-[10px]">{getSortIcon("var")}</span>
                    </button>
                  </th>

                  {/* Part. % – largura aumentada */}
                  <th className="px-2 py-1.5 text-right text-[12px] font-semibold w-28">
                    <button
                      type="button"
                      onClick={() => handleSort("part")}
                      className="inline-flex items-center gap-1"
                    >
                      <span>Part. %</span>
                      <span className="text-[10px]">
                        {getSortIcon("part")}
                      </span>
                    </button>
                  </th>

                  {/* DY 12m – largura aumentada */}
                  <th className="px-2 py-1.5 text-right text-[12px] font-semibold w-32">
                    DY (12m)
                  </th>

                  {DY_MONTHS.map((m) => (
                    <th
                      key={m.label}
                      className="px-2 py-1.5 text-right text-[12px] font-semibold whitespace-nowrap"
                    >
                      {`DY ${m.label}`}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {sortedCarteira.map((r, i) => {
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
                  const varClass = !hasVar
                    ? "text-slate-400"
                    : varPerc >= 0
                    ? "text-emerald-300 font-semibold"
                    : "text-rose-300 font-semibold";

                  const dyMeses = Array.isArray(r.dyMeses)
                    ? [
                        ...r.dyMeses,
                        ...Array(DY_MONTHS.length - r.dyMeses.length).fill(""),
                      ].slice(0, DY_MONTHS.length)
                    : Array(DY_MONTHS.length).fill("");

                  const dy12mValor = dyMeses.reduce(
                    (acc, v) => acc + toNum(v),
                    0
                  );

                  return (
                    <tr
                      key={r.id}
                      className="border-t border-white/5 hover:bg-slate-800/30"
                    >
                      <td className="px-2 py-1.5 text-[11px] text-slate-500 sticky left-0 bg-slate-900/90 z-10 w-8">
                        {i + 1}
                      </td>

                      {/* Ticker (somente leitura) */}
                      <td className="px-2 py-1.5 text-left sticky left-[2rem] bg-slate-900/90 z-10 w-28">
                        <span className="text-[11px] text-slate-200">
                          {r.ticker || "—"}
                        </span>
                      </td>

                      {/* Tipo */}
                      <td className="px-2 py-1.5 w-32 text-center">
                        <span className="inline-flex items-center justify-center rounded-md bg-slate-900 border border-slate-700 px-2 py-0.5 text-[11px] text-slate-100">
                          {r.tipo === "RF"
                            ? "RF"
                            : r.tipo === "FII"
                            ? "FII"
                            : r.tipo === "CRIPTO"
                            ? "Cripto"
                            : r.tipo === "CAIXA"
                            ? "Caixa"
                            : r.tipo === "OUTROS"
                            ? "Outros"
                            : "Ações"}
                        </span>
                      </td>

                      {/* Setor */}
                      <td className="px-2 py-1.5 text-slate-200 w-40 truncate">
                        <span className="text-slate-100 text-xs">
                          {r.nome || "—"}
                        </span>
                      </td>

                      {/* Data entrada */}
                      <td className="px-2 py-1.5 text-left w-32">
                        <span className="text-[11px] text-slate-100">
                          {formatDateBR(r.dataEntrada)}
                        </span>
                      </td>

                      {/* Quantidade centralizada */}
                      <td className="px-2 py-1.5 text-center text-xs text-slate-100 w-24">
                        {r.qtd || "—"}
                      </td>

                      {/* Entrada (R$) alinhado à esquerda */}
                      <td className="px-2 py-1.5 text-left text-xs text-slate-100 w-36">
                        {entradaNum > 0
                          ? entradaNum.toLocaleString("pt-BR", {
                              style: "currency",
                              currency: "BRL",
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })
                          : "—"}
                      </td>

                      {/* Posição (R$) alinhado à esquerda */}
                      <td className="px-2 py-1.5 text-left text-xs text-slate-200 w-36">
                        {valorPosicao > 0
                          ? valorPosicao.toLocaleString("pt-BR", {
                              style: "currency",
                              currency: "BRL",
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })
                          : "—"}
                      </td>

                      {/* % Var */}
                      <td className={`px-2 py-1.5 text-right text-xs w-28 ${varClass}`}>
                        {hasVar ? `${varPerc.toFixed(2)}%` : "—"}
                      </td>

                      {/* Part. % */}
                      <td className="px-2 py-1.5 text-right text-xs text-slate-200 w-28">
                        {partStr}
                      </td>

                      {/* DY 12m */}
                      <td className="px-2 py-1.5 text-right text-xs text-slate-200 font-semibold w-32">
                        {dy12mValor > 0
                          ? dy12mValor.toLocaleString("pt-BR", {
                              style: "currency",
                              currency: "BRL",
                            })
                          : "—"}
                      </td>

                      {/* DY meses — 24 colunas */}
                      {DY_MONTHS.map((m, idx) => (
                        <td key={m.label} className="px-2 py-1.5 text-right">
                          <input
                            className="w-full bg-transparent text-right outline-none text-[11px] text-slate-100 placeholder:text-slate-600"
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
                            title={`DY em ${m.label} (R$)`}
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
          Esta carteira é um modelo educacional e não constitui recomendação de
          investimento.
        </p>
      </div>

      {/* Modal Adicionar Ativos (agora componente separado) */}
      <ModalLancamentos
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        novoLanc={novoLanc}
        onChangeLanc={handleChangeLanc}
        onSalvarLanc={handleSalvarLanc}
        lancamentos={lancamentos}
        onDeleteLanc={handleDeleteLanc}
      />
    </div>
  );
}
