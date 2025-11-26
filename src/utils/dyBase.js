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
        const res = await fetch(CSV_URL);
        if (!res.ok) {
          throw new Error(`Erro ao buscar CSV: ${res.status}`);
        }

        const text = await res.text();
        if (cancelled) return;

        const lines = text
          .split(/\r?\n/)
          .map((l) => l.trim())
          .filter((l) => l.length > 0);

        if (lines.length < 2) {
          setDyBase([]);
          setDyBaseLoading(false);
          return;
        }

        const header = lines[0].split(",");
        const idxTicker = header.indexOf("ticker");
        const idxNome = header.indexOf("nome");
        const idxSetor = header.indexOf("setor");
        const idxValorAtual = header.indexOf("valorAtual");

        const monthIndexes = DY_MONTH_KEYS.map((key) => header.indexOf(key));

        const rows = lines.slice(1).map((line) => {
          const cols = line.split(",");

          const ticker = (cols[idxTicker] || "").toUpperCase().trim();
          const nome = (cols[idxNome] || "").trim();
          const setor = (cols[idxSetor] || "").trim();
          const valorAtual = toNum(cols[idxValorAtual]);

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
          setDyBase(rows);
          console.log("[useDyBase] Base DY carregada:", rows);
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
