import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import Chart from "chart.js/auto";

// ================= UTILIDADES =================
function fmtBR(v) {
  return Math.round(v).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

function pct(x) {
  return `${Math.round(x)}%`;
}

function makeCanvas(w = 600, h = 300) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return c;
}

async function chartToDataURL(config, w = 700, h = 360) {
  const canvas = makeCanvas(w, h);
  const ctx = canvas.getContext("2d");

  // fundo escuro para PDF
  ctx.fillStyle = "#0b1220";
  ctx.fillRect(0, 0, w, h);

  const chart = new Chart(ctx, config);

  await new Promise((r) => setTimeout(r, 80));
  const url = canvas.toDataURL("image/png", 1.0);

  chart.destroy();
  return url;
}

function gerarComentarios({ totalReceitasAno, totalDespesasAno, saldoAno, percGasto, top3 }) {
  const msgs = [];

  if (totalReceitasAno <= 0) {
    return [
      "Preencha suas receitas para desbloquear uma análise completa.",
      "Comece registrando salário e entradas recorrentes.",
    ];
  }

  if (percGasto <= 60) msgs.push("Excelente controle financeiro. Você está poupando bem.");
  else if (percGasto <= 80) msgs.push("Boa gestão, mas há espaço para otimização.");
  else if (percGasto <= 95) msgs.push("Atenção: seus gastos estão altos em relação à renda.");
  else msgs.push("Alerta: você está gastando praticamente tudo que ganha.");

  if (saldoAno >= 0)
    msgs.push(`Saldo anual positivo (${fmtBR(saldoAno)}). Direcione para patrimônio.`);
  else msgs.push(`Saldo anual negativo (${fmtBR(saldoAno)}). Priorize ajuste imediato.`);

  if (top3?.length) {
    const t = top3[0];
    msgs.push(`Maior gasto: ${t.cat} (${fmtBR(t.valor)} • ${pct(t.perc)}).`);
  }

  return msgs.slice(0, 4);
}

// ================= EXPORT PDF =================
export async function exportRelatorioPDF({
  anoSelecionado,
  meses,
  totReceitas,
  totDespesas,
  saldo,
  totalReceitasAno,
  totalDespesasAno,
  saldoAno,
  topCategoriasAno,
}) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });

  // CORES
  const BG = "#0b1220";
  const CARD = "#111c33";
  const TXT = "#e5e7eb";
  const MUTED = "#9ca3af";
  const GREEN = "#34d399";
  const RED = "#fb7185";

  const W = 210;
  const H = 297;
  const M = 12;

  // FUNDO
  doc.setFillColor(BG);
  doc.rect(0, 0, W, H, "F");

  // HEADER
  doc.setFillColor(CARD);
  doc.roundedRect(M, 12, W - M * 2, 22, 4, 4, "F");

  doc.setTextColor(TXT);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(`Relatório Financeiro — ${anoSelecionado}`, M + 8, 26);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(MUTED);
  doc.text("CashControl • Relatório anual", M + 8, 31);

  // KPIs
  const kpiY = 40;
  const kpiH = 20;
  const gap = 6;
  const kpiW = (W - M * 2 - gap * 2) / 3;

  const percGasto =
    totalReceitasAno > 0 ? (totalDespesasAno / totalReceitasAno) * 100 : 0;

  function kpi(x, title, value, color) {
    doc.setFillColor(CARD);
    doc.roundedRect(x, kpiY, kpiW, kpiH, 4, 4, "F");
    doc.setTextColor(MUTED);
    doc.setFontSize(9);
    doc.text(title, x + 6, kpiY + 7);
    doc.setTextColor(color);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text(value, x + 6, kpiY + 15);
    doc.setFont("helvetica", "normal");
  }

  kpi(M, "Receitas", fmtBR(totalReceitasAno), GREEN);
  kpi(M + kpiW + gap, "Despesas", fmtBR(totalDespesasAno), RED);
  kpi(
    M + (kpiW + gap) * 2,
    "Saldo / % gasto",
    `${fmtBR(saldoAno)} • ${pct(percGasto)}`,
    saldoAno >= 0 ? GREEN : RED
  );

  // GRÁFICO
  const chartImg = await chartToDataURL(
    {
      type: "bar",
      data: {
        labels: meses,
        datasets: [
          { label: "Receitas", data: totReceitas, backgroundColor: GREEN },
          { label: "Despesas", data: totDespesas, backgroundColor: RED },
        ],
      },
      options: {
        responsive: false,
        plugins: { legend: { labels: { color: TXT } } },
      },
    },
    820,
    360
  );

  doc.setFillColor(CARD);
  doc.roundedRect(M, 64, W - M * 2, 74, 4, 4, "F");
  doc.addImage(chartImg, "PNG", M + 4, 68, W - M * 2 - 8, 66);

  // COMENTÁRIOS
  const comentarios = gerarComentarios({
    totalReceitasAno,
    totalDespesasAno,
    saldoAno,
    percGasto,
    top3: (topCategoriasAno || []).slice(0, 3),
  });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(TXT);
  doc.text("Leitura do seu ano", M, 150);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);

  let y = 158;
  comentarios.forEach((c) => {
    const lines = doc.splitTextToSize(c, W - M * 2);
    doc.text(lines, M, y);
    y += lines.length * 5 + 2;
  });

  // TABELA
  autoTable(doc, {
    startY: 195,
    head: [["", ...meses]],
    body: [
      ["Saldo", ...saldo.map(fmtBR)],
      ["Receitas", ...totReceitas.map(fmtBR)],
      ["Despesas", ...totDespesas.map(fmtBR)],
    ],
    styles: { fontSize: 8 },
    margin: { left: M, right: M },
  });

  // SALVAR (CRÍTICO)
  doc.save(`relatorio_financeiro_${anoSelecionado}.pdf`);
}
