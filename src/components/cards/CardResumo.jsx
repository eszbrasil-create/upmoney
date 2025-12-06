// src/components/cards/CardResumo.jsx
import React from "react";

export default function CardResumo({ data = {} }) {
  const fmt = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 2,
  });

  const {
    mesAtual,
    patrimonioAtual = 0,
    comparativos = {},
    distribuicao = [],
  } = data;

  // calcula variação percentual em relação a um valor base
  const variacao = (base) => {
    if (base == null || Number.isNaN(base) || base <= 0) return null;
    return (patrimonioAtual - base) / base;
  };

  const totalDist =
    distribuicao.reduce((acc, it) => acc + (Number(it.valor) || 0), 0) || 0;

  const linhasComparativo = [
    { label: "vs mês anterior", valor: comparativos.mesAnterior },
    { label: "vs 3 meses", valor: comparativos.m3 },
    { label: "vs 6 meses", valor: comparativos.m6 },
    { label: "vs 12 meses", valor: comparativos.m12 },
  ];

  return (
    <div className="rounded-2xl bg-slate-800/70 border border-white/10 shadow-lg p-4 w-[640px] h-[415px] overflow-hidden shrink-0 flex flex-col">
      {/* Cabeçalho (fixo) */}
      <div className="shrink-0 mb-3 flex items-center justify-between">
        <span className="text-slate-100 font-semibold text-lg">Resumo</span>
        <span className="text-xs px-2 py-1 rounded bg-slate-700/60 text-slate-200">
          {mesAtual || "-"}
        </span>
      </div>

      {/* Patrimônio atual (fixo) */}
      <div className="shrink-0 flex items-center justify-between bg-slate-900/40 border border-white/5 rounded-xl px-3 py-2 mb-3">
        <span className="text-slate-300 text-sm">Patrimônio atual</span>
        <span className="text-slate-100 text-xl font-semibold">
          {fmt.format(patrimonioAtual || 0)}
        </span>
      </div>

      {/* Comparativos (fixo) */}
      <div className="shrink-0 space-y-2 mb-2">
        {linhasComparativo.map(({ label, valor }, index) => {
          const valorNum =
            typeof valor === "number" && !Number.isNaN(valor) ? valor : null;
          const hasValor = valorNum !== null && valorNum > 0;
          const v = hasValor ? variacao(valorNum) : null;

          return (
            <div
              key={index}
              className="flex items-center justify-between border-b border-white/10 pb-1"
            >
              <span className="text-slate-300 text-sm">{label}</span>
              <div className="flex items-center gap-2">
                <span className="text-slate-200 text-sm">
                  {hasValor ? fmt.format(valorNum) : "—"}
                </span>
                {v !== null && (
                  <span
                    className={`text-xs font-medium ${
                      v >= 0 ? "text-emerald-400" : "text-rose-400"
                    }`}
                  >
                    {(v * 100).toFixed(1)}%
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Distribuição (rolagem interna) */}
      <div className="flex-1 min-h-0 overflow-y-auto pr-1 scrollbar">
        <span className="text-slate-100 font-semibold text-sm block mb-2 sticky top-0 bg-slate-800/70 py-1">
          Distribuição da carteira
        </span>

        <div className="space-y-3">
          {distribuicao.map((item) => {
            const valorNum = Number(item.valor) || 0;
            const pct = totalDist > 0 ? (valorNum / totalDist) * 100 : 0;

            return (
              <div key={item.nome}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-slate-300">{item.nome}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-200">
                      {fmt.format(valorNum)}
                    </span>
                    <span className="text-slate-400 text-xs">
                      {pct.toFixed(1)}%
                    </span>
                  </div>
                </div>

                <div className="w-full h-1.5 bg-slate-700/50 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-sky-400/80 rounded-full"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}

          {distribuicao.length === 0 && (
            <p className="text-xs text-slate-400">
              Nenhum ativo cadastrado para este mês.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
