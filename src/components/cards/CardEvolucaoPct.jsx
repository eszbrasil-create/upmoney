// src/components/cards/CardEvolucaoPct.jsx
import React, { useMemo } from "react";

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

const LEFT_COL_WIDTH = 130;

// normaliza "3/25", "mar/2025" etc -> "Mar/2025"
function normalizeMesAno(str) {
  if (!str || !str.includes("/")) return str;
  let [mes, ano] = str.split("/").map((s) => s.trim());

  // mês numérico -> MMM
  if (/^\d+$/.test(mes)) {
    const idx = Number(mes) - 1;
    if (idx >= 0 && idx < 12) mes = MESES[idx];
  } else {
    // texto -> MMM
    mes = mes.charAt(0).toUpperCase() + mes.slice(1, 3).toLowerCase();
    const found = MESES.find((m) => m.toLowerCase() === mes.toLowerCase());
    if (found) mes = found;
  }

  // ano 2 dígitos -> 4 dígitos
  if (/^\d{2}$/.test(ano)) ano = `20${ano}`;
  return `${mes}/${ano}`;
}

// formata percentual sem casas: +12%, -3%
const fmtPct = (x) => `${x >= 0 ? "+" : ""}${Math.round(x)}%`;

export default function CardEvolucaoPct({ columns = [], rows = [] }) {
  /**
   * 1) Metadados das colunas (like CardRegistro):
   *    - normaliza rótulo
   *    - descobre índice do mês
   *    - converte ano p/ número
   *    - ordena por ano (menor -> maior) e depois mês (Jan -> Dez)
   */
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

    // ordena: ano asc, depois mês asc
    meta.sort((a, b) => {
      if (a.yearNumber !== b.yearNumber) {
        return a.yearNumber - b.yearNumber;
      }
      return a.monthIndex - b.monthIndex;
    });

    return meta;
  }, [columns]);

  const normalizedColumns = useMemo(
    () => columnMeta.map((m) => m.label),
    [columnMeta]
  );

  /**
   * 2) Linhas por ativo: % vs mês anterior (na ordem de columnMeta)
   */
  const pctRows = useMemo(() => {
    return rows.map((r) => {
      // valores do ativo reordenados conforme columnMeta
      const orderedVals = columnMeta.map(
        ({ originalIndex }) => r.valores?.[originalIndex] ?? 0
      );

      const pcts = orderedVals.map((v, i) => {
        if (i === 0) return null;
        const atual = Number(v) || 0;
        const prev = Number(orderedVals[i - 1]) || 0;
        if (prev === 0) return null;
        return ((atual - prev) / prev) * 100;
      });

      return { ativo: r.ativo, pcts };
    });
  }, [rows, columnMeta]);

  /**
   * 3) Total % por mês (soma de todos ativos, na ordem de columnMeta)
   */
  const totalPct = useMemo(() => {
    const sums = columnMeta.map(({ originalIndex }) =>
      rows.reduce(
        (acc, r) => acc + (Number(r.valores?.[originalIndex]) || 0),
        0
      )
    );

    return sums.map((sum, i) => {
      if (i === 0) return null;
      const prev = Number(sums[i - 1]) || 0;
      if (prev === 0) return null;
      return ((sum - prev) / prev) * 100;
    });
  }, [rows, columnMeta]);

  return (
    <div className="rounded-3xl bg-slate-800/70 border border-white/10 shadow-lg w-[640px] h-[360px] p-4 overflow-hidden shrink-0">
      {/* HEADER DO CARD */}
      <div className="flex items-center justify-between mb-1">
        <div className="text-slate-100 font-semibold text-lg">Evolução %</div>
        <div className="text-[11px] text-slate-400">% vs mês anterior</div>
      </div>

      {/* ÁREA PRINCIPAL: tabela rolável + TOTAL fixo (modelo do CardRegistro) */}
      <div className="relative h-[310px] rounded-2xl border border-white/10 bg-slate-900/40">
        {/* Miolo rolável (header + linhas), com scroll X/Y; TOTAL fica por cima */}
        <div className="absolute inset-x-0 top-0 bottom-10 overflow-auto z-10">
          <table className="min-w-max w-full border-separate border-spacing-0">
            {/* Cabeçalho (grudado no topo) */}
            <thead className="sticky top-0 z-20 bg-slate-800/90 backdrop-blur">
              <tr className="text-left text-slate-300 text-sm">
                {/* Coluna fixa Ativos */}
                <th
                  className="sticky left-0 z-30 bg-slate-800/90 backdrop-blur px-3 py-1 font-medium border-b border-white/10"
                  style={{ minWidth: LEFT_COL_WIDTH, width: LEFT_COL_WIDTH }}
                >
                  Ativos
                </th>

                {/* Meses/anos ordenados (ano + mês), mês em cima / ano embaixo */}
                {columnMeta.map((col) => (
                  <th
                    key={col.label}
                    className="px-3 py-1 font-medium border-b border-white/10 text-slate-300 whitespace-nowrap"
                  >
                    <div className="leading-tight text-left">
                      <div className="text-[13px] text-slate-200">
                        {col.mes}
                      </div>
                      <div className="text-[12px] text-slate-400">
                        {col.ano}
                      </div>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            {/* Corpo */}
            <tbody>
              {pctRows.map((row, rowIdx) => {
                const zebra = rowIdx % 2 === 0;
                return (
                  <tr
                    key={row.ativo}
                    className={`text-sm ${
                      zebra ? "bg-white/[0.02]" : "bg-transparent"
                    } hover:bg-white/[0.04] transition`}
                  >
                    {/* Ativo fixo na esquerda */}
                    <td
                      className="sticky left-0 z-10 bg-slate-950/60 px-3 py-2 border-b border-white/10 text-slate-100 font-medium"
                      style={{ minWidth: LEFT_COL_WIDTH, width: LEFT_COL_WIDTH }}
                    >
                      {row.ativo}
                    </td>

                    {/* % por mês (na mesma ordem do cabeçalho) */}
                    {row.pcts.map((v, i) => {
                      if (i === 0 || v === null) {
                        return (
                          <td
                            key={i}
                            className="px-3 py-2 border-b border-white/10 text-slate-500 whitespace-nowrap text-left tabular-nums"
                          >
                            —
                          </td>
                        );
                      }

                      const isUp = v >= 0;
                      return (
                        <td
                          key={i}
                          className={`px-3 py-2 border-b border-white/10 whitespace-nowrap text-left tabular-nums ${
                            isUp ? "text-emerald-400" : "text-rose-400"
                          }`}
                        >
                          {fmtPct(v)}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}

              {pctRows.length === 0 && (
                <tr>
                  <td
                    colSpan={1 + normalizedColumns.length}
                    className="px-3 py-4 text-center text-xs text-slate-500"
                  >
                    Nenhum dado para calcular evolução.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* TOTAL FIXO NO FUNDO (barra por cima, miolo rola por trás) */}
        {columnMeta.length > 0 && (
          <div className="absolute inset-x-0 bottom-0 z-20 bg-slate-800/95 border-t border-white/10">
            <table className="min-w-max w-full border-separate border-spacing-0">
              <tbody>
                <tr className="bg-slate-800/95 text-sm">
                  <td
                    className="sticky left-0 z-30 bg-slate-800/95 px-3 py-2 text-slate-100 font-semibold"
                    style={{ minWidth: LEFT_COL_WIDTH, width: LEFT_COL_WIDTH }}
                  >
                    Total
                  </td>

                  {totalPct.map((v, i) => {
                    if (i === 0 || v === null) {
                      return (
                        <td
                          key={i}
                          className="px-3 py-2 text-slate-400 whitespace-nowrap text-left tabular-nums"
                        >
                          —
                        </td>
                      );
                    }

                    const isUp = v >= 0;
                    return (
                      <td
                        key={i}
                        className={`px-3 py-2 whitespace-nowrap text-left tabular-nums ${
                          isUp ? "text-emerald-400" : "text-rose-400"
                        }`}
                      >
                        {fmtPct(v)}
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
