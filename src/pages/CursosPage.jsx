// src/pages/Cursos.jsx
import React, { useEffect, useMemo, useState } from "react";
import { PiggyBank, FileDown, CheckCircle2 } from "lucide-react";

const ORANGE = "#f97316"; // Carteira Cash (laranja)
const GREEN = "#10e597ff"; // Concluído (verde)
const LS_KEY_CURSOS = "cc_cursos_concluidos_v1";

export default function CursosPage() {
  const MODULOS = useMemo(
    () => [
      {
        id: 1,
        titulo: "Apresentação do Curso(1 to 1)",
        pdf: "/pdfs/MEU-PRIMEIRO-DIVIDENDO.pdf",
      },
      { id: 2, titulo: "Abrir Conta na Corretora", pdf: "/pdfs/modulo2.pdf" },
      { id: 3, titulo: "Renda Fixa", pdf: "/pdfs/modulo3.pdf" },
      { id: 4, titulo: "Renda Variável", pdf: "/pdfs/modulo4.pdf" },
      {
        id: 5,
        titulo: "FIIs – Fundos Imobiliários",
        pdf: "/pdfs/modulo5.pdf",
      },
      {
        id: 6,
        titulo: "Montando sua Carteira (1 to 1)",
        pdf: "/pdfs/modulo6.pdf",
      },
      {
        id: 7,
        titulo: "Cash Control (1:1)",
        pdf: "/pdfs/modulo6.pdf",
      },
      { id: 8, titulo: "Impostos", pdf: "/pdfs/modulo6.pdf" },
      {
        id: 9,
        titulo: "Recebendo o Primeiro Dividendo (1 to 1)",
        pdf: "/pdfs/modulo7.pdf",
      },
    ],
    []
  );

  // ✅ Estado dos módulos concluídos, carregando do localStorage
  const [concluidos, setConcluidos] = useState(() => {
    try {
      const raw = localStorage.getItem(LS_KEY_CURSOS);
      if (!raw) return new Set();
      const arr = JSON.parse(raw);
      if (!Array.isArray(arr)) return new Set();
      return new Set(arr);
    } catch {
      return new Set();
    }
  });

  // ✅ Sempre que concluidos muda, salvar no localStorage
  useEffect(() => {
    try {
      const arr = Array.from(concluidos);
      localStorage.setItem(LS_KEY_CURSOS, JSON.stringify(arr));
    } catch {
      // se der erro, só não persiste
    }
  }, [concluidos]);

  const total = MODULOS.length;
  const done = concluidos.size;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  const toggleConcluido = (id) => {
    setConcluidos((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <div className="pt-3 pr-6 pl-0">
      {/* keyframes locais para animações do porquinho */}
      <style>{`
        @keyframes pig-pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.06); }
          100% { transform: scale(1); }
        }
      `}</style>

      {/* BLOCO 1 – Cabeçalho + Progresso */}
      <div className="rounded-2xl bg-slate-800/70 border border-white/10 shadow-lg w-[1200px] max-w-full p-5 mb-4">
        <div className="text-center mb-4">
          <h1 className="text-2xl md:text-3xl font-bold text-slate-150">
            Do Zero ao Meu Primeiro Dividendo
          </h1>
        </div>

        <div className="rounded-xl bg-slate-900/40 border border-white/10 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-300 text-sm">Progresso do curso</span>
            <span className="text-slate-100 text-sm font-semibold">
              {done}/{total} • {pct}%
            </span>
          </div>

          <div className="w-full h-5 rounded-full bg-slate-700/40 overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{
                width: `${pct}%`,
                background: GREEN,
                transition: "width 300ms ease",
              }}
            />
          </div>
        </div>
      </div>

      {/* BLOCO 2 – Cards de módulos com porquinho animado */}
      <div className="rounded-2xl bg-slate-800/70 border border-white/10 shadow-lg w-[1200px] max-w-full p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {MODULOS.map((m) => {
            const isDone = concluidos.has(m.id);
            return (
              <div
                key={m.id}
                // 🟢 Fundo esverdeado e borda diferente quando concluído
                className={`group rounded-xl border p-4 flex items-start gap-3 transition-colors duration-300 ${
                  isDone
                    ? "border-emerald-500/60 bg-emerald-900/30"
                    : "border-white/10 bg-slate-900/40"
                }`}
              >
                {/* Porquinho animado */}
                <div
                  className="shrink-0 transition-transform duration-300 group-hover:scale-105"
                  style={{
                    animation: isDone
                      ? "pig-pulse 1200ms ease-in-out infinite"
                      : "none",
                    transformOrigin: "center",
                  }}
                >
                  <PiggyBank size={100} color={isDone ? GREEN : ORANGE} />
                </div>

                <div className="flex-1">
                  {/* 🟢 Título + Badge "Concluído" */}
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-slate-200 font-semibold">
                      {m.id}. {m.titulo}
                    </h3>

                    {isDone && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600/20 border border-emerald-500/60 px-2 py-1 text-[11px] font-medium text-emerald-100">
                        <CheckCircle2 size={14} />
                        Concluído
                      </span>
                    )}
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    {/* 🟢 Botão "Ver PDF" - abre em nova aba */}
                    <a
                      href={m.pdf}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-slate-800 px-3 py-2 text-xs text-slate-100 hover:bg-slate-700"
                    >
                      Ver PDF
                    </a>

                    {/* 🟢 Botão "Baixar PDF" - download direto */}
                    <a
                      href={m.pdf}
                      download
                      className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-slate-800 px-3 py-2 text-xs text-slate-100 hover:bg-slate-700"
                    >
                      <FileDown size={20} />
                      Baixar PDF
                    </a>

                    <button
                      onClick={() => toggleConcluido(m.id)}
                      className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs border ${
                        isDone
                          ? "bg-emerald-600 text-white border-emerald-500 hover:bg-emerald-500"
                          : "bg-slate-800 text-slate-100 border-white/10 hover:bg-slate-700"
                      }`}
                    >
                      {isDone ? (
                        <>
                          <CheckCircle2 size={20} /> Concluído
                        </>
                      ) : (
                        "Marcar como concluído"
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
