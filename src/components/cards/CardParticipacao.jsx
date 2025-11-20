// src/components/cards/CardParticipacao.jsx
import React, { useMemo, useState } from "react";

const PALETTE = [
  "#38bdf8", // sky
  "#22d3ee", // cyan
  "#f59e0b", // amber
  "#a78bfa", // violet
  "#34d399", // emerald
  "#fb7185", // rose
  "#f472b6", // pink
  "#60a5fa", // blue
];

// helpers para desenhar arcos em SVG
function polarToCartesian(cx, cy, r, angleDeg) {
  const a = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
}
function arcPath(cx, cy, rOuter, rInner, startAngle, endAngle) {
  // “donut slice”: arco externo + arco interno (reverso)
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;

  const p1 = polarToCartesian(cx, cy, rOuter, endAngle);
  const p2 = polarToCartesian(cx, cy, rOuter, startAngle);
  const p3 = polarToCartesian(cx, cy, rInner, startAngle);
  const p4 = polarToCartesian(cx, cy, rInner, endAngle);

  return [
    `M ${p1.x} ${p1.y}`,
    `A ${rOuter} ${rOuter} 0 ${largeArc} 0 ${p2.x} ${p2.y}`,
    `L ${p3.x} ${p3.y}`,
    `A ${rInner} ${rInner} 0 ${largeArc} 1 ${p4.x} ${p4.y}`,
    "Z",
  ].join(" ");
}

export default function CardParticipacao({ itens = [], mesAtual = "-" }) {
  // prepara dados
  const { total, parts } = useMemo(() => {
    const t = itens.reduce((a, i) => a + (Number(i.valor) || 0), 0);
    const p = itens
      .map((i, idx) => ({
        nome: i.nome,
        valor: Number(i.valor) || 0,
        color: PALETTE[idx % PALETTE.length],
      }))
      .sort((a, b) => b.valor - a.valor)
      .map((i) => ({
        ...i,
        pct: t > 0 ? (i.valor / t) * 100 : 0,
      }));
    return { total: t, parts: p };
  }, [itens]);

  // interação
  const [activeIdx, setActiveIdx] = useState(null); // último clique
  const [hoverIdx, setHoverIdx] = useState(null); // hover atual
  const idxShown = hoverIdx ?? activeIdx; // prioridade p/ hover

  // geometria do donut
  const size = 280; // tamanho do lado do SVG
  const cx = size / 2;
  const cy = size / 2;
  const rOuter = 120;
  const rInner = 75;

  // ângulos de cada fatia
  const angles = useMemo(() => {
    let acc = 0;
    return parts.map((p) => {
      const start = acc;
      const end = acc + (p.pct / 100) * 360;
      acc = end;
      return { start, end };
    });
  }, [parts]);

  // conteúdo central (total ou detalhe do ativo)
  const center = useMemo(() => {
    if (
      idxShown == null ||
      idxShown < 0 ||
      idxShown >= parts.length ||
      total <= 0
    ) {
      return {
        title: "Total",
        line1: total.toLocaleString("pt-BR", {
          style: "currency",
          currency: "BRL",
          maximumFractionDigits: 2,
        }),
        line2: "",
      };
    }
    const it = parts[idxShown];
    return {
      title: it.nome,
      line1: it.valor.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
        maximumFractionDigits: 2,
      }),
      line2: `${it.pct.toFixed(1)}%`,
    };
  }, [idxShown, parts, total]);

  return (
    <div className="rounded-2xl bg-slate-800/70 border border-white/10 shadow-lg w-[605px] min-w-[590px] max-w-[605px] h-[360px] p-4 overflow-hidden">
      <div className="flex items-center justify-between mb-3">
        <span className="text-slate-100 font-semibold text-lg">Participação</span>
        <span className="text-xs px-2 py-1 rounded bg-slate-700/60 text-slate-200">
          {mesAtual}
        </span>
      </div>

      {/* layout: legenda à esquerda | donut à direita */}
      <div className="grid grid-cols-[240px_1fr] gap-4 h-[286px]">
        {/* Legenda (clique/hover refletem no donut) */}
        <div className="overflow-auto pr-2">
          <ul className="space-y-2">
            {parts.map((it, i) => {
              const isActive = i === idxShown;
              return (
                <li
                  key={it.nome}
                  onMouseEnter={() => setHoverIdx(i)}
                  onMouseLeave={() => setHoverIdx(null)}
                  onClick={() => setActiveIdx((prev) => (prev === i ? null : i))}
                  className={`rounded-xl border border-white/10 bg-slate-900/40 px-3 py-2 w-[220px] cursor-pointer transition
                    ${isActive ? "ring-1 ring-sky-400/50 bg-slate-900/60" : ""}`}
                  title={`${it.nome} • ${it.pct.toFixed(1)}%`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-block h-3 w-3 rounded-full"
                      style={{ backgroundColor: it.color }}
                    />
                    <span className="text-slate-100 text-sm">{it.nome}</span>
                    <span className="text-slate-300 text-sm ml-2">
                      {it.pct.toFixed(1)}%
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Donut em SVG (fatias clicáveis) */}
        <div className="flex items-center justify-center">
          <div className="relative" style={{ width: size, height: size }}>
            <svg
              width={size}
              height={size}
              viewBox={`0 0 ${size} ${size}`}
              className="block"
            >
              {/* anel de base sutil */}
              <circle
                cx={cx}
                cy={cy}
                r={(rOuter + rInner) / 2}
                stroke="#0b1220"
                strokeOpacity="0.5"
                strokeWidth={rOuter - rInner}
                fill="none"
              />

              {/* fatias */}
              {parts.map((p, i) => {
                const { start, end } = angles[i];
                const d = arcPath(cx, cy, rOuter, rInner, start, end);
                const selected = i === idxShown;

                return (
                  <path
                    key={p.nome}
                    d={d}
                    fill={p.color}
                    fillOpacity={selected ? 1 : 0.85}
                    className={`transition-all duration-150 cursor-pointer ${
                      selected ? "drop-shadow-[0_0_8px_rgba(56,189,248,0.5)]" : ""
                    }`}
                    onMouseEnter={() => setHoverIdx(i)}
                    onMouseLeave={() => setHoverIdx(null)}
                    onClick={() =>
                      setActiveIdx((prev) => (prev === i ? null : i))
                    }
                  />
                );
              })}

              {/* “anel” interno extra para contraste quando há seleção */}
              {idxShown != null && (
                <circle
                  cx={cx}
                  cy={cy}
                  r={rInner - 6}
                  fill="none"
                  stroke="rgba(15,23,42,0.55)"
                  strokeWidth="12"
                />
              )}
            </svg>

            {/* texto central */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center leading-tight px-3">
                <div className="text-slate-200 text-sm font-semibold">
                  {center.title}
                </div>
                <div className="text-slate-100 text-xl font-extrabold">
                  {center.line1}
                </div>
                {center.line2 ? (
                  <div className="text-slate-300 text-sm mt-0.5">
                    {center.line2}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
