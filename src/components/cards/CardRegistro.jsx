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
    const found = MESES.find(m => m.toLowerCase() === mes.toLowerCase());
    if (found) mes = found;
  }

  // ano 2 dígitos -> 4 dígitos
  if (/^\d{2}$/.test(ano)) ano = `20${ano}`;

  return `${mes}/${ano}`;
}

export default function CardRegistro({ columns = [], rows = [], onDeleteMonth }) {
  // formato numérico sem moeda e sem casas decimais
  const fmt = useMemo(
    () =>
      new Intl.NumberFormat("pt-BR", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }),
    []
  );

  // colunas raw + label
  const colMap = useMemo(
    () => columns.map((raw) => ({ raw, label: normalizeMesAno(raw) })),
    [columns]
  );

  // totais por coluna
  const totaisColuna = useMemo(() => {
    return colMap.map((_, colIdx) =>
      rows.reduce((acc, r) => acc + (r.valores?.[colIdx] || 0), 0)
    );
  }, [colMap, rows]);

  // ✅ largura menor da coluna fixa
  const FIXED_W = 140;

  return (
    <div className="rounded-3xl bg-slate-800/70 border border-white/10 shadow-lg w-[720px] h-[420px] p-4 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="text-slate-100 font-semibold text-lg">
          Registros
        </div>
        <div className="text-[11px] text-slate-400">
          Registros salvos por mês
        </div>
      </div>

      {/* Tabela com scroll interno */}
      <div className="relative h-[350px] overflow-x-auto overflow-y-auto pb-2 rounded-2xl border border-white/10 bg-slate-900/40">
        <table className="min-w-full border-separate border-spacing-0">
          {/* Cabeçalho fixo */}
          <thead className="sticky top-0 z-30 bg-slate-800/90 backdrop-blur">
            <tr className="text-left text-slate-300 text-sm">
              {/* Coluna fixa (Ativos) */}
              <th
                className="sticky left-0 z-40 bg-slate-800/90 backdrop-blur px-3 py-2 font-medium border-b border-white/10"
                style={{ minWidth: FIXED_W, width: FIXED_W }}
              >
                Ativos
              </th>

              {/* Meses + lixeira */}
              {colMap.map(({ raw, label }) => (
                <th
                  key={raw}
                  className="px-3 py-2 font-medium border-b border-white/10 text-slate-300 whitespace-nowrap"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-slate-200">{label}</span>
                    <button
                      type="button"
                      onClick={() => onDeleteMonth?.(raw)}
                      className="p-1 rounded-md hover:bg-white/10 text-slate-400 hover:text-rose-400 transition"
                      aria-label={`Excluir mês ${label}`}
                      title={`Excluir mês ${label}`}
                    >
                      <Trash2 size={14} strokeWidth={2} />
                    </button>
                  </div>
                </th>
              ))}
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
                  {/* Primeira coluna fixa */}
                  <td
                    className="sticky left-0 z-10 bg-slate-950/60 px-3 py-2 border-b border-white/10 text-slate-100 font-medium"
                    style={{ minWidth: FIXED_W, width: FIXED_W }}
                  >
                    {row.ativo}
                  </td>

                  {/* Valores por mês — ✅ alinhados à esquerda */}
                  {colMap.map((_, idx) => (
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

          {/* Rodapé fixo */}
          <tfoot className="sticky bottom-0 z-30 bg-slate-800/90 backdrop-blur">
            <tr className="text-sm">
              {/* Total fixo à esquerda (mesma largura de Ativos) */}
              <td
                className="sticky left-0 z-50 bg-slate-800/90 backdrop-blur px-3 py-2 border-t border-white/10 text-slate-100 font-semibold"
                style={{ minWidth: FIXED_W, width: FIXED_W }}
              >
                Total
              </td>

              {/* Totais por coluna — ✅ alinhados à esquerda */}
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
  );
}
