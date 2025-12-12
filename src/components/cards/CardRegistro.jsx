// src/components/cards/CardRegistro.jsx
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

  // ano 2 dígitos -> 4 dígitos
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

  const LEFT_COL_WIDTH = 130;

  // ===== META DAS COLUNAS (normaliza + ordena Jan..Dez + ano crescente) =====
  const columnMeta = useMemo(() => {
    const meta = columns.map((c, originalIndex) => {
      const label = normalizeMesAno(c);
      const [mes = "", ano = ""] = label.split("/");

      const monthIndex = MESES.indexOf(mes);
      const yearNumber = Number(ano) || 0;

      return {
        label,
        mes,
        ano,
        monthIndex: monthIndex === -1 ? 999 : monthIndex,
        yearNumber,
        originalIndex,
      };
    });

    meta.sort((a, b) => {
      if (a.monthIndex !== b.monthIndex) return a.monthIndex - b.monthIndex;
      return a.yearNumber - b.yearNumber;
    });

    return meta;
  }, [columns]);

  // ===== TOTAIS POR COLUNA USANDO originalIndex =====
  const totaisColuna = useMemo(() => {
    return columnMeta.map((col) =>
      rows.reduce((acc, r) => acc + (r.valores?.[col.originalIndex] || 0), 0)
    );
  }, [columnMeta, rows]);

  return (
    <div className="rounded-3xl bg-slate-800/70 border border-white/10 shadow-lg w-[640px] h-[360px] p-4 overflow-hidden shrink-0">
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <div className="text-slate-100 font-semibold text-lg">Registros</div>
        <div className="text-[11px] text-slate-400">
          Registros salvos por mês
        </div>
      </div>

      {/* Área da tabela */}
      <div className="relative h-[310px] rounded-2xl border border-white/10 bg-slate-900/40">
        {/* SCROLL vertical + horizontal */}
        <div className="h-full overflow-auto">
          <div className="min-w-max pb-9">
            <table className="border-separate border-spacing-0 w-full">
              {/* CABEÇALHO (fixo no topo) */}
              <thead className="sticky top-0 z-30 bg-slate-800/95 backdrop-blur">
                <tr className="text-left text-slate-300 text-sm">
                  {/* Coluna fixa "Ativos" */}
                  <th
                    className="sticky left-0 z-40 bg-slate-800/95 backdrop-blur px-3 py-1 font-medium border-b border-white/10"
                    style={{ minWidth: LEFT_COL_WIDTH, width: LEFT_COL_WIDTH }}
                  >
                    Ativos
                  </th>

                  {/* Meses */}
                  {columnMeta.map((col) => (
                    <th
                      key={col.label}
                      className="px-3 py-1 font-medium border-b border-white/10 text-slate-300 whitespace-nowrap"
                    >
                      <div className="flex flex-col items-center leading-tight">
                        <span className="text-[13px] text-slate-200">
                          {col.mes}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-[12px] text-slate-400">
                            {col.ano}
                          </span>
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
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>

              {/* CORPO (rola por trás do TOTAL) */}
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
                      {/* coluna fixa Ativos */}
                      <td
                        className="sticky left-0 z-10 bg-slate-950/70 px-3 py-2 border-b border-white/10 text-slate-100 font-medium"
                        style={{
                          minWidth: LEFT_COL_WIDTH,
                          width: LEFT_COL_WIDTH,
                        }}
                      >
                        {row.ativo}
                      </td>

                      {/* valores por mês (seguindo ordem columnMeta) */}
                      {columnMeta.map((col) => (
                        <td
                          key={col.label}
                          className="px-3 py-2 border-b border-white/10 text-slate-200 whitespace-nowrap text-right tabular-nums"
                        >
                          {fmt.format(row.valores?.[col.originalIndex] ?? 0)}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>

              {/* TOTAL - fica FIXO no fundo da área rolável */}
              {columnMeta.length > 0 && (
                <tfoot className="sticky bottom-0 z-40 bg-slate-800/95 backdrop-blur">
                  <tr className="text-sm font-semibold text-slate-100 border-t border-white/10">
                    <td
                      className="sticky left-0 z-50 bg-slate-800/95 backdrop-blur px-3 py-2 border-t border-white/10"
                      style={{
                        minWidth: LEFT_COL_WIDTH,
                        width: LEFT_COL_WIDTH,
                      }}
                    >
                      Total
                    </td>
                    {totaisColuna.map((total, idx) => (
                      <td
                        key={idx}
                        className="px-3 py-2 border-t border-white/10 text-right whitespace-nowrap tabular-nums"
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
    </div>
  );
}
