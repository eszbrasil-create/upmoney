// src/components/cards/CardDividendosCash.jsx
import React, { useMemo } from "react";

const MESES = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];

export default function CardDividendosCash({ rows = [], columns = [] }) {

  // 🔹 Soma os dividendos mensais totalizados igual ao Registro/Evolução
  const dados = useMemo(() => {
    return columns.map((col, idxCol) => ({
      mes: col,
      total: rows.reduce((acc, r) => acc + (Number(r.valores?.[idxCol] || 0)), 0)
    }));
  }, [rows, columns]);

  return (
    <div className="rounded-2xl bg-slate-800/70 border border-white/10 shadow-lg w-[605px] h-[360px] p-4 overflow-hidden">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-slate-100 font-semibold text-lg">
          Dividendos — Cash
        </span>

        {columns.length > 0 && (
          <span className="text-xs px-2 py-1 rounded bg-slate-700/60 text-slate-200">
            {columns[columns.length - 1]}
          </span>
        )}
      </div>

      {/* Conteúdo interno */}
      <div className="h-[290px] overflow-x-auto pr-2">
        
        <table className="min-w-full border-separate border-spacing-0">
          <thead className="bg-slate-800/90 sticky top-0 z-20">
            <tr className="text-left text-slate-300 text-sm">
              <th className="px-3 py-2 font-medium border-b border-white/10">
                Mês
              </th>
              <th className="px-3 py-2 font-medium border-b border-white/10">
                Total (R$)
              </th>
            </tr>
          </thead>

          <tbody>
            {dados.map((d, i) => {
              const zebra = i % 2 === 0;
              const [mes, ano] = d.mes.split("/");

              return (
                <tr key={i} className={`${zebra ? "bg-white/[0.02]" : ""} hover:bg-white/[0.05] transition text-sm`}>
                  <td className="px-3 py-2 text-slate-100">
                    <div className="leading-tight">
                      <div className="text-[13px]">{mes}</div>
                      <div className="text-[11px] text-slate-400">{ano}</div>
                    </div>
                  </td>

                  <td className="px-3 py-2 text-left text-slate-200 tabular-nums">
                    {d.total.toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    })}
                  </td>
                </tr>
              );
            })}
          </tbody>

          <tfoot className="sticky bottom-0 bg-slate-800/90 z-20">
            <tr className="text-sm font-semibold">
              <td className="px-3 py-2 border-t border-white/10 text-slate-100">
                Total
              </td>
              <td className="px-3 py-2 border-t border-white/10 text-slate-100">
                {dados.reduce((a,b)=>a+b.total,0).toLocaleString("pt-BR",{
                  style:"currency",
                  currency:"BRL",
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                })}
              </td>
            </tr>
          </tfoot>

        </table>
      </div>

    </div>
  );
}
