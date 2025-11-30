function toNum(x) {
  if (x === "" || x === null || x === undefined) return 0;
  const n = Number(String(x).replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

export function mergeDyBaseIntoCarteira(carteira, dyBase, DY_MONTHS) {
  if (!Array.isArray(carteira) || carteira.length === 0) return carteira;
  if (!Array.isArray(dyBase) || dyBase.length === 0) return carteira;

  return carteira.map((row) => {
    const t = (row.ticker || "").toUpperCase();
    if (!t) return row;

    const fromCsv = dyBase.find((item) => item.ticker === t);
    if (!fromCsv) return row;

    const dyFromCsv =
      Array.isArray(fromCsv.dyMeses) && fromCsv.dyMeses.length > 0
        ? [
            ...fromCsv.dyMeses,
            ...Array(DY_MONTHS.length - fromCsv.dyMeses.length).fill(0),
          ].slice(0, DY_MONTHS.length)
        : Array(DY_MONTHS.length).fill(0);

    const hasUserDy =
      Array.isArray(row.dyMeses) &&
      row.dyMeses.some((v) => toNum(v) !== 0 && v !== "");

    const finalDyMeses = hasUserDy ? row.dyMeses : dyFromCsv;

    return {
      ...row,
      nome: fromCsv.setor || fromCsv.nome || row.nome,
      valorAtual:
        fromCsv.valorAtual != null && fromCsv.valorAtual !== 0
          ? String(fromCsv.valorAtual)
          : row.valorAtual,
      dyMeses: finalDyMeses,
    };
  });
}
