import React, { useMemo } from "react";
import { Trash2 } from "lucide-react";

const MESES = [
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

function normalizeMesAno(str) {
  if (!str || !str.includes("/")) return str;

  let [mes, ano] = str.split("/").map((s) => s.trim());

  // mês numérico -> MMM
  if (/^\d+$/.test(mes)) {
    const idx = Number(mes) - 1;
    if (idx >= 0 && idx < 12) mes = MESES[idx];
  } else {
    mes = mes.charAt(0).toUpperCase() + mes.slice(1, 3).toLowerCase();
    const found = MESES.find((m) => m.toLowerCase() === mes.toLowerCase());
    if (found) mes = found;
  }

  // ano 2 dígitos -> 20xx
  if (/^\d{2}$/.test(ano)) ano = `20${ano}`;

  return `${mes}/${ano}`;
}

export default function CardRegistro({ columns = [], rows = [], onDeleteMonth }) {
  const fmt = useMemo(
    () =>
      new Intl.NumberFormat("pt-BR", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }),
    []
  );

  // meta das colunas (normaliza + ordena por ano → mês)
  const columnMeta = useMemo(() => {
    const norm = columns.map((c) => normalizeMesAno(c));

    const meta = norm.map((label, originalIndex) => {
      const [mes = "", ano = ""] = (label || "").split("/");
      const monthIndex = MESES.indexOf(mes);
      const yearNumber = Number(ano) || 0;

      return {
        label,
        mes,
        ano,
        originalIndex,
        monthIndex: monthIndex === -1 ? 99 : monthIndex,
        yearNumber,
      };
    });

    meta.sort((a, b) => {
      if (a.yearNumber !== b.yearNumber) {
        return a.yearNumber - b.yearNumber;
      }
      return a.monthIndex - b.monthIndex;
    });

    return meta;
  }, [columns]);

  // totais por coluna
  const totaisColuna = useMemo(
    () =>
      columnMeta.map((col) =>
        rows.reduce((acc, r) => {
          const v = Number(r.valores?.[col.originalIndex]) || 0;
          return acc + v;
        }, 0)
      ),
    [columnMeta, rows]
  );

  const LEFT_COL_WIDTH = 130;

  return (
    <div className="rounded-3xl bg-slate-800/70 border border-white/10 shadow-lg w-[640px] h-[360px] p-4 overflow-hidden shrink-0">
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <div className="text-slate-100 font-semibold text-lg">Registros</div>
        <div className="text-[11px] text-slate-400">
          Registros salvos por mês
        </div>
      </div>

      {/* Área principal */}
      <div className="relative h-[310px] rounded-2xl border border-white/10 bg-slate-900/40">
        {/* Miolo rolável */}
        <div className="absolute inset-x-0 top-0 bottom-10 overflow-auto z-10">
          <table className="min-w-max w-full border-separate border-spacing-0">
            <thead className="sticky top-0 z-20 bg-slate-800/90 backdrop-blur">
              <tr className="text-left text-slate-300 text-sm">
                {/* Coluna Ativos */}
                <th
                  className="sticky left-0 z-30 bg-slate-800/90 backdrop-blur px-3 py-1 font-medium border-b border-white/10"
                  style={{ minWidth: LEFT_COL_WIDTH, width: LEFT_COL_WIDTH }}
                >
                  Ativos
                </th>

                {/* Colunas de meses */}
                {columnMeta.map((col) => (
                  <th
                    key={col.label}
                    className="px-3 py-1 font-medium border-b border-white/10 text-slate-300 whitespace-nowrap"
                  >
                    <div className="flex items-center gap-2 justify-start">
                      <div className="flex flex-col leading-tight text-left">
                        <span className="text-[13px] text-slate-200">
                          {col.mes}
                        </span>
                        <span className="text-[12px] text-slate-400">
                          {col.ano}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => onDeleteMonth?.(col.label)}
                        className="p-1 rounded-md hover:bg-white/10 text-slate-400 hover:text-rose-400 transition"
                        aria-label={`Excluir mês ${col.label}`}
                        title={`Excluir mês ${col.label}`}
                      >
                        <Trash2 size={14} strokeWidth={2} />
                      </button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {rows.map((row, rowIdx) => {
                const zebra = rowIdx % 2 === 0;
                return (
                  <tr
                    key={row.ativo}
                    className={`text-sm ${
                      zebra ? "bg-white/[0.02]" : "bg-transparent"
                    } hover:bg-white/[0.04] transition`}
                  >
                    {/* Ativo fixo */}
                    <td
                      className="sticky left-0 z-10 bg-slate-950/60 px-3 py-2 border-b border-white/10 text-slate-100 font-medium"
                      style={{ minWidth: LEFT_COL_WIDTH, width: LEFT_COL_WIDTH }}
                    >
                      {row.ativo}
                    </td>

                    {/* Valores */}
                    {columnMeta.map((col) => {
                      const v = Number(row.valores?.[col.originalIndex]) || 0;
                      return (
                        <td
                          key={col.label}
                          className="px-3 py-2 border-b border-white/10 text-slate-200 tabular-nums text-left whitespace-nowrap"
                        >
                          {fmt.format(v)}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* TOTAL fixo */}
        {columnMeta.length > 0 && (
          <div className="absolute inset-x-0 bottom-0 z-20 bg-slate-800/95 border-t border-white/10">
            <table className="min-w-max w-full border-separate border-spacing-0">
              <tbody>
                <tr className="text-sm font-semibold text-slate-100">
                  <td
                    className="sticky left-0 bg-slate-800/95 px-3 py-2"
                    style={{ minWidth: LEFT_COL_WIDTH, width: LEFT_COL_WIDTH }}
                  >
                    Total
                  </td>

                  {totaisColuna.map((total, i) => (
                    <td
                      key={i}
                      className="px-3 py-2 text-left tabular-nums whitespace-nowrap"
                    >
                      {fmt.format(total)}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
