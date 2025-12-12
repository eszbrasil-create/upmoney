// src/utils/exportRelatorioPDF.js
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

function fmtBR(v) {
  return Math.round(v).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

function pct(x) {
  if (!Number.isFinite(x)) return "0%";
  return `${Math.round(x)}%`;
}

function makeCanvas(w = 900, h = 500) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return c;
}

async function chartToDataURL(Chart, config, w = 900, h = 520, bg = "#ffffff") {
  const canvas = makeCanvas(w, h);
  const ctx = canvas.getContext("2d");

  // Fundo sólido (evita PNG transparente no PDF)
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  const chart = new Chart(ctx, config);

  // aguarda render
  await new Promise((r) => setTimeout(r, 120));

  const url = canvas.toDataURL("image/png", 1.0);
  chart.destroy();
  return url;
}

function gerarComentarios({ totalReceitasAno, totalDespesasAno, saldoAno, percGasto, top3 }) {
  const msgs = [];

  if (totalReceitasAno <= 0) {
    return [
      "Você ainda não registrou receitas suficientes para uma análise completa.",
      "Comece adicionando salário e outras entradas recorrentes.",
      "Depois disso, registre as despesas principais para enxergar padrões.",
    ];
  }

  if (percGasto <= 60) msgs.push("Gastos bem controlados. Você está com boa margem para investir e acelerar objetivos.");
  else if (percGasto <= 80) msgs.push("Gastos moderados. Um pequeno ajuste pode aumentar bastante o seu saldo anual.");
  else if (percGasto <= 95) msgs.push("Atenção: seus gastos estão altos em relação à receita. Vale revisar as maiores categorias.");
  else msgs.push("Alerta: você está gastando quase tudo (ou mais) do que ganha. Hora de um plano prático de ajuste.");

  if (saldoAno >= 0) msgs.push(`Saldo anual positivo: ${fmtBR(saldoAno)}. Direcione parte disso para metas (reserva/ativos).`);
  else msgs.push(`Saldo anual negativo: ${fmtBR(saldoAno)}. Meta #1: zerar o déficit e estabilizar antes de crescer.`);

  if (top3?.length) {
    const t = top3[0];
    msgs.push(`Maior centro de gasto: ${t.cat} (${fmtBR(t.valor)} • ${pct(t.perc)} das despesas).`);
  }

  if (percGasto > 80) msgs.push("Sugestão: reduza primeiro os 2 maiores gastos e defina teto mensal por categoria.");
  else msgs.push("Sugestão: crie um aporte automático mensal para transformar saldo em patrimônio.");

  return msgs.slice(0, 4);
}

