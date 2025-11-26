// src/utils/dyBase.js
// Lê a base de DY a partir do CSV público no GitHub
// Formato esperado:
// ticker,nome,setor,valorAtual,Dec-2025,Jan-2026,...,Nov-2027

const DY_BASE_URL =
  "https://raw.githubusercontent.com/eszbrasil-create/upmoney-data/main/data/base-dy.csv";

// Converte texto CSV em objeto JS organizado por ticker
async function fetchDyBaseRaw() {
  const res = await fetch(DY_BASE_URL);
  if (!res.ok) {
    throw new Error(`Erro ao buscar base DY: ${res.status}`);
  }

  const text = await res.text();
  const lines = text.trim().split(/\r?\n/);

  if (lines.length < 2) {
    // só cabeçalho, sem dados
    return { byTicker: {}, monthHeaders: [] };
  }

  const headerLine = lines[0];
  const headers = headerLine.split(",");

  // Índices fixos do cabeçalho
  const idxTicker = headers.indexOf("ticker");
  const idxNome = headers.indexOf("nome");
  const idxSetor = headers.indexOf("setor");
  const idxValorAtual = headers.indexOf("valorAtual");

  // Colunas de meses começam depois de valorAtual
  const firstMonthIdx = idxValorAtual + 1;
  const monthHeaders = headers.slice(firstMonthIdx); // ["Dec-2025", "Jan-2026", ...]

  const byTicker = {};

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const cols = line.split(",");
    const ticker = (cols[idxTicker] || "").trim().toUpperCase();
    if (!ticker) continue;

    const nome = (cols[idxNome] || "").trim();
    const setor = (cols[idxSetor] || "").trim();
    const valorAtualRaw = (cols[idxValorAtual] || "").trim();

    const valorAtual = valorAtualRaw
      ? Number(valorAtualRaw.replace(",", "."))
      : 0;

    const dyMeses = monthHeaders.map((_, j) => {
      const raw = cols[firstMonthIdx + j];
      if (!raw || raw.trim() === "") return "";
      const n = Number(raw.replace(",", "."));
      return Number.isFinite(n) ? n : "";
    });

    byTicker[ticker] = {
      ticker,
      nome,
      setor,
      valorAtual,
      dyMeses,
    };
  }

  return { byTicker, monthHeaders };
}

// Hook React para usar dentro dos componentes
import { useEffect, useState } from "react";

export function useDyBase() {
  const [dyBase, setDyBase] = useState(null); // { [ticker]: {nome,setor,valorAtual,dyMeses} }
  const [dyBaseLoading, setDyBaseLoading] = useState(true);
  const [dyBaseError, setDyBaseError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setDyBaseLoading(true);
        setDyBaseError(null);
        const { byTicker } = await fetchDyBaseRaw();
        if (!cancelled) {
          setDyBase(byTicker);
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Erro ao carregar base DY:", err);
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
