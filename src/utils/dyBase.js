// src/utils/dyBase.js
import { useEffect, useState } from "react";

// 👉 URL RAW do seu CSV no GitHub
// (ajuste se mudar o repositório ou o caminho do arquivo)
const CSV_URL =
  "https://raw.githubusercontent.com/eszbrasil-create/upmoney-data/main/data/base-dy.csv";

/**
 * Converte texto de célula numérica em número.
 * "" ou valores inválidos viram 0.
 */
function toNumCell(value) {
  if (value === undefined || value === null) return 0;
  const trimmed = String(value).trim();
  if (trimmed === "") return 0;

  const n = Number(trimmed.replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

/**
 * Faz o parse do CSV em um array de objetos:
 * {
 *   ticker: "VALE3",
 *   nome: "Vale",
 *   setor: "Mineração",
 *   valorAtual: 68.21,
 *   months: [/* 24 valores numéricos *-/],
 *   monthLabels: ["Dec-2025", "Jan-2026", ...]
 * }
 */
function parseDyCsv(text) {
  if (!text) return [];

  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l !== "");

  if (lines.length < 2) return [];

  const header = lines[0].split(",").map((h) => h.trim());

  // Esperamos algo como:
  // ticker,nome,setor,valorAtual,Dec-2025,Jan-2026,...
  const IDX_TICKER = header.indexOf("ticker");
  const IDX_NOME = header.indexOf("nome");
  const IDX_SETOR = header.indexOf("setor");
  const IDX_VALOR = header.indexOf("valorAtual");

  if (
    IDX_TICKER === -1 ||
    IDX_NOME === -1 ||
    IDX_SETOR === -1 ||
    IDX_VALOR === -1
  ) {
    console.warn(
      "[useDyBase] Cabeçalho inesperado no CSV. Verifique os nomes das colunas."
    );
  }

  // Tudo depois de valorAtual é mês (Dec-2025, Jan-2026, ...)
  const monthCols = header.slice(IDX_VALOR + 1);

  const rows = lines.slice(1).map((line) => {
    const cols = line.split(",").map((c) => c.trim());

    const ticker = cols[IDX_TICKER] || "";
    const nome = cols[IDX_NOME] || "";
    const setor = cols[IDX_SETOR] || "";
    const valorAtual = toNumCell(cols[IDX_VALOR]);

    const months = monthCols.map((_, i) => {
      const idx = IDX_VALOR + 1 + i;
      return toNumCell(cols[idx]);
    });

    return {
      ticker,
      nome,
      setor,
      valorAtual,
      months,
      monthLabels: monthCols,
    };
  });

  return rows.filter((r) => r.ticker); // remove linhas vazias
}

/**
 * Hook principal que:
 *  - Busca o CSV no GitHub
 *  - Faz o parse para objetos JS
 *  - Exposta para o app:
 *    { dyBase, dyBaseLoading, dyBaseError }
 */
export function useDyBase() {
  const [dyBase, setDyBase] = useState([]);
  const [dyBaseLoading, setDyBaseLoading] = useState(true);
  const [dyBaseError, setDyBaseError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function loadCsv() {
      try {
        setDyBaseLoading(true);
        setDyBaseError(null);

        const res = await fetch(CSV_URL, {
          // garante que sempre busque a versão mais nova
          cache: "no-cache",
        });

        if (!res.ok) {
          throw new Error(`Erro HTTP ${res.status}`);
        }

        const text = await res.text();
        if (cancelled) return;

        const parsed = parseDyCsv(text);
        setDyBase(parsed);
        // Só para debug:
        console.log("[useDyBase] Base DY carregada:", parsed);
      } catch (err) {
        if (cancelled) return;
        console.error("[useDyBase] Erro ao carregar CSV:", err);
        setDyBaseError(err);
      } finally {
        if (!cancelled) setDyBaseLoading(false);
      }
    }

    loadCsv();

    // cleanup para evitar setState depois do unmount
    return () => {
      cancelled = true;
    };
  }, []);

  return { dyBase, dyBaseLoading, dyBaseError };
}