function buildCategorias(tops = []) {
  const top = (tops || []).slice(0, 7);
  const labels = top.map((t) => t.cat);
  const values = top.map((t) => t.valor);

  const colors = ["#2E86DE", "#20BF6B", "#F7B731", "#EB3B5A", "#A55EEA", "#45AAF2", "#26DE81"].slice(
    0,
    labels.length
  );

  return { labels, values, colors };
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
  topCategoriasAno,
}) {
  // garante rodar no browser
  if (typeof window === "undefined" || typeof document === "undefined") {
    throw new Error("exportRelatorioPDF deve rodar no browser (window/document indisponível).");
  }

  // Chart.js via dynamic import (evita dor no build/SSR)
  const mod = await import("chart.js/auto");
  const Chart = mod?.default || mod;

  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });

  // ===== Tema claro =====
  const W = 210;
  const H = 297;
  const M = 14;

  const WHITE = "#ffffff";
  const INK = "#0f172a";
  const MUTED = "#475569";
  const LIGHT = "#e2e8f0";
  const CARD = "#f8fafc";
  const BLUE = "#2563eb";
  const GREEN = "#16a34a";
  const RED = "#ef4444";

  // Fundo
  doc.setFillColor(WHITE);
  doc.rect(0, 0, W, H, "F");

  // Header
  doc.setFillColor(CARD);
  doc.roundedRect(M, 14, W - M * 2, 26, 4, 4, "F");

  doc.setTextColor(INK);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("Orçamento Mensal", M + 8, 28);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(MUTED);
  doc.text(`Relatório analítico • ${anoSelecionado}`, M + 8, 35);

  // KPIs
  const kpiY = 46;
  const kpiH = 18;
  const gap = 6;
  const kpiW = (W - M * 2 - gap * 2) / 3;

  const percGasto = totalReceitasAno > 0 ? (totalDespesasAno / totalReceitasAno) * 100 : 0;

  function kpiCard(x, title, value, color) {
    doc.setFillColor("#ffffff");
    doc.setDrawColor(LIGHT);
    doc.roundedRect(x, kpiY, kpiW, kpiH, 3, 3, "FD");

    doc.setTextColor(MUTED);
    doc.setFontSize(9);
    doc.text(title, x + 5, kpiY + 6);

    doc.setTextColor(color);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text(value, x + 5, kpiY + 14);

    doc.setFont("helvetica", "normal");
  }

  kpiCard(M, "Receitas (ano)", fmtBR(totalReceitasAno), GREEN);
  kpiCard(M + kpiW + gap, "Despesas (ano)", fmtBR(totalDespesasAno), RED);
  kpiCard(
    M + (kpiW + gap) * 2,
    "Saldo + % gasto",
    `${fmtBR(saldoAno)} • ${pct(percGasto)}`,
    saldoAno >= 0 ? GREEN : RED
  );

  // ===== Charts =====
  const chartsY = 70;
  const chartsH = 72;
  const half = (W - M * 2 - 6) / 2;

  doc.setFillColor("#ffffff");
  doc.setDrawColor(LIGHT);
  doc.roundedRect(M, chartsY, half, chartsH, 4, 4, "FD");

  doc.setFillColor("#ffffff");
  doc.setDrawColor(LIGHT);
  doc.roundedRect(M + half + 6, chartsY, half, chartsH, 4, 4, "FD");

  doc.setTextColor(INK);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Resumo Atual (Despesas)", M + 6, chartsY + 10);
  doc.text("Despesas por Categoria (Top)", M + half + 12, chartsY + 10);

  const top = (topCategoriasAno || []).slice(0, 7);
  const top3 = (topCategoriasAno || []).slice(0, 3);
  const { labels, values, colors } = buildCategorias(top);

  const donutImg = await chartToDataURL(
    Chart,
    {
      type: "doughnut",
      data: {
        labels: labels.length ? labels : ["Sem categorias"],
        datasets: [
          {
            data: labels.length ? values : [1],
            backgroundColor: labels.length ? colors : ["#cbd5e1"],
            borderWidth: 0,
          },
        ],
      },
      options: {
        responsive: false,
        plugins: {
          legend: { position: "bottom", labels: { color: INK, boxWidth: 10, font: { size: 9 } } },
          tooltip: { enabled: false },
        },
        cutout: "62%",
      },
    },
    640,
    420,
    WHITE
  );

  doc.addImage(donutImg, "PNG", M + 6, chartsY + 12, half - 12, chartsH - 18);

  const barImg = await chartToDataURL(
    Chart,
    {
      type: "bar",
      data: {
        labels: labels.length ? labels : ["Sem categorias"],
        datasets: [
          {
            label: "Despesas",
            data: labels.length ? values : [0],
            backgroundColor: labels.length ? colors : ["#94a3b8"],
            borderWidth: 0,
          },
        ],
      },
      options: {
        responsive: false,
        plugins: { legend: { display: false }, tooltip: { enabled: false } },
        scales: {
          x: { ticks: { color: INK, font: { size: 9 } }, grid: { display: false } },
          y: { ticks: { color: MUTED, font: { size: 9 } }, grid: { color: "#eef2ff" } },
        },
      },
    },
    780,
    420,
    WHITE
  );

  doc.addImage(barImg, "PNG", M + half + 12, chartsY + 14, half - 18, chartsH - 20);

  // ===== Comentários =====
  const boxY = 148;

  doc.setFillColor("#ffffff");
  doc.setDrawColor(LIGHT);
  doc.roundedRect(M, boxY, W - M * 2, 34, 4, 4, "FD");

  doc.setTextColor(INK);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Comentários", M + 6, boxY + 10);

  const comentarios = gerarComentarios({
    totalReceitasAno,
    totalDespesasAno,
    saldoAno,
    percGasto,
    top3,
  });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(MUTED);

  let cy = boxY + 16;
  comentarios.forEach((c) => {
    const lines = doc.splitTextToSize(`• ${c}`, W - M * 2 - 14);
    doc.text(lines, M + 6, cy);
    cy += lines.length * 4.6;
  });

  // ===== Tabela por categoria (AQUI era o erro: agora é autoTable(doc, ...)) =====
  doc.setTextColor(INK);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Resumo por Categoria", M, 194);

  const top10 = (topCategoriasAno || []).slice(0, 10);

  const body = top10.length
    ? top10.map((t) => [
        t.cat,
        fmtBR(t.valor),
        pct(t.perc),
        t.perc >= 35 ? "⚠️ Alto" : t.perc >= 20 ? "Atenção" : "Ok",
      ])
    : [["Sem categorias", "—", "—", "—"]];

  autoTable(doc, {
    startY: 198,
    head: [["Categoria", "Atual", "%", "Sinal"]],
    body,
    styles: {
      font: "helvetica",
      fontSize: 9,
      textColor: INK,
      fillColor: [248, 250, 252],
      lineColor: [226, 232, 240],
      lineWidth: 0.2,
      cellPadding: 2.2,
    },
    headStyles: {
      fillColor: [37, 99, 235],
      textColor: [255, 255, 255],
      fontStyle: "bold",
    },
    alternateRowStyles: { fillColor: [255, 255, 255] },
    columnStyles: {
      0: { cellWidth: 78 },
      1: { cellWidth: 36, halign: "right" },
      2: { cellWidth: 18, halign: "right" },
      3: { cellWidth: 18, halign: "center" },
    },
    margin: { left: M, right: M },
  });

  // Rodapé
  doc.setTextColor(MUTED);
  doc.setFontSize(8);
  doc.text("Relatório educacional — use para organizar hábitos e tomar decisões melhores.", M, 290);
  doc.text("CashControl", W - M, 290, { align: "right" });

  doc.save(`relatorio_${anoSelecionado}.pdf`);
}
