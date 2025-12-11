// CardRegistro.jsx — VERSÃO FINAL, NUNCA MAIS MEXE NISSO
import React, { useMemo } from "react";
import { Trash2 } from "lucide-react";

const MESES = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];

function normalizeMesAno(str) {
  if (!str || !str.includes("/")) return str;
  let [mes, ano] = str.split("/").map(s => s.trim());
  if (/^\d+$/.test(mes)) mes = MESES[Number(mes) - 1] || mes;
  else mes = mes.charAt(0).toUpperCase() + mes.slice(1,3).toLowerCase(), MESES.find(m => m.toLowerCase() === mes.toLowerCase()) && (mes = MESES.find(m => m.toLowerCase() === mes.toLowerCase()));
  if (/^\d{2}$/.test(ano)) ano = `20${ano}`;
  return `${mes}/${ano}`;
}

export default function CardRegistro({ columns = [], rows = [], onDeleteMonth }) {
  const fmt = useMemo(() => new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 }), []);

  const normalizedColumns = useMemo(() => {
    const norm = columns.map(normalizeMesAno);
    return norm.sort((a, b) => MESES.indexOf(a.split("/")[0]) - MESES.indexOf(b.split("/")[0]));
  }, [columns]);

  const totaisColuna = useMemo(() =>
    normalizedColumns.map((_, i => rows.reduce((a, r) => a + (r.valores?.[i] || 0), 0))
  , [normalizedColumns, rows]);

  return (
    <div className="rounded-3xl bg-slate-800/70 border border-white/10 shadow-lg w-[640px] h-[360px] p-4 overflow-hidden shrink-0">
      <div className="flex items-center justify-between mb-1">
        <div className="text-slate-100 font-semibold text-lg">Registros</div>
        <div className="text-[11px] text-slate-400">Registros salvos por mês</div>
      </div>

      <div className="relative h-[310px] overflow-auto rounded-2xl border border-white/10 bg-slate-900/40">
        <div className="min-w-max">
          <table className="w-full border-separate border-spacing-0 relative">
            {/* CABEÇALHO FIXO */}
            <thead className="sticky top-0 z-30 bg-slate-800/90 backdrop-blur">
              <tr className="text-left text-slate-300 text-sm">
                <th className="sticky left-0 z-40 bg-slate-800/90 backdrop-blur px-3 py-1 font-medium border-b border-white/10" style={{width:130, minWidth:130}}>
                  Ativos
                </th>
                {normalizedColumns.map(m => {
                  const [mes, ano] = m.split("/");
                  return (
                    <th key={m} className="px-3 py-1 font-medium border-b border-white/10 text-slate-300 whitespace-nowrap">
                      <div className="flex items-center justify-center gap-2">
                        <div className="text-center leading-tight">
                          <div className="text-[13px] text-slate-200">{mes}</div>
                          <div className="text-[11px] text-slate-400">{ano}</div>
                        </div>
                        <button onClick={() => onDeleteMonth?.(m)} className="p-1 rounded hover:bg-white/10 hover:text-rose-400 transition">
                          <Trash2 size={14} strokeWidth={2} />
                        </button>
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>

            {/* CORPO - z-index menor */}
            <tbody className="z-10">
              {rows.map((row, i) => (
                <tr key={row.ativo} className={`${i%2===0?'bg-white/[0.02]':''} hover:bg-white/[0.04]`}>
                  <td className="sticky left-0 z-20 bg-slate-950/60 px-3 py-2 border-b border-white/10 font-medium text-slate-100" style={{width:130, minWidth:130}}>
                    {row.ativo}
                  </td>
                  {normalizedColumns.map((_, idx) => (
                    <td key={idx} className="px-3 py-2 border-b border-white/10 text-right tabular-nums text-slate-200">
                      {fmt.format(row.valores?.[idx] ?? 0)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>

            {/* TOTAL FIXO NO FUNDO - z-index maior que tudo */}
            {normalizedColumns.length > 0 && (
              <tfoot className="sticky bottom-0 z-50 bg-slate-800/90 backdrop-blur border-t-2 border-white/20 shadow-2xl">
                <tr className="text-sm font-bold text-slate-100">
                  <td className="sticky left-0 z-50 bg-slate-800/90 px-3 py-2 border-t border-white/10" style={{width:130, minWidth:130}}>
                    TOTAL
                  </td>
                  {totaisColuna.map((v, i) => (
                    <td key={i} className="px-3 py-2 border-t border-white/10 text-right tabular-nums">
                      {fmt.format(v)}
                    </td>
                  ))}
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}