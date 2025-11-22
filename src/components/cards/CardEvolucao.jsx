// src/components/cards/CardEvolucao.jsx
import React, { useMemo } from "react";

const MESES = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];

function normalizeMesAno(str) {
  if (!str || !str.includes("/")) return str;

  let [mes, ano] = str.split("/").map(s => s.trim());

  // Se veio número (ex: 11 → Nov)
  if (/^\d+$/.test(mes)) {
    const idx = Number(mes) - 1;
    if (idx >= 0 && idx < 12) mes = MESES[idx];
  } else {
    // Normaliza texto: "nov" → "Nov"
    mes = mes.charAt(0).toUpperCase() + mes.slice(1,3).toLowerCase();

    // Se não bate com MESES, tenta localizar
    if (!MESES.includes(mes)) {
      const found = MESES.find(m => m.toLowerCase() === mes.toLowerCase());
      if (found) mes = found;
    }
  }

  // Ano com 2 dígitos vira 4 dígitos: 26 → 2026
  if (/^\d{2}$/.test(ano)) ano = `20${ano}`;

  return `${mes}/${ano}`;
}

export default function CardEvolucao({ columns = [], rows = [] }) {

  // 🔄 Normaliza os meses/anos
  const normalizedColumns = useMemo(
    () => columns.map(normalizeMesAno),
    [columns]
  );

  // 🔢 Calcula totais por mês
  const totals = useMemo(() => {
    return normalizedColumns.map((_, colIdx) =>
      rows.reduce((acc, r) => acc + (r.valores?.[colIdx] || 0), 0)
    );
  }, [normalizedColumns, rows]);

  const max = Math.max(1, ...totals);

  return (
    <div className="rounded-2xl bg-slate-800/70 border border-white/10 shadow-lg p-4 w-[590px] h-[460px] overflow-hidden shrink-0">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-slate-100 font-semibold text-lg">Evolução</span>
        <span className="text-xs px-2 py-1 rounded bg-slate-700/60 text-slate-200">
          Mensal
        </span>
      </div>

      {/* Gráfico */}
      <div className="h-[380px] rounded-xl border border-white/10 bg-slate-900/80 p-3 overflow-x-auto overflow-y-hidden">
        <div className="flex items-end gap-1 min-w-max">

          {totals.map((valor, i) => {
            const altura = Math.max(4, Math.round((valor / max) * 300));
            const [mes, ano] = normalizedColumns[i].split("/");

            return (
              <div key={i} className="flex flex-col items-center gap-2 w-10">
                
                {/* Barra */}
                <div
                  className="w-full rounded-md bg-sky-400/80 hover:bg-sky-300 transition-all"
                  style={{ height: `${altura}px` }}
                  title={valor.toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL"
                  })}
                />

                {/* Mês e ano */}
                <div className="text-[10px] text-slate-300 text-center leading-tight whitespace-nowrap">
                  {mes}
                  <br />
                  <span className="text-[9px] opacity-60">{ano}</span>
                </div>

              </div>
            );
          })}

        </div>
      </div>
    </div>
  );
}
