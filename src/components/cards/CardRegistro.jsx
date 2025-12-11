// src/components/cards/CardRegistro.jsx
import React, { useMemo } from "react";
import { Trash2 } from "lucide-react";

const MESES = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
  "Jul", "Ago", "Set", "Out", "Nov", "Dez",
];

function normalizeMesAno(str) {
  if (!str || !str.includes("/")) return str;

  let [mes, ano] = str.split("/").map((s) => s.trim());

  // Converte mês numérico para texto abreviado
  if (/^\d+$/.test(mes)) {
    const idx = Number(mes) - 1;
    if (idx >= 0 && idx < 12) mes = MESES[idx];
  } else {
    // Padroniza texto do mês (ex: "agosto" → "Ago")
    mes = mes.charAt(0).toUpperCase() + mes.slice(1, 3).toLowerCase();
    const found = MESES.find((m) => m.toLowerCase() === mes.toLowerCase());
    if (found) mes = found;
  }

  // Ano com 2 dígitos → 4 dígitos
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

  // Ordena os meses de Janeiro a Dezembro
  const normalizedColumns = useMemo(() => {
    const norm = columns.map(normalizeMesAno);

    const getMonthIndex = (m) => {
      const [mes] = m.split("/");
      return MESES.indexOf(mes);
    };

    return norm.sort((a, b) => getMonthIndex(a) - getMonthIndex(b));
  }, [columns]);

  // Totais por coluna
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
        <div className="text-slate-100 font-semibold text-lg">Registros</div>
        <div className="text-[11px] text-slate-400">Registros salvos por mês</div>
      </div>

      {/* Área da tabela com scroll */}
      <div className="relative h-[310px] overflow-auto rounded-2xl border border-white/10 bg-slate-900/40">
        {/* Container que garante alinhamento perfeito no scroll horizontal */}
        <div className="min-w-max">
          <table className="border-separate border-spacing-0 w-full">
            {/* Cabeçalho fixo verticalmente */}
            <thead className="sticky top-0 z-30 bg-slate-800/95 backdrop-blur">
              <tr className="text-left text-slate-300 text-sm">
                <th
                  className="sticky left-0 z-40 bg-slate-800/95 backdrop-blur px-3 py-2 font-medium border-b border-white/10"
                  style={{ minWidth: LEFT_COL_WIDTH, width: LEFT_COL_WIDTH }}
                >
                  Ativos
                </th>

                {normalizedColumns.map((m) => {
                  const [mes, ano] = m.split("/");
                  return (
                    <th
                      key={m}
                      className="px-3 py-2 font-medium border-b border-white/10 text-slate-300 whitespace-nowrap"
                    >
                      <div className="flex items-center justify-center gap-2">
                        <div className="flex flex-col leading-tight text-center">
                          <span className="text-[13px] text-slate-200">{mes}</span>
                          <span className="text-[11px] text-slate-400">{ano}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => onDeleteMonth?.(m)}
                          className="p-1 rounded hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition"
                          aria-label={`Excluir mês ${m}`}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>

            {/* Corpo da tabela */}
            <tbody>
              {rows.map((row, rowIdx) => {
                const zebra = rowIdx % 2 === 0;
                return (
                  <tr
                    key={row.ativo}
                    className={`text-sm transition ${
                      zebra ? "bg-white/[0.03]" : "bg-transparent"
                    } hover:bg-white/[0.06]`}
                  >
                    <td
                      className="sticky left-0 z-20 bg-slate-900/80 backdrop-blur px-3 py-2 border-b border-white/05 text-slate-100 font-medium"
                      style={{ minWidth: LEFT_COL_WIDTH, width: LEFT_COL_WIDTH }}
                    >
                      {row.ativo}
                    </td>

                    {normalizedColumns.map((_, idx) => (
                      <td
                        key={idx}
                        className="px-3 py-2 border-b border-white/05 text-slate-200 whitespace-nowrap tabular-nums text-right"
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

        {/* RODAPÉ TOTAL FIXO NO FUNDO – AGORA PERFEITO */}
        {normalizedColumns.length > 0 && (
          <div className="absolute inset-x-0 bottom-0 h-12 pointer-events-none">
            <div className="relative h-full overflow-hidden">
              <div className="absolute inset-0 flex items-center">
                <div className="min-w-max w-full">
                  <table className="border-separate border-spacing-0 w-full">
                    <tfoot>
                      <tr className="bg-gradient-to-t from-slate-900 via-slate-800/95 to-slate-800/90 text-sm font-bold shadow-2xl">
                        <td
                          className="sticky left-0 z-50 bg-slate-900/95 backdrop-blur px-3 py-2 border-t-2 border-emerald-500/50 text-emerald-400 shadow-lg"
                          style={{ minWidth: LEFT_COL_WIDTH, width: LEFT_COL_WIDTH }}
                        >
                          TOTAL
                        </td>
                        {totaisColuna.map((total, i) => (
                          <td
                            key={i}
                            className="px-3 py-2 border-t-2 border-emerald-500/30 text-emerald-300 whitespace-nowrap tabular-nums text-right"
                          >
                            {fmt.format(total)}
                          </td>
                        ))}
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}