// src/pages/CursosPage.jsx
import React, { useEffect, useMemo, useState, useRef } from "react";
import { PiggyBank, FileDown, CheckCircle2 } from "lucide-react";
import confetti from "canvas-confetti";
import party from "party-js";
import { supabase } from "../lib/supabaseClient";

const ORANGE = "#f97316";
const GREEN = "#10e597ff";
const LS_KEY_CURSOS = "cc_cursos_concluidos_v1";
const COURSE_ID = "do_zero_ao_meu_primeiro_dividendo";

export default function CursosPage() {
  const [user, setUser] = useState(null);

  // ================================
  // MÓDULOS — AJUSTADOS
  // ================================
  const MODULOS = useMemo(
    () => [
      {
        id: 1,
        titulo: "Apresentação do Curso (1 to 1)",
        pdf: "/pdfs/MEU-PRIMEIRO-DIVIDENDO.pdf",
      },
      {
        id: 2,
        titulo: "Configuração Mental",
        pdf: "/pdfs/Neurociencia-e-Inv.pdf",
      },
      {
        id: 3,
        titulo: "Renda Fixa",
        pdf: "/pdfs/Apostila Curso_2_Renda Fixa.pdf",
      },
      {
        id: 4,
        titulo: "Renda Variável",
        pdf: "/pdfs/Apostila Curso_3_Renda Variavel.pdf",
      },
      {
        id: 5,
        titulo: "FIIs – Fundos Imobiliários",
        pdf: "/pdfs/Apostila Curso_4_Fundos Imobiliários.pdf",
      },
      {
        id: 6,
        titulo: "Dividendos",
        pdf: "/pdfs/Apostila Curso_5_Dividendos.pdf",
      },
      {
        id: 7,
        titulo: "Estratégia de Renda Passiva",
        pdf: "/pdfs/Apostila_Curso_6_Estratégia_de_Renda_Passiva.pdf",
      },
      {
        id: 8,
        titulo: "UpControl (1 to 1)",
        pdf: "/pdfs/modulo6.pdf",
      },
      {
        id: 9,
        titulo: "Meu Primeiro Dividendo (1 to 1)",
        pdf: "/pdfs/modulo7.pdf",
      },
    ],
    []
  );

  // ================================
  // FOGOS DE ARTIFÍCIO
  // ================================
  function launchFireworks() {
    const duration = 2000;
    const animationEnd = Date.now() + duration;

    const defaults = {
      startVelocity: 25,
      spread: 360,
      ticks: 40,
      zIndex: 9999,
    };

    function randomInRange(min, max) {
      return Math.random() * (max - min) + min;
    }

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);

      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
      });
    }, 250);
  }

  // ================================
  // CHUVA DE MOEDAS
  // ================================
  function launchCoinRain(target) {
    if (!target) return;
    party.confetti(target, {
      count: 120,
      shapes: ["💰", "🪙", "💵"],
    });
  }

  const containerRef = useRef(null);

  // ================================
  // LOCAL STORAGE
  // ================================
  const [concluidos, setConcluidos] = useState(() => {
    if (typeof window === "undefined") return new Set();
    try {
      const raw = window.localStorage.getItem(LS_KEY_CURSOS);
      if (!raw) return new Set();
      const arr = JSON.parse(raw);
      if (!Array.isArray(arr)) return new Set();
      return new Set(arr);
    } catch {
      return new Set();
    }
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(
        LS_KEY_CURSOS,
        JSON.stringify(Array.from(concluidos))
      );
    } catch {}
  }, [concluidos]);

  const total = MODULOS.length;
  const done = concluidos.size;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  useEffect(() => {
    if (done === total && total > 0) {
      launchFireworks();
      if (containerRef.current) {
        launchCoinRain(containerRef.current);
      }
    }
  }, [done, total]);

  // ================================
  // SUPABASE — LOGIN
  // ================================
  useEffect(() => {
    async function loadUser() {
      const { data, error } = await supabase.auth.getUser();
      if (!error) setUser(data.user);
    }
    loadUser();
  }, []);

  // ================================
  // SUPABASE — PROGRESSO
  // ================================
  useEffect(() => {
    if (!user) return;

    async function loadProgressFromSupabase() {
      const { data } = await supabase
        .from("user_course_progress")
        .select("completed_lessons")
        .eq("user_id", user.id)
        .eq("course_id", COURSE_ID);

      if (data && data.length > 0) {
        const lessons = data[0].completed_lessons || [];
        if (Array.isArray(lessons)) {
          setConcluidos(new Set(lessons));
        }
      }
    }

    loadProgressFromSupabase();
  }, [user]);

  // ================================
  // SALVAR PROGRESSO NO SUPABASE
  // ================================
  async function saveProgressToSupabase(nextSet, progressPercent) {
    if (!user) return;

    const completedLessons = Array.from(nextSet);

    const { data } = await supabase
      .from("user_course_progress")
      .select("id")
      .eq("user_id", user.id)
      .eq("course_id", COURSE_ID);

    if (data && data.length > 0) {
      const rowId = data[0].id;

      await supabase
        .from("user_course_progress")
        .update({
          completed_lessons: completedLessons,
          progress_percent: progressPercent,
        })
        .eq("id", rowId);
    } else {
      await supabase.from("user_course_progress").insert({
        user_id: user.id,
        course_id: COURSE_ID,
        completed_lessons: completedLessons,
        progress_percent: progressPercent,
      });
    }
  }

  const toggleConcluido = async (id) => {
    setConcluidos((prev) => {
      const next = new Set(prev);

      if (next.has(id)) next.delete(id);
      else next.add(id);

      const progressPercent = Math.round((next.size / MODULOS.length) * 100);

      saveProgressToSupabase(next, progressPercent);

      return next;
    });
  };

  // ================================
  // JSX
  // ================================
  return (
    <div ref={containerRef} className="pt-3 pr-6 pl-0">
      {/* animação do porquinho */}
      <style>{`
        @keyframes pig-pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.06); }
          100% { transform: scale(1); }
        }
      `}</style>

      {/* Cabeçalho */}
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

      {/* Cards */}
      <div className="rounded-2xl bg-slate-800/70 border border-white/10 shadow-lg w-[1200px] max-w-full p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {MODULOS.map((m) => {
            const isDone = concluidos.has(m.id);

            return (
              <div
                key={m.id}
                className={`group rounded-xl border p-4 flex items-start gap-3 transition-colors duration-300 ${
                  isDone
                    ? "border-emerald-500/60 bg-emerald-900/30"
                    : "border-white/10 bg-slate-900/40"
                }`}
              >
                {/* ícone */}
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

                {/* Conteúdo */}
                <div className="flex-1">
                  <div className="relative pb-1">
                    <h3 className="text-slate-200 font-semibold pr-20">
                      {m.id}. {m.titulo}
                    </h3>

                    {isDone && (
                      <span className="absolute top-0 right-0 inline-flex items-center gap-1 rounded-full bg-emerald-600/20 border border-emerald-500/60 px-2 py-1 text-[11px] font-medium text-emerald-100">
                        <CheckCircle2 size={14} />
                        Concluído
                      </span>
                    )}
                  </div>

                  {/* Botões */}
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    {/* Ver PDF */}
                    <a
                      href={m.pdf}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-slate-800 px-3 py-2 text-xs text-slate-100 hover:bg-slate-700"
                    >
                      Ver PDF
                    </a>

                    {/* Baixar PDF */}
                    <a
                      href={m.pdf}
                      download
                      className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-slate-800 px-3 py-2 text-xs text-slate-100 hover:bg-slate-700"
                    >
                      <FileDown size={20} />
                      Baixar PDF
                    </a>

                    {/* Marcar concluído */}
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
