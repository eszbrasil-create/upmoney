// src/pages/Despesas.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Trash2, Download, Eraser } from "lucide-react";

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
const ANOS = [2025, 2026];

const CATEGORIAS = {
  RECEITA: [
    "Salário",
    "Pró-labore",
    "Renda extra",
    "Dividendos",
    "Outras receitas",
  ],
  DESPESA: [
    "Moradia",
    "Alimentação",
    "Transporte",
    "Saúde",
    "Educação",
    "Lazer",
    "Impostos/Taxas",
    "Investimentos",
    "Outras despesas",
  ],
};

function novaLinha(tipo = "DESPESA") {
  return {
    id: crypto.randomUUID(),
    tipo, // "RECEITA" | "DESPESA"
    descricao: "",
    categoria: "",
    valores: Array(12).fill(""),
  };
}

const lsKeyForAno = (ano) => `cc_despesas_${ano}`;

const initialAno = (() => {
  const atual = new Date().getFullYear();
  return ANOS.includes(atual) ? atual : ANOS[0];
})();

function normalizarLinhas(raw) {
  try {
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    if (!Array.isArray(parsed)) return [];
    return parsed.map((l) => ({
      id: l.id ?? crypto.randomUUID(),
      tipo: l.tipo === "RECEITA" ? "RECEITA" : "DESPESA",
      descricao: l.descricao ?? "",
      categoria: l.categoria ?? "",
      valores: Array(12)
        .fill("")
        .map((_, i) => (l.valores?.[i] ?? "")),
    }));
  } catch {
    return [];
  }
}

