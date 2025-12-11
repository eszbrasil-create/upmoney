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
    // mês texto -> MMM
    mes = mes.charAt(0).toUpperCase() + mes.slice(1,3).toLowerCase();
    if (!MESES.includes(mes)) {
      const found = MESES.find(m => m.toLowerCase() === mes.toLowerCase());
      if (found) mes = found;
    }
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

  const normalizedColumns = useMemo(
    () => columns.map(normalizeMesAno),
    [columns]
  );

  const totaisColuna = useMemo(() => {
    return normalizedColumns.map((_, colIdx) =>
      rows.reduce((acc, r) => acc + (r.valores?.[colIdx] || 0), 0)
    );
  }, [normalizedColumns, rows]);

  const LEFT_COL_WIDTH = 130;

  return (
    <div className="rounded-3xl bg-slate-800/70 border border-white/10 shadow-lg w-[640px] h-[360px] p-4 overflow-hidden shrink-0">
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <div className="text-slate-100 font-semibold text-lg">
          Registros
        </div>
        <div className="text-[11px] text-slate-400">
          Registros salvos por mês
        </div>
      </div>

      {/* Área da tabela com scroll interno */}
      <div className="relative h-[310px] overflow-x-auto overflow-y-auto pb-0 rounded-2xl border border-white/10 bg-slate-900/40">
        {/* conteúdo rolável (header + linhas) */}
        <div className="min-w-max pb-10">
          <table className="border-separate border-spacing-0 w-full">
            {/* Cabeçalho fixo */}
            <thead className="sticky top-0 z-30 bg-slate-800/90 backdrop-blur">
              <tr className="text-left text-slate-300 text-sm">
                {/* Coluna fixa (Ativos) */}
                <th
                  className="sticky left-0 z-40 bg-slate-800/90 backdrop-blur px-3 py-1 font-medium border-b border-white/10"
                  style={{ minWidth: LEFT_COL_WIDTH, width: LEFT_COL_WIDTH }}
                >
                  Ativos
                </th>

                {/* Meses + lixeira */}
                {normalizedColumns.map((m) => {
                  const [mes, ano] = m.split("/");

                  return (
                    <th
                      key={m}
                      className="px-3 py-1 font-medium border-b border-white/10 text-slate-300 whitespace-nowrap"
                    >
                      <div className="flex items-center gap-2">
                        <div className="flex flex-col leading-tight text-center">
                          <span className="text-[13px] text-slate-200">{mes}</span>
                          <span className="text-[12px] text-slate-400">{ano}</span>
                        </div>

                        <button
                          type="button"
                          onClick={() => onDeleteMonth?.(m)}
                          className="p-1 rounded-md hover:bg-white/10 text-slate-400 hover:text-rose-400 transition"
                          aria-label={`Excluir mês ${m}`}
                          title={`Excluir mês ${m}`}
                        >
                          <Trash2 size={14} strokeWidth={2} />
                        </button>
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>

            {/* Corpo */}
            <tbody>
              {rows.map((row, rowIdx) => {
                const zebra = rowIdx % 2 === 0;
                return (
                  <tr
                    key={row.ativo}
                    className={`text-sm ${zebra ? "bg-white/[0.02]" : "bg-transparent"} hover:bg-white/[0.04] transition`}
                  >
                    {/* Primeira coluna fixa — Ativo */}
                    <td
                      className="sticky left-0 z-10 bg-slate-950/60 px-3 py-2 border-b border-white/10 text-slate-100 font-medium"
                      style={{ minWidth: LEFT_COL_WIDTH, width: LEFT_COL_WIDTH }}
                    >
                      {row.ativo}
                    </td>

                    {/* Valores por mês */}
                    {normalizedColumns.map((_, idx) => (
                      <td
                        key={idx}
                        className="px-3 py-2 border-b border-white/10 text-slate-200 whitespace-nowrap text-left tabular-nums"
                      >
                        {fmt.format(row.valores?.[idx] ?? 0)}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Rodapé TOTAL fixo no fundo do card */}
        <div className="pointer-events-none absolute bottom-0 left-0 right-0">
          <div className="min-w-max">
            <table className="border-separate border-spacing-0 w-full">
              <tfoot>
                <tr className="bg-slate-800/90 backdrop-blur text-sm">
                  <td
                    className="sticky left-0 z-50 bg-slate-800/90 backdrop-blur px-3 py-2 border-t border-white/10 text-slate-100 font-semibold"
                    style={{ minWidth: LEFT_COL_WIDTH, width: LEFT_COL_WIDTH }}
                  >
                    Total
                  </td>

                  {totaisColuna.map((v, i) => (
                    <td
                      key={i}
                      className="px-3 py-2 border-t border-white/10 text-slate-100 font-semibold whitespace-nowrap text-left tabular-nums"
                    >
                      {fmt.format(v)}
                    </td>
                  ))}
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
