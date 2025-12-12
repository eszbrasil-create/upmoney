// src/utils/exportRelatorioPDF.js
import jsPDF from "jspdf";
import "jspdf-autotable";
import Chart from "chart.js/auto";

function fmtBR(v) {
  return Math.round(v || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

function pct(x) {
  const n = Number.isFinite(x) ? x : 0;
  return `${Math.round(n)}%`;
}

function mesLabel(meses, mesIdx) {
  const m = meses?.[mesIdx] ?? "";
  return m ? `${m}` : `Mês ${mesIdx + 1}`;
}

function makeCanvas(w = 900, h = 450) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return c;
}

async function chartToDataURL(config, w = 900, h = 450) {
  const canvas = makeCanvas(w, h);
  const ctx = canvas.getContext("2d");

  // fundo branco (pra ficar estilo “relatório”)
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, w, h);

  const chart = new Chart(ctx, config);

  // aguarda render
  await new Promise((r) => setTimeout(r, 120));
  const url = canvas.toDataURL("image/png", 1.0);

  chart.destroy();
  return url;
}

function gerarComentariosMensal({
  totalReceitasMes,
  totalDespesasMes,
  saldoMes,
  percGastoMes,
  top3Mes,
}) {
  const msgs = [];

  if (totalReceitasMes <= 0 && totalDespesasMes <= 0) {
    return [
      "Sem lançamentos neste mês.",
      "Dica: registre suas receitas e despesas para gerar insights automáticos.",
    ];
  }

  if (totalReceitasMes <= 0 && totalDespesasMes > 0) {
    msgs.push("Você registrou despesas, mas não registrou receitas neste mês.");
    msgs.push("Dica: adicione salário e outras entradas recorrentes para o saldo fazer sentido.");
    return msgs.slice(0, 4);
  }

  if (percGastoMes <= 60) msgs.push("Gastos bem controlados neste mês. Ótimo sinal.");
  else if (percGastoMes <= 80) msgs.push("Gastos moderados. Dá para otimizar e acelerar seus objetivos.");
  else if (percGastoMes <= 95) msgs.push("Atenção: gastos altos em relação à receita. Vale revisar prioridades.");
  else msgs.push("Alerta: você está gastando quase tudo (ou mais) do que ganha neste mês.");

  if (saldoMes >= 0) msgs.push(`Saldo positivo no mês (${fmtBR(saldoMes)}). Excelente para construir patrimônio.`);
  else msgs.push(`Saldo negativo no mês (${fmtBR(saldoMes)}). Primeiro objetivo: ajustar para voltar ao positivo.`);

  if (top3Mes?.length) {
    const t = top3Mes[0];
    msgs.push(`Maior gasto do mês: "${t.cat}" (${fmtBR(t.valor)} • ${pct(t.perc)} das despesas).`);
  }

  if (percGastoMes > 80) msgs.push("Sugestão prática: defina um teto por categoria e revise os 2 maiores gastos primeiro.");
  else msgs.push("Sugestão prática: transforme parte do saldo em aporte automático (consistência > intensidade).");

  return msgs.slice(0, 4);
}

const PALETA = [
  "#3B82F6", // azul
  "#22C55E", // verde
  "#F59E0B", // amarelo
  "#EF4444", // vermelho
  "#A855F7", // roxo
  "#06B6D4", // ciano
  "#F97316", // laranja
  "#64748B", // slate
  "#10B981", // emerald
  "#E11D48", // rose
];

