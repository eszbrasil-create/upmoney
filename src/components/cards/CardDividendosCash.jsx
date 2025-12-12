// src/components/cards/CardDividendosCash.jsx
import React, {
  useEffect,
  useMemo,
  useState,
  useRef,
  useLayoutEffect,
} from "react";

import { supabase } from "../../lib/supabaseClient";
import { useDyBase } from "../../utils/dyBase";
import { mergeDyBaseIntoCarteira } from "../../utils/mergeDyBase";

const PT_MESES = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];

// ✅ IGUAL ao CarteiraCash: 24 meses começando em Dez/2025
const DY_MONTHS_24 = (() => {
  const result = [];
  let year = 2025;
  let month = 11; // Dez

  for (let i = 0; i < 24; i++) {
    result.push({
      label: `${PT_MESES[month]} ${year}`,
      month,
      year,
    });

    month++;
    if (month > 11) {
      month = 0;
      year++;
    }
  }
  return result;
})();

// ✅ Mas o DASH vai mostrar só 12 (Dez/2025 → Nov/2026)
const DY_MONTHS_12 = DY_MONTHS_24.slice(0, 12);

function toNum(x) {
  if (x === "" || x === null || x === undefined) return 0;
  const n = Number(String(x).replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

function Tooltip({ x, y, label, valor }) {
  return (
    <div className="fixed z-50 pointer-events-none" style={{ left: x, top: y }}>
      <div className="rounded-xl bg-slate-950/95 border border-white/10 px-3 py-2 shadow-2xl">
        <div className="text-[11px] text-slate-300 font-medium">{label}</div>
        <div className="text-sm text-slate-100 font-semibold">
          {valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
        </div>
      </div>
    </div>
  );
}

export default function CardDividendosCash() {
  const { dyBase, dyBaseLoading } = useDyBase();

  const [user, setUser] = useState(null);
  const [carteira, setCarteira] = useState([]);

  useEffect(() => {
    async function loadUser() {
      const { data } = await supabase.auth.getUser();
      setUser(data?.user || null);
    }
    loadUser();
  }, []);

  useEffect(() => {
    if (!user) return;

    let cancelled = false;

    async function loadCarteiraFromSupabase() {
      const { data, error } = await supabase
        .from("wallet_items")
        .select("*")
        .eq("user_id", user.id);

      if (cancelled) return;

      if (error) {
        console.error("Erro ao carregar wallet_items:", error);
        setCarteira([]);
        return;
      }

      if (!data || data.length === 0) {
        setCarteira([]);
        return;
      }

      const grupos = new Map(); // key = `${ticker}__${tipo}`

      data.forEach((row) => {
        const ticker = (row.ticker || "").toUpperCase();
        if (!ticker) return;

        const tipo = row.tipo || "ACOES";
        const key = `${ticker}__${tipo}`;

        const qtd = toNum(row.qtd);
        const preco = toNum(row.price ?? row.preco);
        const valor = qtd * preco;
        const dataEntrada = row.data_entrada || "";

        const atual = grupos.get(key) || {
          ticker,
          tipo,
          somaQtd: 0,
          somaValor: 0,
          dataEntradaMaisAntiga: dataEntrada || "",
        };

        atual.somaQtd += qtd;
        atual.somaValor += valor;

        if (!atual.dataEntradaMaisAntiga) {
          atual.dataEntradaMaisAntiga = dataEntrada;
        } else if (dataEntrada && dataEntrada < atual.dataEntradaMaisAntiga) {
          atual.dataEntradaMaisAntiga = dataEntrada;
        }

        grupos.set(key, atual);
      });

      const linhas = Array.from(grupos.values()).map((g, idx) => {
        const precoMedio = g.somaQtd > 0 ? g.somaValor / g.somaQtd : 0;

        return {
          id: idx + 1,
          ticker: g.ticker,
          tipo: g.tipo,
          nome: "",
          dataEntrada: g.dataEntradaMaisAntiga || "",
          qtd: g.somaQtd ? String(g.somaQtd) : "",
          entrada: precoMedio ? String(precoMedio.toFixed(2)) : "",
          valorAtual: precoMedio ? String(precoMedio.toFixed(2)) : "",
          // ✅ IMPORTANTE: 24 meses (compatível com o merge do CarteiraCash)
          dyMeses: Array(DY_MONTHS_24.length).fill(""),
          dy: "",
        };
      });

      setCarteira(linhas);
    }

    loadCarteiraFromSupabase();

    return () => {
      cancelled = true;
    };
  }, [user]);

  // ✅ Merge usando 24 meses (igual CarteiraCash)
  const carteiraComDy = useMemo(() => {
    return mergeDyBaseIntoCarteira(carteira, dyBase, DY_MONTHS_24);
  }, [carteira, dyBase]);

  // ✅ Soma 24 meses, depois recorta os 12 que o DASH quer mostrar
  const totals12 = useMemo(() => {
    const dyMesTotal = Array(DY_MONTHS_24.length).fill(0);

    carteiraComDy.forEach((r) => {
      const arrMeses = Array.isArray(r.dyMeses) ? r.dyMeses : [];
      for (let i = 0; i < DY_MONTHS_24.length; i++) {
        dyMesTotal[i] += toNum(arrMeses[i]);
      }
    });

    return dyMesTotal.slice(0, 12);
  }, [carteiraComDy]);

  const max = Math.max(1, ...totals12);
  const isEmpty = totals12.every((v) => (v || 0) === 0);

  const [animate, setAnimate] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setAnimate(true), 50);
    return () => clearTimeout(t);
  }, []);

  const [tip, setTip] = useState(null);

  const chartRef = useRef(null);
  const [barMaxHeight, setBarMaxHeight] = useState(160);

  useLayoutEffect(() => {
    if (!chartRef.current) return;

    const el = chartRef.current;

    const compute = () => {
      const h = el.clientHeight || 0;
      const reservedForLabels = 52;
      const topGap = 10;
      const usable = Math.max(80, h - reservedForLabels - topGap);
      setBarMaxHeight(usable);
    };

    compute();

    const ro = new ResizeObserver(() => compute());
    ro.observe(el);

    return () => ro.disconnect();
  }, []);

  return (
    <div className="rounded-3xl bg-slate-800/70 border border-white/10 shadow-lg p-4 w-[590px] h-[360px] overflow-hidden shrink-0 flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <span className="text-slate-100 font-semibold text-lg">
          Meus Dividendos
        </span>
        <span className="text-xs px-2 py-1 rounded-lg bg-slate-700/60 text-slate-200">
          Mensal
        </span>
      </div>

      <div
        ref={chartRef}
        className="flex-1 min-h-0 rounded-2xl border border-white/10 bg-slate-900/80 p-3 pt-2 overflow-x-hidden overflow-y-hidden"
      >
        {dyBaseLoading ? (
          <div className="h-full flex items-center justify-center text-slate-300 text-sm">
            Carregando base de dividendos…
          </div>
        ) : isEmpty ? (
          <div className="h-full flex items-center justify-center text-slate-400 text-sm text-center px-4">
            Sem dados de dividendos para o período (Dez/2025 → Nov/2026).
          </div>
        ) : (
          <div className="flex items-end gap-1 h-full">
            {totals12.map((valor, i) => {
              const alturaReal = Math.max(
                4,
                Math.round((valor / max) * barMaxHeight)
              );
              const altura = animate ? alturaReal : 4;

              const label = DY_MONTHS_12[i].label; // "Dez 2025"
              const [mesTxt, anoTxt] = label.split(" ");

              return (
                <div key={label} className="flex flex-col items-center gap-2 w-10">
                  <div
                    className="w-full rounded-xl bg-emerald-400/80 hover:bg-emerald-300 transition-all duration-700 ease-out"
                    style={{ height: `${altura}px` }}
                    onMouseEnter={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      setTip({
                        x: rect.left + rect.width / 2,
                        y: rect.top - 8,
                        label,
                        valor,
                      });
                    }}
                    onMouseMove={(e) => {
                      setTip((prev) =>
                        prev ? { ...prev, x: e.clientX, y: e.clientY - 12 } : prev
                      );
                    }}
                    onMouseLeave={() => setTip(null)}
                  />

                  {/* ✅ mês em cima, ano embaixo (fixo) */}
                  <div
                    className="text-[13px] text-slate-200 text-center leading-tight whitespace-nowrap font-medium"
                    style={{ textShadow: "0 1px 6px rgba(0,0,0,0.6)" }}
                  >
                    {mesTxt}
                    <br />
                    <span
                      className="text-[12px] opacity-70 font-normal text-slate-300"
                      style={{ textShadow: "0 1px 6px rgba(0,0,0,0.6)" }}
                    >
                      {anoTxt}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {tip && <Tooltip x={tip.x} y={tip.y} label={tip.label} valor={tip.valor} />}
    </div>
  );
}
