// src/components/cards/CardRegistro.jsx
import React, { useMemo } from "react";
import { Trash2 } from "lucide-react";

const MESES = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];

function normalizeMesAno(str) {
  if (!str || !str.includes("/")) return str;
  let [mes, ano] = str.split("/").map(s => s.trim());

  // mês numérico -> MMM
  if (/^\d+$/.test(mes)) {
    const idx = Number(mes) - 1;
    if (idx >= 0 && idx < 12) mes = MESES[idx];
  } else {
    // texto -> MMM
    mes = mes.charAt(0).toUpperCase() + mes.slice(1,3).toLowerCase();
    const found = MESES.find(m => m.toLowerCase() === mes.toLowerCase());
    if (found) mes = found;
  }

  // ano 2 dígitos -> 4 dígitos
  if (/^\d{2}$/.test(ano)) ano = `20${ano}`;
  return `${mes}/${ano}`;
}

export default function CardRegistro({ columns = [], rows = [], onDeleteMonth }) {
  const fmt = useMemo(
    () => new Intl.NumberFormat("pt-BR", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }),
    []
  );

  /** =========================================================
   *  Meses em ordem Jan → Dez, **guardando índice original**
   * ==========================================================*/
  const monthMeta = useMemo(() => {
    const norm = columns.map(normalizeMesAno);

    return norm
      .map((label, originalIndex) => ({ label, originalIndex }))
      .sort((a, b) => {
        const ma = a.label.split("/")[0];
        const mb = b.label.split("/")[0];
        return MESES.indexOf(ma) - MESES.indexOf(mb);
      });
  }, [columns]);

  const normalizedColumns = useMemo(
    () => monthMeta.map((m) => m.label),
    [monthMeta]
  );

  /** =========================================================
   *  Totais por coluna respeitando a nova ordem
   * ==========================================================*/
  const totaisColuna = useMemo(
    () =>
      monthMeta.map(({ originalIndex }) =>
        rows.reduce(
          (acc, r) => acc + (Number(r.valores?.[originalIndex]) || 0),
          0
        )
      ),
    [monthMeta, rows]
  );

  const LEFT_COL_WIDTH = 130;

  return (
    <div className="rounded-3xl bg-slate-800/70 border border-white/10 shadow-lg w-[640px] h-[360px] p-4 overflow-hidden shrink-0">
      <div className="flex items-center justify-between mb-1">
        <div className="text-slate-100 font-semibold text-lg">Registros</div>
        <div className="text-[11px] text-slate-400">Registros salvos por mês</div>
      </div>

      <div className="relative h-[310px] overflow-auto rounded-2xl border border-white/10 bg-slate-900/40">
        {/* TABELA PRINCIPAL */}
        <div className="min-w-max pb-12">
          {/* espaço para o TOTAL não ser sobreposto */}
          <table className="w-full border-separate border-spacing-0">
            {/* CABEÇALHO FIXO */}
            <thead className="sticky top-0 z-30 bg-slate-800/90 backdrop-blur">
              <tr className="text-left text-slate-300 text-sm">
                <th
                  className="sticky left-0 z-40 bg-slate-800/90 backdrop-blur px-3 py-1 font-medium border-b border-white/10"
                  style={{ minWidth: LEFT_COL_WIDTH, width: LEFT_COL_WIDTH }}
                >
                  Ativos
                </th>
                {normalizedColumns.map((m) => {
                  const [mes, ano] = m.split("/");
                  return (
                    <th
                      key={m}
                      className="px-3 py-1 font-medium border-b border-white/10 text-slate-300 whitespace-nowrap"
                    >
                      <div className="flex items-center gap-2 justify-center">
                        <div className="text-center leading-tight">
                          <span className="text-[13px] text-slate-200">{mes}</span>
                          <span className="text-[12px] text-slate-400">{ano}</span>
                        </div>
                        <button
                          onClick={() => onDeleteMonth?.(m)}
                          className="p-1 rounded-md hover:bg-white/10 text-slate-400 hover:text-rose-400 transition"
                        >
                          <Trash2 size={14} strokeWidth={2} />
                        </button>
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>

            {/* CORPO - rola normalmente */}
            <tbody>
              {rows.map((row, i) => (
                <tr
                  key={row.ativo}
                  className={`text-sm ${
                    i % 2 === 0 ? "bg-white/[0.02]" : ""
                  } hover:bg-white/[0.04]`}
                >
                  <td
                    className="sticky left-0 z-10 bg-slate-950/60 px-3 py-2 border-b border-white/10 text-slate-100 font-medium"
                    style={{ minWidth: LEFT_COL_WIDTH, width: LEFT_COL_WIDTH }}
                  >
                    {row.ativo}
                  </td>

                  {monthMeta.map(({ originalIndex }, idx) => {
                    const valorNum = Number(row.valores?.[originalIndex]) || 0;
                    return (
                      <td
                        key={idx}
                        className="px-3 py-2 border-b border-white/10 text-slate-200 tabular-nums text-right"
                      >
                        {fmt.format(valorNum)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>

            {/* TOTAL FIXO NO FUNDO */}
            {normalizedColumns.length > 0 && (
              <tfoot className="sticky bottom-0 z-40 bg-slate-800/90 backdrop-blur">
                <tr className="text-sm font-semibold text-slate-100 border-t border-white/10">
                  <td
                    className="sticky left-0 z-50 bg-slate-800/90 backdrop-blur px-3 py-2 border-t border-white/10"
                    style={{ minWidth: LEFT_COL_WIDTH, width: LEFT_COL_WIDTH }}
                  >
                    TOTAL
                  </td>
                  {totaisColuna.map((total, i) => (
                    <td
                      key={i}
                      className="px-3 py-2 border-t border-white/10 text-right tabular-nums"
                    >
                      {fmt.format(total)}
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
