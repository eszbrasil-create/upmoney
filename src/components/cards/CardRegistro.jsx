// src/components/cards/CardRegistro.jsx
import React, { useMemo } from "react";
import { Trash2 } from "lucide-react";

export default function CardRegistro({ columns = [], rows = [], onDeleteMonth }) {
  const fmt = useMemo(
    () =>
      new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
        maximumFractionDigits: 2,
      }),
    []
  );

  // Totais por mês (cada coluna)
  const totaisColuna = useMemo(() => {
    return columns.map((_, colIdx) =>
      rows.reduce((acc, r) => acc + (r.valores?.[colIdx] || 0), 0)
    );
  }, [columns, rows]);

  return (
    <div className="rounded-2xl bg-slate-800/70 border border-white/10 shadow-lg w-[640px] h-[360px] p-4">
      <div className="mb-3 text-slate-100 font-semibold">Registros</div>

      {/* Scroll vertical + horizontal apenas dentro da área da tabela */}
      <div className="relative h-[300px] overflow-x-auto overflow-y-auto pb-2">
        <table className="min-w-full border-separate border-spacing-0">
          {/* Cabeçalho fixo no topo */}
          <thead className="sticky top-0 z-30 bg-slate-800/80 backdrop-blur">
            <tr className="text-left text-slate-300 text-sm">
              {/* Coluna fixa (header) */}
              <th
                className="sticky left-0 z-40 bg-slate-800/80 backdrop-blur px-3 py-2 font-medium border-b border-white/10"
                style={{ minWidth: 160, width: 160 }}
              >
                Ativos
              </th>

              {/* Meses com lixeira */}
              {columns.map((m) => (
                <th
                  key={m}
                  className="px-3 py-2 font-medium border-b border-white/10 text-slate-300 whitespace-nowrap"
                >
                  <div className="flex items-center gap-2">
                    <span>{m}</span>
                    <button
                      type="button"
                      onClick={() => onDeleteMonth?.(m)}
                      className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-rose-400 transition"
                      aria-label={`Excluir mês ${m}`}
                      title={`Excluir mês ${m}`}
                    >
                      <Trash2 size={14} strokeWidth={2} />
                    </button>
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {rows.map((row) => (
              <tr key={row.ativo} className="text-sm">
                {/* Primeira coluna fixa (mesma cor/transparência das demais) */}
                <td
                  className="sticky left-0 z-10 bg-slate-850/70 px-3 py-2 border-b border-white/10 text-slate-100"
                  style={{ minWidth: 160, width: 160 }}
                >
                  {row.ativo}
                </td>

                {/* Valores por mês */}
                {columns.map((_, idx) => (
                  <td
                    key={idx}
                    className="px-3 py-2 border-b border-white/10 text-slate-200 whitespace-nowrap"
                  >
                    {fmt.format(row.valores?.[idx] ?? 0)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>

          {/* Rodapé fixo no fundo (acima da coluna fixa) */}
          <tfoot className="sticky bottom-0 z-30 bg-slate-800/80 backdrop-blur">
            <tr className="text-sm">
              {/* Célula "Total" fixa à esquerda, com z maior que a 1ª coluna */}
              <td
                className="sticky left-0 z-50 bg-slate-800/80 backdrop-blur px-3 py-2 border-t border-white/10 text-slate-100 font-semibold"
                style={{ minWidth: 160, width: 160 }}
              >
                Total
              </td>

              {/* Totais por coluna */}
              {totaisColuna.map((v, i) => (
                <td
                  key={i}
                  className="px-3 py-2 border-t border-white/10 text-slate-100 font-semibold whitespace-nowrap"
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