export default function DespesasPage() {
  // ===== Ano selecionado =====
  const [anoSelecionado, setAnoSelecionado] = useState(initialAno);

  // ===== Linhas: carrega do localStorage na criação =====
  const [linhas, setLinhas] = useState(() => {
    try {
      const raw = localStorage.getItem(lsKeyForAno(initialAno));
      return raw ? normalizarLinhas(raw) : [];
    } catch {
      return [];
    }
  });

  // Trocar ano
  const trocarAno = (ano) => {
    setAnoSelecionado(ano);
    try {
      const raw = localStorage.getItem(lsKeyForAno(ano));
      setLinhas(raw ? normalizarLinhas(raw) : []);
    } catch {
      setLinhas([]);
    }
  };

  // Salvar sempre que ano ou linhas mudarem
  useEffect(() => {
    try {
      localStorage.setItem(lsKeyForAno(anoSelecionado), JSON.stringify(linhas));
    } catch {}
  }, [linhas, anoSelecionado]);

  // Helpers de edição
  const setDescricao = (id, texto) =>
    setLinhas((prev) =>
      prev.map((l) => (l.id === id ? { ...l, descricao: texto } : l))
    );

  const setCategoria = (id, categoria) =>
    setLinhas((prev) =>
      prev.map((l) => (l.id === id ? { ...l, categoria } : l))
    );

  const setValor = (id, mesIdx, texto) =>
    setLinhas((prev) =>
      prev.map((l) =>
        l.id === id
          ? {
              ...l,
              valores: l.valores.map((v, i) => (i === mesIdx ? texto : v)),
            }
          : l
      )
    );

  const delLinha = (id) =>
    setLinhas((prev) => prev.filter((l) => l.id !== id));

  const fillAteFim = (id, mesIdx) =>
    setLinhas((prev) =>
      prev.map((l) => {
        if (l.id !== id) return l;
        const base = l.valores[mesIdx];
        const novos = l.valores.map((v, i) => (i >= mesIdx ? base : v));
        return { ...l, valores: novos };
      })
    );

  // Conversão para número inteiro (arredondado)
  const toNum = (x) => {
    if (x === "" || x === null || x === undefined) return 0;
    const n = Number(String(x).replace(",", "."));
    if (!Number.isFinite(n)) return 0;
    return Math.round(n);
  };

  const receitas = useMemo(
    () => linhas.filter((l) => l.tipo === "RECEITA"),
    [linhas]
  );
  const despesas = useMemo(
    () => linhas.filter((l) => l.tipo === "DESPESA"),
    [linhas]
  );

  const addReceita = () => setLinhas((prev) => [...prev, novaLinha("RECEITA")]);
  const addDespesa = () => setLinhas((prev) => [...prev, novaLinha("DESPESA")]);

  // Duplicar ano anterior
  const duplicarAnoAnterior = () => {
    const idx = ANOS.indexOf(anoSelecionado);
    if (idx <= 0) return;
    const anoAnterior = ANOS[idx - 1];
    try {
      const raw = localStorage.getItem(lsKeyForAno(anoAnterior));
      const linhasAntigas = raw ? normalizarLinhas(raw) : [];
      const copiadas = linhasAntigas.map((l) => ({
        ...l,
        id: crypto.randomUUID(),
      }));
      setLinhas(copiadas);
    } catch {}
  };

  // Totais
  const {
    totReceitas,
    totDespesas,
    saldo,
    totalReceitasAno,
    totalDespesasAno,
    saldoAno,
  } = useMemo(() => {
    const r = Array(12).fill(0);
    const d = Array(12).fill(0);
    for (const l of linhas) {
      for (let i = 0; i < 12; i++) {
        const n = toNum(l.valores[i]);
        if (l.tipo === "RECEITA") r[i] += n;
        else d[i] += n;
      }
    }
    const s = r.map((v, i) => v - d[i]);
    const sum = (arr) => arr.reduce((a, b) => a + b, 0);
    return {
      totReceitas: r,
      totDespesas: d,
      saldo: s,
      totalReceitasAno: sum(r),
      totalDespesasAno: sum(d),
      saldoAno: sum(r) - sum(d),
    };
  }, [linhas]);

  const fmtBR = (v) =>
    Math.round(v).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });

  const exportCSV = () => {
    const header = ["Tipo", "Categoria", "Descrição", ...MESES, "Total"];
    const rows = [
      ["— RECEITAS —", "", "", ...Array(12).fill(""), ""],
      ...receitas.map((l) => {
        const valoresNum = l.valores.map(toNum);
        const total = valoresNum.reduce((a, b) => a + b, 0);
        return [
          l.tipo,
          l.categoria ?? "",
          l.descricao,
          ...valoresNum.map(Math.round),
          Math.round(total),
        ];
      }),
      [
        "TOTAL RECEITAS",
        "",
        "",
        ...totReceitas.map(Math.round),
        Math.round(totalReceitasAno),
      ],
      ["— DESPESAS —", "", "", ...Array(12).fill(""), ""],
      ...despesas.map((l) => {
        const valoresNum = l.valores.map(toNum);
        const total = valoresNum.reduce((a, b) => a + b, 0);
        return [
          l.tipo,
          l.categoria ?? "",
          l.descricao,
          ...valoresNum.map(Math.round),
          Math.round(total),
        ];
      }),
      [
        "TOTAL DESPESAS",
        "",
        "",
        ...totDespesas.map(Math.round),
        Math.round(totalDespesasAno),
      ],
      [
        "SALDO (R-D)",
        "",
        "",
        ...saldo.map(Math.round),
        Math.round(saldoAno),
      ],
    ];

    const csv = [header, ...rows]
      .map((r) =>
        r
          .map((v) =>
            typeof v === "string" ? `"${v.replace(/"/g, '""')}"` : v
          )
          .join(";")
      )
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `despesas_${anoSelecionado}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const clearAll = () => {
    if (confirm(`Apagar todas as linhas de ${anoSelecionado}?`)) {
      setLinhas([]);
      try {
        localStorage.removeItem(lsKeyForAno(anoSelecionado));
      } catch {}
    }
  };

  // Layout – linhas mais compactas
  const colW = "w-20";
  const categoriaColWidth = "w-32";
  const descColWidth = "w-[220px]";
  const actionsColWidth = "w-14";
  const tableMinW = "min-w-[1480px]";

  const cellBase =
    "px-2 py-0.5 border-t border-slate-700 text-right text-xs whitespace-nowrap";
  const headBase =
    "px-2 py-0.5 border-t border-slate-700 text-slate-300 text-xs font-medium text-right";
  const firstColHead =
    "px-2 py-0.5 border-t border-slate-700 text-slate-300 text-sm font-semibold text-left";
  const firstColCell =
    "px-2 py-0.5 border-t border-slate-700 text-sm text-left";

  // versões sem cor para o saldo
  const headBaseNoColor =
    "px-2 py-0.5 border-t border-slate-700 text-xs font-medium text-right";
  const firstColHeadNoColor =
    "px-2 py-0.5 border-t border-slate-700 text-sm font-semibold text-left";

  const SectionDivider = ({ label, variant }) => (
    <tr>
      <td colSpan={MESES.length + 4} className="py-2">
        <div className="flex items-center gap-3">
          <div className="h-0.5 w-full bg-slate-700" />
          <span
            className={[
              "text-xs uppercase tracking-wider",
              variant === "green" ? "text-emerald-300 font-semibold" : "",
              variant === "red" ? "text-rose-300 font-semibold" : "",
            ]
              .join(" ")
              .trim()}
          >
            {label}
          </span>
          <div className="h-0.5 w-full bg-slate-700" />
        </div>
      </td>
    </tr>
  );

  // ===== Navegação por teclado =====
  const focusCell = (sec, row, col) => {
    const el = document.querySelector(
      `input[data-sec="${sec}"][data-row="${row}"][data-col="${col}"]`
    );
    if (el) el.focus();
  };

  const focusDesc = (sec, row) => {
    const el = document.querySelector(
      `input[data-dsec="${sec}"][data-drow="${row}"]`
    );
    if (el) el.focus();
  };

  const handleKeyVal = (sec, rowIdx, colIdx) => (e) => {
    const key = e.key;

    if (key === "Enter" || key === "ArrowRight") {
      e.preventDefault();
      const next = colIdx + 1;
      if (next < 12) {
        focusCell(sec, rowIdx, next);
      }
      return;
    }

    if (key === "ArrowLeft") {
      e.preventDefault();
      if (colIdx > 0) {
        focusCell(sec, rowIdx, colIdx - 1);
      } else {
        focusDesc(sec, rowIdx);
      }
      return;
    }

    if (key === "ArrowDown") {
      e.preventDefault();
      focusCell(sec, rowIdx + 1, colIdx);
      return;
    }

    if (key === "ArrowUp") {
      e.preventDefault();
      if (rowIdx > 0) {
        focusCell(sec, rowIdx - 1, colIdx);
      }
      return;
    }
  };

  const handleKeyDesc = (sec, rowIdx) => (e) => {
    const key = e.key;

    if (key === "Enter" || key === "ArrowDown") {
      e.preventDefault();
      focusDesc(sec, rowIdx + 1);
      return;
    }

    if (key === "ArrowUp") {
      e.preventDefault();
      if (rowIdx > 0) focusDesc(sec, rowIdx - 1);
      return;
    }

    if (key === "ArrowRight") {
      e.preventDefault();
      focusCell(sec, rowIdx, 0);
      return;
    }
  };

  // Classe para a linha do saldo (ano inteiro)
  const saldoRowClass =
    saldoAno >= 0 ? "text-emerald-300 font-bold" : "text-rose-300 font-bold";

  const percGasto =
    totalReceitasAno > 0 ? (totalDespesasAno / totalReceitasAno) * 100 : 0;
  const saldoMedioMensal = saldoAno / 12;

  const idxAno = ANOS.indexOf(anoSelecionado);
  const temAnoAnterior = idxAno > 0;

  return (
    <div className="h-screen flex flex-col pr-0 pl-0">
      {/* Cabeçalho + ações */}
      <div className="mb-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-slate-100 text-3xl font-semibold">
              Despesas
            </h1>
            <div className="inline-flex rounded-full bg-slate-800 p-1 text-xs">
              {ANOS.map((ano) => (
                <button
                  key={ano}
                  onClick={() => trocarAno(ano)}
                  className={[
                    "px-3 py-1 rounded-full transition-colors",
                    anoSelecionado === ano
                      ? "bg-slate-100 text-slate-900 font-semibold"
                      : "text-slate-300 hover:bg-slate-700",
                  ].join(" ")}
                >
                  {ano}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {temAnoAnterior && (
              <button
                onClick={duplicarAnoAnterior}
                className="px-3 py-2 rounded-md bg-slate-700 text-white text-sm hover:bg-slate-600"
                title="Copiar receitas e despesas do ano anterior"
              >
                Duplicar ano anterior
              </button>
            )}

            <button
              onClick={addReceita}
              className="px-3 py-2 rounded-md bg-emerald-600 text-white text-sm hover:bg-emerald-500"
            >
              + Receita
            </button>
            <button
              onClick={addDespesa}
              className="px-3 py-2 rounded-md bg-rose-600 text-white text-sm hover:bg-rose-500"
            >
              + Despesa
            </button>

            <button
              onClick={exportCSV}
              title="Exportar CSV"
              className="flex items-center gap-1 px-3 py-2 rounded-md bg-slate-700 text-white text-sm hover:bg-slate-600"
            >
              <Download size={16} /> Exportar
            </button>

            <button
              onClick={clearAll}
              title="Limpar tudo"
              className="flex items-center gap-1 px-3 py-2 rounded-md bg-slate-800 text-white text-sm hover:bg-slate-700"
            >
              <Eraser size={16} /> Limpar
            </button>
          </div>
        </div>

        <div className="mt-2 text-[11px] sm:text-xs text-slate-400">
          {totalReceitasAno > 0 ? (
            <>
              Em{" "}
              <span className="font-semibold text-slate-200">
                {anoSelecionado}
              </span>{" "}
              você está gastando{" "}
              <span className="font-semibold text-rose-300">
                {percGasto.toFixed(0)}%
              </span>{" "}
              do que ganha. Saldo médio mensal:{" "}
              <span
                className={[
                  "font-semibold",
                  saldoMedioMensal >= 0 ? "text-emerald-300" : "text-rose-300",
                ].join(" ")}
              >
                {fmtBR(saldoMedioMensal)}
              </span>
              .
            </>
          ) : (
            <>Preencha suas receitas para ver o resumo anual de {anoSelecionado}.</>
          )}
        </div>
      </div>

      {/* Tabela */}
      <div className="flex-1 overflow-hidden rounded-lg border border-slate-800 bg-slate-900/30">
        <div className="relative h-full overflow-y-auto">
          <table className={`table-fixed ${tableMinW} w-full`}>
            <colgroup>
              <col className={actionsColWidth} />
              <col className={categoriaColWidth} />
              <col className={descColWidth} />
              {MESES.map((_, i) => (
                <col key={`c${i}`} className={colW} />
              ))}
              <col className={colW} />
            </colgroup>

            <thead className="sticky top-0 z-30 bg-slate-900">
              <tr>
                <th className="px-2 py-1 border-t border-slate-700 text-slate-300 text-xs font-medium text-center sticky left-0 bg-slate-900 z-30" />
                <th
                  className={`${firstColHead} sticky left-[3.5rem] bg-slate-900 z-30 text-xs`}
                >
                  Categoria
                </th>
                <th
                  className={`${firstColHead} sticky left-[11.5rem] bg-slate-900 z-20`}
                >
                  Descrição
                </th>
                {MESES.map((m) => (
                  <th key={m} className={headBase}>
                    {m}
                  </th>
                ))}
                <th className={headBase}>Total</th>
              </tr>
            </thead>

            <tbody>
              {/* RECEITAS */}
              <SectionDivider label="Receitas" variant="green" />

              {receitas.map((l, rIdx) => {
                const valoresNum = l.valores.map(toNum);
                const somaLinha = valoresNum.reduce((a, b) => a + b, 0);
                const categoriasRec = CATEGORIAS.RECEITA || [];
                return (
                  <tr key={l.id} className="hover:bg-slate-800/30">
                    <td className="px-2 py-0.5 border-t border-slate-700 text-center sticky left-0 bg-slate-900">
                      <button
                        onClick={() => delLinha(l.id)}
                        className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-rose-400"
                        title="Excluir linha"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>

                    <td
                      className={`${firstColCell} sticky left-[3.5rem] bg-slate-900`}
                    >
                      <select
                        className="w-full bg-slate-900 border border-slate-700 rounded px-1 py-0.5 text-[11px] text-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-500"
                        value={l.categoria}
                        onChange={(e) => setCategoria(l.id, e.target.value)}
                      >
                        <option value="">Sem categoria</option>
                        {categoriasRec.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </td>

                    <td
                      className={`${firstColCell} sticky left-[11.5rem] bg-slate-900`}
                    >
                      <input
                        className="w-full bg-transparent outline-none text-slate-100 placeholder:text-slate-500 text-sm"
                        placeholder="Nova receita"
                        value={l.descricao}
                        onChange={(e) =>
                          setDescricao(l.id, e.target.value)
                        }
                        onKeyDown={handleKeyDesc("rec", rIdx)}
                        data-dsec="rec"
                        data-drow={rIdx}
                      />
                    </td>

                    {MESES.map((_, i) => (
                      <td key={i} className={cellBase}>
                        <input
                          className="w-full bg-transparent outline-none text-slate-100 text-right placeholder:text-slate-600 text-xs"
                          inputMode="numeric"
                          placeholder="0"
                          value={String(l.valores[i] ?? "")}
                          onChange={(e) => setValor(l.id, i, e.target.value)}
                          onBlur={(e) => {
                            const n = toNum(e.target.value);
                            setValor(l.id, i, n === 0 ? "" : String(n));
                          }}
                          onDoubleClick={() => fillAteFim(l.id, i)}
                          onKeyDown={handleKeyVal("rec", rIdx, i)}
                          data-sec="rec"
                          data-row={rIdx}
                          data-col={i}
                          title="Setas: navegar • Enter/→: próxima célula • Duplo clique: copiar até o fim"
                        />
                      </td>
                    ))}

                    <td
                      className={`${cellBase} font-semibold text-slate-200`}
                    >
                      {fmtBR(somaLinha)}
                    </td>
                  </tr>
                );
              })}

              {/* TOTAL RECEITAS – mesma altura da linha de Total Despesas */}
              <tr className="bg-slate-900 h-8">
                <td className="sticky left-0 bg-slate-900 border-t border-slate-700" />
                <td
                  className={`${firstColHead} sticky left-[3.5rem] bg-slate-900 text-emerald-300 text-xs`}
                />
                <td
                  className={`${firstColHead} text-emerald-300 sticky left-[11.5rem] bg-slate-900`}
                >
                  Total Receitas
                </td>
                {totReceitas.map((v, i) => (
                  <td
                    key={`tr${i}`}
                    className={`${headBase} text-emerald-300 bg-slate-900`}
                  >
                    {fmtBR(v)}
                  </td>
                ))}
                <td
                  className={`${headBase} font-semibold text-emerald-300 bg-slate-900`}
                >
                  {fmtBR(totalReceitasAno)}
                </td>
              </tr>

              {/* DESPESAS */}
              <SectionDivider label="Despesas" variant="red" />

              {despesas.map((l, dIdx) => {
                const valoresNum = l.valores.map(toNum);
                const somaLinha = valoresNum.reduce((a, b) => a + b, 0);
                const categoriasDes = CATEGORIAS.DESPESA || [];
                return (
                  <tr key={l.id} className="hover:bg-slate-800/30">
                    <td className="px-2 py-0.5 border-t border-slate-700 text-center sticky left-0 bg-slate-900">
                      <button
                        onClick={() => delLinha(l.id)}
                        className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-rose-400"
                        title="Excluir linha"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>

                    <td
                      className={`${firstColCell} sticky left-[3.5rem] bg-slate-900`}
                    >
                      <select
                        className="w-full bg-slate-900 border border-slate-700 rounded px-1 py-0.5 text-[11px] text-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-500"
                        value={l.categoria}
                        onChange={(e) => setCategoria(l.id, e.target.value)}
                      >
                        <option value="">Sem categoria</option>
                        {categoriasDes.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </td>

                    <td
                      className={`${firstColCell} sticky left-[11.5rem] bg-slate-900`}
                    >
                      <input
                        className="w-full bg-transparent outline-none text-slate-100 placeholder:text-slate-500 text-sm"
                        placeholder="Nova despesa"
                        value={l.descricao}
                        onChange={(e) =>
                          setDescricao(l.id, e.target.value)
                        }
                        onKeyDown={handleKeyDesc("des", dIdx)}
                        data-dsec="des"
                        data-drow={dIdx}
                      />
                    </td>

                    {MESES.map((_, i) => (
                      <td key={i} className={cellBase}>
                        <input
                          className="w-full bg-transparent outline-none text-slate-100 text-right placeholder:text-slate-600 text-xs"
                          inputMode="numeric"
                          placeholder="0"
                          value={String(l.valores[i] ?? "")}
                          onChange={(e) => setValor(l.id, i, e.target.value)}
                          onBlur={(e) => {
                            const n = toNum(e.target.value);
                            setValor(l.id, i, n === 0 ? "" : String(n));
                          }}
                          onDoubleClick={() => fillAteFim(l.id, i)}
                          onKeyDown={handleKeyVal("des", dIdx, i)}
                          data-sec="des"
                          data-row={dIdx}
                          data-col={i}
                          title="Setas: navegar • Enter/→: próxima célula • Duplo clique: copiar até o fim"
                        />
                      </td>
                    ))}

                    <td
                      className={`${cellBase} font-semibold text-slate-200`}
                    >
                      {fmtBR(somaLinha)}
                    </td>
                  </tr>
                );
              })}

              {/* TOTAL DESPESAS – mesma estrutura e altura da Total Receitas */}
              <tr className="bg-slate-900 h-8">
                <td className="sticky left-0 bg-slate-900 border-t border-slate-700" />
                <td
                  className={`${firstColHead} sticky left-[3.5rem] bg-slate-900 text-rose-300 text-xs`}
                />
                <td
                  className={`${firstColHead} text-rose-300 sticky left-[11.5rem] bg-slate-900`}
                >
                  Total Despesas
                </td>
                {totDespesas.map((v, i) => (
                  <td
                    key={`td${i}`}
                    className={`${headBase} text-rose-300 bg-slate-900`}
                  >
                    {fmtBR(v)}
                  </td>
                ))}
                <td
                  className={`${headBase} font-semibold text-rose-300 bg-slate-900`}
                >
                  {fmtBR(totalDespesasAno)}
                </td>
              </tr>

              {/* SALDO – fixo e colorido por saldoAno */}
              <tr>
                <td
                  className="sticky bottom-0 left-0 z-30 bg-slate-900 border-t border-slate-700"
                  style={{ boxShadow: "0 -1px 0 0 rgba(30,41,59,1)" }}
                />
                <td
                  className={`${firstColHeadNoColor} sticky bottom-0 left-[3.5rem] z-30 bg-slate-900 ${saldoRowClass} text-xs`}
                  style={{ boxShadow: "0 -1px 0 0 rgba(30,41,59,1)" }}
                />
                <td
                  className={`${firstColHeadNoColor} sticky bottom-0 left-[11.5rem] z-30 bg-slate-900 ${saldoRowClass}`}
                  style={{ boxShadow: "0 -1px 0 0 rgba(30,41,59,1)" }}
                >
                  Saldo (R − D)
                </td>
                {saldo.map((v, i) => (
                  <td
                    key={`sl${i}`}
                    className={`${headBaseNoColor} sticky bottom-0 z-30 bg-slate-900 ${saldoRowClass}`}
                    style={{ boxShadow: "0 -1px 0 0 rgba(30,41,59,1)" }}
                  >
                    {fmtBR(v)}
                  </td>
                ))}
                <td
                  className={`${headBaseNoColor} sticky bottom-0 z-30 bg-slate-900 ${saldoRowClass}`}
                  style={{ boxShadow: "0 -1px 0 0 rgba(30,41,59,1)" }}
                >
                  {fmtBR(saldoAno)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
