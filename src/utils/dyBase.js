// src/utils/dyBase.js
import { useEffect, useState } from "react";

/**
 * URL do CSV no GitHub (raw)
 * Ajuste aqui se mudar o repositório/arquivo.
 */
const CSV_URL =
  "https://raw.githubusercontent.com/eszbrasil-create/upmoney-data/main/data/base-dy.csv";

/**
 * Ordem exata das colunas de DY no CSV.
 * Isso PRECISA bater com a ordem das colunas no arquivo .csv.
 */
const DY_MONTH_KEYS = [
  "Dec-2025",
  "Jan-2026",
  "Feb-2026",
  "Mar-2026",
  "Apr-2026",
  "May-2026",
  "Jun-2026",
  "Jul-2026",
  "Aug-2026",
  "Sep-2026",
  "Oct-2026",
  "Nov-2026",
  "Dec-2026",
  "Jan-2027",
  "Feb-2027",
  "Mar-2027",
  "Apr-2027",
  "May-2027",
  "Jun-2027",
  "Jul-2027",
  "Aug-2027",
  "Sep-2027",
  "Oct-2027",
  "Nov-2027",
];

/**
 * Converte string numérica (com vírgula ou ponto) para número.
 */
function toNum(x) {
  if (x === "" || x == null) return 0;
  const n = Number(String(x).replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

/**
 * Hook para carregar e parsear a base de DY
 * Retorna: { dyBase, dyBaseLoading, dyBaseError }
 *
 * dyBase é um array no formato:
 * {
 *   ticker: "VALE3",
 *   nome: "Vale",
 *   setor: "Mineração",
 *   valorAtual: 68.2,
 *   dyMeses: [n0, n1, ..., n23] // sempre 24 posições
 * }
 */
export function useDyBase() {
  const [dyBase, setDyBase] = useState([]);
  const [dyBaseLoading, setDyBaseLoading] = useState(false);
  const [dyBaseError, setDyBaseError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setDyBaseLoading(true);
      setDyBaseError(null);

      try {
        const res = await fetch(CSV_URL, { cache: "no-store" });
        if (!res.ok) {
          throw new Error(`Erro ao buscar CSV: ${res.status}`);
        }

        const text = await res.text();
        if (cancelled) return;

        const raw = text.trim();
        if (!raw) {
          setDyBase([]);
          setDyBaseLoading(false);
          return;
        }

        // Detecta separador ";" ou ","
        const SEP =
          raw.includes(";") && !raw.includes(",") ? ";" : ",";

        let header = [];
        let rowStrings = [];

        // Caso normal: arquivo com múltiplas linhas
        if (raw.includes("\n")) {
          const lines = raw
            .split(/\r?\n/)
            .map((l) => l.trim())
            .filter((l) => l.length > 0);

          if (lines.length < 2) {
            setDyBase([]);
            setDyBaseLoading(false);
            return;
          }

          header = lines[0].split(SEP).map((h) => h.trim());
          rowStrings = lines.slice(1).map((line) =>
            line.split(SEP).map((c) => c.trim())
          );
        } else {
          /**
           * Caso especial: tudo em UMA linha só (como está hoje no GitHub)
           * Estratégia:
           *  - separamos tudo por SEP em um array de tokens
           *  - os primeiros N tokens são o cabeçalho
           *  - o resto é dividido em blocos de N tokens (linhas de dados)
           */
          const tokens = raw.split(SEP).map((c) => c.trim());

          // 4 colunas fixas + 24 meses (DY_MONTH_KEYS)
          const expectedCols = 4 + DY_MONTH_KEYS.length;

          if (tokens.length <= expectedCols) {
            // não tem dados além do cabeçalho
            setDyBase([]);
            setDyBaseLoading(false);
            return;
          }

          header = tokens.slice(0, expectedCols);

          const dataTokens = tokens.slice(expectedCols);
          const rows = [];
          for (let i = 0; i < dataTokens.length; i += expectedCols) {
            const slice = dataTokens.slice(i, i + expectedCols);
            // ignora "linhas" completamente vazias
            const hasContent = slice.some((c) => c !== "");
            if (!hasContent) continue;
            rows.push(slice);
          }

          rowStrings = rows;
        }

        // Índices das colunas importantes
        const idxTicker = header.indexOf("ticker");
        const idxNome = header.indexOf("nome");
        const idxSetor = header.indexOf("setor");
        const idxValorAtual = header.indexOf("valorAtual");

        const monthIndexes = DY_MONTH_KEYS.map((key) =>
          header.indexOf(key)
        );

        const rowsParsed = rowStrings.map((cols) => {
          const ticker = idxTicker >= 0
            ? (cols[idxTicker] || "").toUpperCase().trim()
            : "";

          const nome = idxNome >= 0 ? (cols[idxNome] || "").trim() : "";
          const setor = idxSetor >= 0 ? (cols[idxSetor] || "").trim() : "";
          const valorAtual =
            idxValorAtual >= 0 ? toNum(cols[idxValorAtual]) : 0;

          const dyMeses = monthIndexes.map((idx) => {
            if (idx < 0 || idx >= cols.length) return 0;
            return toNum(cols[idx]);
          });

          return {
            ticker,
            nome,
            setor,
            valorAtual,
            dyMeses,
          };
        });

        if (!cancelled) {
          setDyBase(rowsParsed);
          console.log("[useDyBase] Base DY carregada:", rowsParsed);
        }
      } catch (err) {
        console.error("[useDyBase] Erro ao carregar base DY:", err);
        if (!cancelled) {
          setDyBaseError(err);
        }
      } finally {
        if (!cancelled) {
          setDyBaseLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  return { dyBase, dyBaseLoading, dyBaseError };
}
