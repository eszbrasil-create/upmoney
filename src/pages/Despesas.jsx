// src/pages/Despesas.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Trash2, Download, Eraser } from "lucide-react";
import { exportRelatorioPDF } from "../utils/exportRelatorioPDF";

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
  RECEITA: ["Salário", "Pró-labore", "Renda extra", "Dividendos", "Outras receitas"],
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

// ===== Layout / Sticky (px coerentes) =====
// w-14 = 56px, w-32 = 128px
const ACTIONS_PX = 56;
const CATEG_PX = 128;
const DESC_PX = 220;
const LEFT_CATEG = ACTIONS_PX; // 56
const LEFT_DESC = ACTIONS_PX + CATEG_PX; // 184

const uid = () => {
  try {
    return crypto.randomUUID();
  } catch {
    return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
  }
};

function novaLinha(tipo = "DESPESA") {
  return {
    id: uid(),
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
      id: l.id ?? uid(),
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

// ===== Parser BR =====
function parseBRNumber(input) {
  if (input === "" || input === null || input === undefined) return 0;

  let s = String(input).trim();
  if (!s) return 0;

  // remove espaços e símbolos básicos
  s = s.replace(/\s+/g, "").replace(/[R$\u00A0]/g, "");

  // se tiver vírgula, assume decimal BR
  if (s.includes(",")) {
    // remove separadores de milhar "."
    s = s.replace(/\./g, "");
    // troca vírgula por ponto decimal
    s = s.replace(/,/g, ".");
    const n = Number(s);
    return Number.isFinite(n) ? n : 0;
  }

  // sem vírgula: pode ser "1200", "1200.50" ou "1.200"
  const dots = (s.match(/\./g) || []).length;
  if (dots >= 2) {
    const n = Number(s.replace(/\./g, ""));
    return Number.isFinite(n) ? n : 0;
  }

  if (dots === 1) {
    const [a, b] = s.split(".");
    // se b tem exatamente 3 dígitos e a não é vazio => provável milhar: "1.200"
    if (/^\d{3}$/.test(b) && a && /^\d+$/.test(a)) {
      const n = Number(a + b);
      return Number.isFinite(n) ? n : 0;
    }
    // caso contrário trata como decimal: "1200.50"
    const n = Number(s);
    return Number.isFinite(n) ? n : 0;
  }

  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
}

const toInt = (x) => Math.round(parseBRNumber(x));

export default function DespesasPage() {
  // ===== Ano selecionado =====
  const [anoSelecionado, setAnoSelecionado] = useState(initialAno);

  // ===== Linhas =====
  const [linhas, setLinhas] = useState(() => {
    try {
      const raw = localStorage.getItem(lsKeyForAno(initialAno));
      return raw ? normalizarLinhas(raw) : [];
    } catch {
      return [];
    }
  });

  // Hint de replicar (duplo clique)
  const [showReplicarHint, setShowReplicarHint] = useState(false);
  const hintTimerRef = useRef(null);

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

  // ===== Salvar com debounce =====
  useEffect(() => {
    const t = setTimeout(() => {
      try {
        localStorage.setItem(lsKeyForAno(anoSelecionado), JSON.stringify(linhas));
      } catch {}
    }, 420);

    return () => clearTimeout(t);
  }, [linhas, anoSelecionado]);

  // Helpers de edição
  const setDescricao = (id, texto) =>
    setLinhas((prev) => prev.map((l) => (l.id === id ? { ...l, descricao: texto } : l)));

  const setCategoria = (id, categoria) =>
    setLinhas((prev) => prev.map((l) => (l.id === id ? { ...l, categoria } : l)));

  const setValor = (id, mesIdx, texto) =>
    setLinhas((prev) =>
      prev.map((l) =>
        l.id === id
          ? { ...l, valores: l.valores.map((v, i) => (i === mesIdx ? texto : v)) }
          : l
      )
    );

  const delLinha = (id) => setLinhas((prev) => prev.filter((l) => l.id !== id));

  const fillAteFim = (id, mesIdx) =>
    setLinhas((prev) =>
      prev.map((l) => {
        if (l.id !== id) return l;
        const base = l.valores[mesIdx];
        const novos = l.valores.map((v, i) => (i >= mesIdx ? base : v));
        return { ...l, valores: novos };
      })
    );

  const receitas = useMemo(() => linhas.filter((l) => l.tipo === "RECEITA"), [linhas]);
  const despesas = useMemo(() => linhas.filter((l) => l.tipo === "DESPESA"), [linhas]);

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
      const copiadas = linhasAntigas.map((l) => ({ ...l, id: uid() }));
      setLinhas(copiadas);
    } catch {}
  };

  // ===== Totais + categorias =====
  const {
    totReceitas,
    totDespesas,
    saldo,
    totalReceitasAno,
    totalDespesasAno,
    saldoAno,
    topCategoriasAno,
  } = useMemo(() => {
    const r = Array(12).fill(0);
    const d = Array(12).fill(0);
    const catAno = {};

    for (const l of linhas) {
      for (let i = 0; i < 12; i++) {
        const n = toInt(l.valores[i]);
        if (l.tipo === "RECEITA") {
          r[i] += n;
        } else {
          d[i] += n;
          const cat = (l.categoria || "Sem categoria").trim() || "Sem categoria";
          catAno[cat] = (catAno[cat] || 0) + n;
        }
      }
    }

    const s = r.map((v, i) => v - d[i]);
    const sum = (arr) => arr.reduce((a, b) => a + b, 0);

    const totalD = sum(d);
    const top = Object.entries(catAno)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([cat, valor]) => ({
        cat,
        valor,
        perc: totalD > 0 ? (valor / totalD) * 100 : 0,
      }));

    return {
      totReceitas: r,
      totDespesas: d,
      saldo: s,
      totalReceitasAno: sum(r),
      totalDespesasAno: totalD,
      saldoAno: sum(r) - totalD,
      topCategoriasAno: top,
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
        const valoresNum = l.valores.map(toInt);
        const total = valoresNum.reduce((a, b) => a + b, 0);
        return [l.tipo, l.categoria ?? "", l.descricao, ...valoresNum, total];
      }),
      ["TOTAL RECEITAS", "", "", ...totReceitas.map(Math.round), Math.round(totalReceitasAno)],
      ["— DESPESAS —", "", "", ...Array(12).fill(""), ""],
      ...despesas.map((l) => {
        const valoresNum = l.valores.map(toInt);
        const total = valoresNum.reduce((a, b) => a + b, 0);
        return [l.tipo, l.categoria ?? "", l.descricao, ...valoresNum, total];
      }),
      ["TOTAL DESPESAS", "", "", ...totDespesas.map(Math.round), Math.round(totalDespesasAno)],
      ["SALDO (R-D)", "", "", ...saldo.map(Math.round), Math.round(saldoAno)],
    ];

    const csv = [header, ...rows]
      .map((r) =>
        r
          .map((v) => (typeof v === "string" ? `"${v.replace(/"/g, '""')}"` : v))
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

  const exportPDF = async () => {
    await exportRelatorioPDF({
      anoSelecionado,
      meses: MESES,
      totReceitas,
      totDespesas,
      saldo,
      totalReceitasAno,
      totalDespesasAno,
      saldoAno,
      topCategoriasAno,
    });
  };

  const clearAll = () => {
    if (confirm(`Apagar todas as linhas de ${anoSelecionado}?`)) {
      setLinhas([]);
      try {
        localStorage.removeItem(lsKeyForAno(anoSelecionado));
      } catch {}
    }
  };

  // ===== Layout =====
  const colW = "w-20";
  const actionsColWidth = "w-14"; // 56px
  const categoriaColWidth = "w-32"; // 128px
  const descColWidth = `w-[${DESC_PX}px]`; // 220px
  const tableMinW = "min-w-[1480px]";

  const cellBase = "px-2 py-0.5 border-t border-slate-700 text-right text-xs whitespace-nowrap";
  const headBase =
    "px-2 py-0.5 border-t border-slate-700 text-slate-300 text-xs font-medium text-right";
  const firstColHead =
    "px-2 py-0.5 border-t border-slate-700 text-slate-300 text-sm font-semibold text-left";
  const firstColCell = "px-2 py-0.5 border-t border-slate-700 text-sm text-left";

  const headBaseNoColor = "px-2 py-0.5 border-t border-slate-700 text-xs font-medium text-right";
  const firstColHeadNoColor =
    "px-2 py-0.5 border-t border-slate-700 text-sm font-semibold text-left";

  const SectionDivider = ({ label, variant }) => (
    <tr>
      <td colSpan={MESES.length + 4} className="py-0">
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
    const el = document.querySelector(`input[data-sec="${sec}"][data-row="${row}"][data-col="${col}"]`);
    if (el) el.focus();
  };

  const focusDesc = (sec, row) => {
    const el = document.querySelector(`input[data-dsec="${sec}"][data-drow="${row}"]`);
    if (el) el.focus();
  };

  const handleKeyVal = (sec, rowIdx, colIdx) => (e) => {
    const key = e.key;

    if (key === "Enter" || key === "ArrowRight") {
      e.preventDefault();
      const next = colIdx + 1;
      if (next < 12) focusCell(sec, rowIdx, next);
      return;
    }

    if (key === "ArrowLeft") {
      e.preventDefault();
      if (colIdx > 0) focusCell(sec, rowIdx, colIdx - 1);
      else focusDesc(sec, rowIdx);
      return;
    }

    if (key === "ArrowDown") {
      e.preventDefault();
      focusCell(sec, rowIdx + 1, colIdx);
      return;
    }

    if (key === "ArrowUp") {
      e.preventDefault();
      if (rowIdx > 0) focusCell(sec, rowIdx - 1, colIdx);
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

  const saldoRowClass = saldoAno >= 0 ? "text-emerald-300 font-bold" : "text-rose-300 font-bold";
  const percGasto = totalReceitasAno > 0 ? (totalDespesasAno / totalReceitasAno) * 100 : 0;
  const saldoMedioMensal = saldoAno / 12;

  const idxAno = ANOS.indexOf(anoSelecionado);
  const temAnoAnterior = idxAno > 0;

  const top3 = topCategoriasAno.slice(0, 3);

  const showHintNow = () => {
    setShowReplicarHint(true);
    if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
    hintTimerRef.current = setTimeout(() => setShowReplicarHint(false), 2800);
  };

  return (
    <div className="h-screen flex flex-col pr-0 pl-0">
      {/* Cabeçalho + ações */}
      <div className="mb-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-slate-100 text-3xl font-semibold">Despesas</h1>
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
              onClick={exportPDF}
              title="Exportar Relatório PDF"
              className="flex items-center gap-1 px-3 py-2 rounded-md bg-slate-700 text-white text-sm hover:bg-slate-600"
            >
              <Download size={16} /> Exportar PDF
            </button>

            <button
              onClick={exportCSV}
              title="Exportar CSV"
              className="flex items-center gap-1 px-3 py-2 rounded-md bg-slate-800 text-white text-sm hover:bg-slate-700"
            >
              <Download size={16} /> CSV
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
              Em <span className="font-semibold text-slate-200">{anoSelecionado}</span> você está gastando{" "}
              <span className="font-semibold text-rose-300">{percGasto.toFixed(0)}%</span> do que ganha. Saldo médio mensal:{" "}
              <span
                className={[
                  "font-semibold",
                  saldoMedioMensal >= 0 ? "text-emerald-300" : "text-rose-300",
                ].join(" ")}
              >
                {fmtBR(saldoMedioMensal)}
              </span>
              .
              {top3.length > 0 && (
                <>
                  {" "}
                  Top gastos:{" "}
                  {top3.map((t, i) => (
                    <span key={t.cat} className="text-slate-200">
                      {i > 0 ? " • " : ""}
                      <span className="font-semibold">{t.cat}</span>{" "}
                      <span className="text-slate-400">
                        ({fmtBR(t.valor)} • {t.perc.toFixed(0)}%)
                      </span>
                    </span>
                  ))}
                  .
                </>
              )}
            </>
          ) : (
            <>Preencha suas receitas para ver o resumo anual de {anoSelecionado}.</>
          )}
        </div>

        {/* Bloco compacto: top categorias */}
        {totalDespesasAno > 0 && topCategoriasAno.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {topCategoriasAno.slice(0, 5).map((t) => (
              <div
                key={t.cat}
                className="px-2 py-1 rounded-md bg-slate-800 text-[11px] text-slate-200 border border-slate-700"
                title={`Participação no total de despesas: ${t.perc.toFixed(1)}%`}
              >
                <span className="font-semibold">{t.cat}</span>{" "}
                <span className="text-slate-400">
                  {fmtBR(t.valor)} • {t.perc.toFixed(0)}%
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Hint de duplo clique */}
        {showReplicarHint && (
          <div className="mt-2 text-[11px] text-slate-300">
            Dica: <span className="font-semibold text-slate-100">duplo clique</span> em uma célula mensal replica o valor até Dez.
          </div>
        )}
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

            <thead className="sticky top-0 z-40 bg-slate-900">
              <tr>
                <th className="px-2 py-1 border-t border-slate-700 text-slate-300 text-xs font-medium text-center sticky left-0 bg-slate-900 z-50" />
                <th className={`${firstColHead} sticky left-[${LEFT_CATEG}px] bg-slate-900 z-50 text-xs`}>
                  Categoria
                </th>
                <th className={`${firstColHead} sticky left-[${LEFT_DESC}px] bg-slate-900 z-50`}>
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
                const valoresNum = l.valores.map(toInt);
                const somaLinha = valoresNum.reduce((a, b) => a + b, 0);
                const categoriasRec = CATEGORIAS.RECEITA || [];

                return (
                  <tr key={l.id} className="hover:bg-slate-800/30">
                    <td className="px-2 py-0.5 border-t border-slate-700 text-center sticky left-0 bg-slate-900 z-30">
                      <button
                        onClick={() => delLinha(l.id)}
                        className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-rose-400"
                        title="Excluir linha"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>

                    <td className={`${firstColCell} sticky left-[${LEFT_CATEG}px] bg-slate-900 z-30`}>
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

                    <td className={`${firstColCell} sticky left-[${LEFT_DESC}px] bg-slate-900 z-30`}>
                      <input
                        className="w-full bg-transparent outline-none text-slate-100 placeholder:text-slate-500 text-sm"
                        placeholder="Nova receita"
                        value={l.descricao}
                        onChange={(e) => setDescricao(l.id, e.target.value)}
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
                          onFocus={showHintNow}
                          onBlur={(e) => {
                            const n = toInt(e.target.value);
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

                    <td className={`${cellBase} font-semibold text-slate-200`}>{fmtBR(somaLinha)}</td>
                  </tr>
                );
              })}

              {/* TOTAL RECEITAS */}
              <tr className="bg-slate-900 h-8">
                <td className="sticky left-0 bg-slate-900 border-t border-slate-700 z-30" />
                <td className={`${firstColHead} sticky left-[${LEFT_CATEG}px] bg-slate-900 text-emerald-300 text-xs z-30`} />
                <td className={`${firstColHead} sticky left-[${LEFT_DESC}px] bg-slate-900 text-emerald-300 z-30`}>
                  Total Receitas
                </td>
                {totReceitas.map((v, i) => (
                  <td key={`tr${i}`} className={`${headBase} text-emerald-300 bg-slate-900`}>
                    {fmtBR(v)}
                  </td>
                ))}
                <td className={`${headBase} font-semibold text-emerald-300 bg-slate-900`}>
                  {fmtBR(totalReceitasAno)}
                </td>
              </tr>

              {/* DESPESAS */}
              <SectionDivider label="Despesas" variant="red" />

              {despesas.map((l, dIdx) => {
                const valoresNum = l.valores.map(toInt);
                const somaLinha = valoresNum.reduce((a, b) => a + b, 0);
                const categoriasDes = CATEGORIAS.DESPESA || [];

                return (
                  <tr key={l.id} className="hover:bg-slate-800/30">
                    <td className="px-2 py-0.5 border-t border-slate-700 text-center sticky left-0 bg-slate-900 z-30">
                      <button
                        onClick={() => delLinha(l.id)}
                        className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-rose-400"
                        title="Excluir linha"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>

                    <td className={`${firstColCell} sticky left-[${LEFT_CATEG}px] bg-slate-900 z-30`}>
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

                    <td className={`${firstColCell} sticky left-[${LEFT_DESC}px] bg-slate-900 z-30`}>
                      <input
                        className="w-full bg-transparent outline-none text-slate-100 placeholder:text-slate-500 text-sm"
                        placeholder="Nova despesa"
                        value={l.descricao}
                        onChange={(e) => setDescricao(l.id, e.target.value)}
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
                          onFocus={showHintNow}
                          onBlur={(e) => {
                            const n = toInt(e.target.value);
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

                    <td className={`${cellBase} font-semibold text-slate-200`}>{fmtBR(somaLinha)}</td>
                  </tr>
                );
              })}

              {/* TOTAL DESPESAS */}
              <tr className="bg-slate-900 h-8">
                <td className="sticky left-0 bg-slate-900 border-t border-slate-700 z-30" />
                <td className={`${firstColHead} sticky left-[${LEFT_CATEG}px] bg-slate-900 text-rose-300 text-xs z-30`} />
                <td className={`${firstColHead} sticky left-[${LEFT_DESC}px] bg-slate-900 text-rose-300 z-30`}>
                  Total Despesas
                </td>
                {totDespesas.map((v, i) => (
                  <td key={`td${i}`} className={`${headBase} text-rose-300 bg-slate-900`}>
                    {fmtBR(v)}
                  </td>
                ))}
                <td className={`${headBase} font-semibold text-rose-300 bg-slate-900`}>
                  {fmtBR(totalDespesasAno)}
                </td>
              </tr>

              {/* SALDO – sticky bottom */}
              <tr>
                <td
                  className="sticky bottom-0 left-0 z-40 bg-slate-900 border-t border-slate-700"
                  style={{ boxShadow: "0 -1px 0 0 rgba(30,41,59,1)" }}
                />
                <td
                  className={`${firstColHeadNoColor} sticky bottom-0 left-[${LEFT_CATEG}px] z-40 bg-slate-900 ${saldoRowClass} text-xs`}
                  style={{ boxShadow: "0 -1px 0 0 rgba(30,41,59,1)" }}
                />
                <td
                  className={`${firstColHeadNoColor} sticky bottom-0 left-[${LEFT_DESC}px] z-40 bg-slate-900 ${saldoRowClass}`}
                  style={{ boxShadow: "0 -1px 0 0 rgba(30,41,59,1)" }}
                >
                  Saldo (R − D)
                </td>
                {saldo.map((v, i) => (
                  <td
                    key={`sl${i}`}
                    className={`${headBaseNoColor} sticky bottom-0 z-40 bg-slate-900 ${saldoRowClass}`}
                    style={{ boxShadow: "0 -1px 0 0 rgba(30,41,59,1)" }}
                  >
                    {fmtBR(v)}
                  </td>
                ))}
                <td
                  className={`${headBaseNoColor} sticky bottom-0 z-40 bg-slate-900 ${saldoRowClass}`}
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
