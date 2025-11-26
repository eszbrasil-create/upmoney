// src/utils/dyBase.js

const BASE_DY_URL =
  "https://raw.githubusercontent.com/eszbrasil-create/upmoney-data/refs/heads/main/data/base-dy.csv";

const MONTH_MAP = {
  Jan: "01",
  Feb: "02",
  Mar: "03",
  Apr: "04",
  May: "05",
  Jun: "06",
  Jul: "07",
  Aug: "08",
  Sep: "09",
  Oct: "10",
  Nov: "11",
  Dec: "12",
};

// "Dec-2025" → "2025-12"
function monthLabelToKey(label) {
  const [monStr, yearStr] = label.split("-");
  const mm = MONTH_MAP[monStr];
  if (!mm || !yearStr) return null;
  return `${yearStr}-${mm}`;
}

// Converte CSV em objeto
export function parseDyCsv(csvText) {
  if (!csvText) return { byTicker: {}, monthOrder: [], monthLabels: [] };

  const lines = csvText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const header = lines[0].split(",").map((h) => h.trim());
  const monthLabels = header.slice(4);

  const monthOrder = monthLabels
    .map((lbl) => monthLabelToKey(lbl))
    .filter(Boolean);

  const byTicker = {};

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",");

    const ticker = (cols[0] || "").trim().toUpperCase();
    if (!ticker) continue;

    const nome = (cols[1] || "").trim();
    const setor = (cols[2] || "").trim();
    const valorAtual = Number((cols[3] || "0").replace(",", "."));

    const dyByMonthKey = {};

    monthLabels.forEach((label, idx) => {
      const colIndex = 4 + idx;
      const raw = (cols[colIndex] || "").trim();
      if (!raw) return;

      const n = Number(raw.replace(",", "."));
      if (!Number.isFinite(n)) return;

      const key = monthLabelToKey(label);
      if (!key) return;

      dyByMonthKey[key] = (dyByMonthKey[key] || 0) + n;
    });

    byTicker[ticker] = {
      ticker,
      nome,
      setor,
      valorAtual,
      dyByMonthKey,
    };
  }

  return { byTicker, monthOrder, monthLabels };
}

export async function loadDyBase() {
  const res = await fetch(BASE_DY_URL);
  if (!res.ok) {
    throw new Error(`Erro ao carregar base DY: ${res.status}`);
  }
  const text = await res.text();
  return parseDyCsv(text);
}