export async function exportRelatorioPDF({
  anoSelecionado,
  meses,
  mesIdx, // 0..11

  // arrays 12 meses:
  totReceitas,
  totDespesas,
  saldo,

  // do mês selecionado:
  totalReceitasMes,
  totalDespesasMes,
  saldoMes,
  percGastoMes,
  topCategoriasMes, // [{cat, valor, perc}] (do mês)
}) {
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });

  // ====== Tema “relatório claro” ======
  const W = 210;
  const H = 297;
  const M = 14;

  const TXT = "#0f172a";      // slate-900
  const MUTED = "#475569";    // slate-600
  const LIGHT = "#e2e8f0";    // slate-200
  const CARD = "#f8fafc";     // slate-50
  const BLUE = "#2563eb";     // blue-600
  const GREEN = "#16a34a";    // green-600
  const RED = "#dc2626";      // red-600

  // Fundo branco
  doc.setFillColor("#ffffff");
  doc.rect(0, 0, W, H, "F");

  // ===== Header =====
  doc.setFont("helvetica", "bold");
  doc.setTextColor(TXT);
  doc.setFontSize(18);
  doc.text("Orçamento Mensal", M, 22);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(MUTED);
  doc.text(
    `${mesLabel(meses, mesIdx)} • ${anoSelecionado}  —  Relatório de Receitas e Despesas`,
    M,
    28
  );

  // linha fina
  doc.setDrawColor(LIGHT);
  doc.setLineWidth(0.5);
  doc.line(M, 32, W - M, 32);

  // ===== KPIs =====
  const kY = 38;
  const kH = 20;
  const gap = 6;
  const kW = (W - M * 2 - gap * 2) / 3;

  function kpiCard(x, title, value, color) {
    doc.setFillColor(CARD);
    doc.setDrawColor(LIGHT);
    doc.roundedRect(x, kY, kW, kH, 3, 3, "FD");

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(MUTED);
    doc.text(title, x + 6, kY + 7);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(color);
    doc.text(value, x + 6, kY + 15);
  }

  kpiCard(M, "Receitas (mês)", fmtBR(totalReceitasMes), BLUE);
  kpiCard(M + kW + gap, "Despesas (mês)", fmtBR(totalDespesasMes), RED);
  kpiCard(
    M + (kW + gap) * 2,
    "Saldo + % gasto",
    `${fmtBR(saldoMes)} • ${pct(percGastoMes)}`,
    saldoMes >= 0 ? GREEN : RED
  );

  // ===== Bloco 1: Donut + Comentários =====
  const b1Y = 64;
  const b1H = 70;
  const leftW = 86;
  const rightW = (W - M * 2) - leftW - 6;

  // caixa donut
  doc.setFillColor(CARD);
  doc.setDrawColor(LIGHT);
  doc.roundedRect(M, b1Y, leftW, b1H, 3, 3, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(TXT);
  doc.text("Resumo Atual", M + 6, b1Y + 10);

  // prepara donut
  const top8 = (topCategoriasMes || []).slice(0, 8);
  const donutLabels = top8.map((t) => t.cat);
  const donutValues = top8.map((t) => Math.max(0, t.valor || 0));
  const donutColors = donutLabels.map((_, i) => PALETA[i % PALETA.length]);

  const donut = await chartToDataURL(
    {
      type: "doughnut",
      data: {
        labels: donutLabels.length ? donutLabels : ["Sem dados"],
        datasets: [
          {
            data: donutLabels.length ? donutValues : [1],
            backgroundColor: donutLabels.length ? donutColors : ["#cbd5e1"],
            borderWidth: 0,
          },
        ],
      },
      options: {
        responsive: false,
        cutout: "68%",
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => {
                const v = ctx.raw || 0;
                return `${ctx.label}: ${fmtBR(v)}`;
              },
            },
          },
        },
      },
    },
    520,
    360
  );

  // coloca donut
  doc.addImage(donut, "PNG", M + 8, b1Y + 16, leftW - 16, 46);

  // legenda simples
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(MUTED);

  let ly = b1Y + 66;
  if (!top8.length) {
    doc.text("Cadastre categorias para ver o resumo.", M + 6, ly);
  } else {
    const first = top8[0];
    doc.text(`Top: ${first.cat} (${pct(first.perc)})`, M + 6, ly);
  }

  // caixa comentários
  doc.setFillColor(CARD);
  doc.setDrawColor(LIGHT);
  doc.roundedRect(M + leftW + 6, b1Y, rightW, b1H, 3, 3, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(TXT);
  doc.text("Leitura do mês", M + leftW + 12, b1Y + 10);

  const comentarios = gerarComentariosMensal({
    totalReceitasMes,
    totalDespesasMes,
    saldoMes,
    percGastoMes,
    top3Mes: (topCategoriasMes || []).slice(0, 3),
  });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(TXT);

  let cy = b1Y + 18;
  comentarios.forEach((c) => {
    const lines = doc.splitTextToSize(`• ${c}`, rightW - 18);
    doc.text(lines, M + leftW + 12, cy);
    cy += lines.length * 5 + 2;
  });

  // ===== Bloco 2: Barras (12 meses: Receitas x Despesas) =====
  const b2Y = 142;
  const b2H = 76;

  doc.setFillColor(CARD);
  doc.setDrawColor(LIGHT);
  doc.roundedRect(M, b2Y, W - M * 2, b2H, 3, 3, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(TXT);
  doc.text("Receitas vs. Despesas (ano)", M + 6, b2Y + 10);

  const bars = await chartToDataURL(
    {
      type: "bar",
      data: {
        labels: meses,
        datasets: [
          { label: "Receitas", data: totReceitas, backgroundColor: "#3b82f6" },
          { label: "Despesas", data: totDespesas, backgroundColor: "#22c55e" },
        ],
      },
      options: {
        responsive: false,
        plugins: {
          legend: { labels: { color: "#0f172a" } },
        },
        scales: {
          x: {
            ticks: { color: "#475569" },
            grid: { display: false },
          },
          y: {
            ticks: { color: "#475569" },
            grid: { color: "rgba(15,23,42,0.08)" },
          },
        },
      },
    },
    980,
    420
  );

  doc.addImage(bars, "PNG", M + 6, b2Y + 14, W - M * 2 - 12, b2H - 20);

  // ===== Tabela: Resumo por categoria (mês) =====
  const tYTitle = 228;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(TXT);
  doc.text("Resumo por Categoria (mês)", M, tYTitle);

  const body = (topCategoriasMes || []).length
    ? topCategoriasMes
        .slice(0, 12)
        .map((t) => [t.cat, fmtBR(t.valor), pct(t.perc)])
    : [["—", "—", "—"]];

  doc.autoTable({
    startY: tYTitle + 4,
    head: [["Categoria", "Atual", "%"]],
    body,
    styles: {
      font: "helvetica",
      fontSize: 9,
      textColor: [15, 23, 42],
      fillColor: [248, 250, 252],
      lineColor: [226, 232, 240],
      lineWidth: 0.2,
      cellPadding: 2.5,
    },
    headStyles: {
      fillColor: [37, 99, 235], // azul
      textColor: [255, 255, 255],
      fontStyle: "bold",
    },
    alternateRowStyles: { fillColor: [255, 255, 255] },
    columnStyles: {
      0: { cellWidth: 100 },
      1: { cellWidth: 50, halign: "right" },
      2: { cellWidth: 20, halign: "right" },
    },
    margin: { left: M, right: M },
  });

  // ===== Rodapé =====
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(MUTED);
  doc.text(
    "Relatório educacional • Use para organizar e tomar decisões com clareza.",
    M,
    292
  );
  doc.text(
    "CashControl",
    W - M,
    292,
    { align: "right" }
  );

  doc.save(`orcamento_mensal_${anoSelecionado}_${mesLabel(meses, mesIdx)}.pdf`);
}
