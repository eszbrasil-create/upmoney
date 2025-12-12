import jsPDF from "jspdf";
import "jspdf-autotable";
import Chart from "chart.js/auto";

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

  // fundo (evita transparência no PDF)
  ctx.fillStyle = "#0b1220";
  ctx.fillRect(0, 0, w, h);

  const chart = new Chart(ctx, config);

  // aguarda render
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
      "Dica: comece registrando o salário e outras entradas recorrentes.",
    ];
  }

  if (percGasto <= 60) msgs.push("Você está com um nível de gastos bem controlado. Ótimo sinal.");
  else if (percGasto <= 80) msgs.push("Seus gastos estão moderados. Dá para otimizar e acelerar seus objetivos.");
  else if (percGasto <= 95) msgs.push("Atenção: seus gastos estão altos em relação à receita. Vale revisar prioridades.");
  else msgs.push("Alerta: você está gastando quase tudo (ou mais) do que ganha. É hora de um plano de ajuste.");

  if (saldoAno >= 0) msgs.push(`Seu saldo anual é positivo (${fmtBR(saldoAno)}). Mantenha consistência e direcione para metas.`);
  else msgs.push(`Seu saldo anual está negativo (${fmtBR(saldoAno)}). Primeiro objetivo: zerar o déficit e estabilizar.`);

  if (top3?.length) {
    const t = top3[0];
    msgs.push(`Maior centro de gasto: "${t.cat}" (${fmtBR(t.valor)} • ${pct(t.perc)} das despesas).`);
  }

  // sugestão prática curta
  if (percGasto > 80) msgs.push("Sugestão: defina um teto mensal por categoria e revise os 2 maiores gastos primeiro.");
  else msgs.push("Sugestão: crie uma meta de aporte automático mensal para transformar saldo em patrimônio.");

  return msgs.slice(0, 4);
}

export async function exportRelatorioPDF({
  anoSelecionado,
  meses,
  totReceitas,
  totDespesas,
  saldo,
  totalReceitasAno,
  totalDespesasAno,
  saldoAno,
  topCategoriasAno, // [{cat, valor, perc}]
}) {
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });

  // Tema
  const BG = "#0b1220";
  const CARD = "#111c33";
  const TXT = "#e5e7eb";
  const MUTED = "#9ca3af";
  const GREEN = "#34d399";
  const RED = "#fb7185";
  const BLUE = "#60a5fa";

  const W = 210;
  const H = 297;
  const M = 12;

  // Fundo
  doc.setFillColor(BG);
  doc.rect(0, 0, W, H, "F");

  // Header
  doc.setFillColor(CARD);
  doc.roundedRect(M, 12, W - M * 2, 22, 4, 4, "F");

  doc.setTextColor(TXT);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(`Relatório Financeiro — ${anoSelecionado}`, M + 8, 26);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(MUTED);
  doc.text("CashControl • Leitura rápida e prática do seu ano", M + 8, 31);

  // KPIs
  const kpiY = 40;
  const kpiH = 20;
  const gap = 6;
  const kpiW = (W - M * 2 - gap * 2) / 3;

  const percGasto = totalReceitasAno > 0 ? (totalDespesasAno / totalReceitasAno) * 100 : 0;

  function kpiCard(x, title, value, color) {
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

  kpiCard(M, "Receitas (ano)", fmtBR(totalReceitasAno), GREEN);
  kpiCard(M + kpiW + gap, "Despesas (ano)", fmtBR(totalDespesasAno), RED);
  kpiCard(M + (kpiW + gap) * 2, "Saldo + % gasto", `${fmtBR(saldoAno)} • ${pct(percGasto)}`, saldoAno >= 0 ? GREEN : RED);

  // Gráfico 1: Barras (Receitas x Despesas por mês)
  const chart1 = await chartToDataURL(
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
        scales: {
          x: { ticks: { color: MUTED }, grid: { color: "rgba(255,255,255,0.06)" } },
          y: { ticks: { color: MUTED }, grid: { color: "rgba(255,255,255,0.06)" } },
        },
      },
    },
    820,
    360
  );

  doc.setFillColor(CARD);
  doc.roundedRect(M, 64, W - M * 2, 74, 4, 4, "F");
  doc.addImage(chart1, "PNG", M + 4, 68, W - M * 2 - 8, 66);

  // Bloco: Comentários (lado direito) + Top categorias (lado esquerdo)
  const boxY = 144;
  const boxH = 62;
  const halfW = (W - M * 2 - 6) / 2;

  // Top categorias
  doc.setFillColor(CARD);
  doc.roundedRect(M, boxY, halfW, boxH, 4, 4, "F");
  doc.setTextColor(TXT);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Onde seu dinheiro vai", M + 6, boxY + 10);

  const top5 = (topCategoriasAno || []).slice(0, 5);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);

  let yy = boxY + 18;
  if (!top5.length) {
    doc.setTextColor(MUTED);
    doc.text("Cadastre categorias para ver os principais gastos.", M + 6, yy);
  } else {
    top5.forEach((t) => {
      doc.setTextColor(TXT);
      doc.text(`• ${t.cat}`, M + 6, yy);
      doc.setTextColor(BLUE);
      doc.text(`${fmtBR(t.valor)} (${pct(t.perc)})`, M + halfW - 6, yy, { align: "right" });
      yy += 8;
    });
  }

  // Comentários
  doc.setFillColor(CARD);
  doc.roundedRect(M + halfW + 6, boxY, halfW, boxH, 4, 4, "F");
  doc.setTextColor(TXT);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Leitura do seu ano", M + halfW + 12, boxY + 10);

  const comentarios = gerarComentarios({
    totalReceitasAno,
    totalDespesasAno,
    saldoAno,
    percGasto,
    top3: (topCategoriasAno || []).slice(0, 3),
  });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(TXT);

  let cy = boxY + 18;
  comentarios.forEach((c) => {
    const lines = doc.splitTextToSize(c, halfW - 14);
    doc.text(lines, M + halfW + 12, cy);
    cy += lines.length * 5 + 3;
  });

  // Tabela: Saldo por mês (compacta)
  doc.setTextColor(TXT);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Resumo mensal (Saldo)", M, 215);

  doc.autoTable({
    startY: 219,
    head: [["Mês", ...meses]],
    body: [
      ["Saldo", ...saldo.map((v) => fmtBR(v))],
      ["Receitas", ...totReceitas.map((v) => fmtBR(v))],
      ["Despesas", ...totDespesas.map((v) => fmtBR(v))],
    ],
    styles: {
      font: "helvetica",
      fontSize: 8,
      textColor: TXT,
      fillColor: [17, 28, 51],
      lineColor: [255, 255, 255],
      lineWidth: 0.1,
    },
    headStyles: { fillColor: [17, 28, 51], textColor: TXT },
    alternateRowStyles: { fillColor: [14, 24, 44] },
    margin: { left: M, right: M },
  });

  // Rodapé
  doc.setTextColor(MUTED);
  doc.setFontSize(8);
  doc.text("Este relatório é educacional e serve para leitura e organização financeira.", M, 290);
  doc.text("Dica: reduza os 2 maiores gastos e mantenha consistência por 90 dias.", W - M, 290, { align: "right" });

  doc.save(`relatorio_${anoSelecionado}.pdf`);
}
