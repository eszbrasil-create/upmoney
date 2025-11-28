// src/pages/CursosPage.jsx
import React, { useEffect, useMemo, useState, useRef } from "react";
import { PiggyBank, FileDown, CheckCircle2 } from "lucide-react";
import confetti from "canvas-confetti";
import party from "party-js";

// 👇 IMPORTA O CLIENT DO SUPABASE
import { supabase } from "../lib/supabaseClient.js";

const ORANGE = "#f97316"; // Carteira Cash (laranja)
const GREEN = "#10e597ff"; // Concluído (verde)

// localStorage (continua como segurança / offline)
const LS_KEY_CURSOS = "cc_cursos_concluidos_v2";

// id do curso na tabela user_course_progress
const COURSE_ID = "do_zero_ao_meu_primeiro_dividendo";

export default function CursosPage() {
  // -----------------------------
  // LISTA DE MÓDULOS (igual antes)
  // -----------------------------
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

  // -----------------------------
  // 🎆 FOGOS DE ARTIFÍCIO
  // -----------------------------
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

  // -----------------------------
  // 💸 CHUVA DE MOEDAS
  // -----------------------------
  function launchCoinRain(target) {
    if (!target) return;
    party.confetti(target, {
      count: 120,
      shapes: ["💰", "🪙", "💵"],
    });
  }

  const containerRef = useRef(null);

  // -----------------------------
  // ESTADOS PRINCIPAIS
  // -----------------------------
  // usuário logado (Supabase)
  const [user, setUser] = useState(null);
  // id da linha na tabela user_course_progress (para dar UPDATE depois)
  const [progressRowId, setProgressRowId] = useState(null);
  // carregando progresso inicial do Supabase
  const [loadingProgress, setLoadingProgress] = useState(true);

  // módulos concluídos (começa lendo do localStorage)
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

  const total = MODULOS.length;
  const done = concluidos.size;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  // -----------------------------
  // 1) BUSCA USUÁRIO + PROGRESSO NO SUPABASE
  // -----------------------------
  useEffect(() => {
    let isMounted = true;

    async function loadUserAndProgress() {
      try {
        // pega usuário atual
        const { data: userData, error: userError } = await supabase.auth.getUser();

        if (userError || !userData?.user) {
          // sem login → usa só localStorage mesmo
          if (isMounted) setLoadingProgress(false);
          return;
        }

        const currentUser = userData.user;
        if (!isMounted) return;

        setUser(currentUser);

        // busca progresso na tabela user_course_progress
        const { data, error } = await supabase
          .from("user_course_progress")
          .select("id, completed_lessons")
          .eq("user_id", currentUser.id)
          .eq("course_id", COURSE_ID)
          .maybeSingle();

        if (!isMounted) return;

        if (error) {
          console.error("Erro ao buscar progresso do curso:", error.message);
          setLoadingProgress(false);
          return;
        }

        if (data) {
          // se já existe registro no banco, usa ele
          const arr = Array.isArray(data.completed_lessons)
            ? data.completed_lessons
            : [];
          setConcluidos(new Set(arr));
          setProgressRowId(data.id);
        }

        setLoadingProgress(false);
      } catch (e) {
        console.error("Erro inesperado ao carregar progresso:", e);
        if (isMounted) setLoadingProgress(false);
      }
    }

    loadUserAndProgress();

    return () => {
      isMounted = false;
    };
  }, []);

  // -----------------------------
  // 2) SALVA SEMPRE NO LOCALSTORAGE
  // -----------------------------
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(
        LS_KEY_CURSOS,
        JSON.stringify(Array.from(concluidos))
      );
    } catch (e) {
      console.error("Erro ao salvar cursos no localStorage:", e);
    }
  }, [concluidos]);

  // -----------------------------
  // 3) QUANDO CONCLUIR AULA → SALVAR NO SUPABASE
  // -----------------------------
  useEffect(() => {
    // se não tem usuário logado, não tenta salvar no banco
    if (!user) return;

    const completedArr = Array.from(concluidos);
    const progressPercent =
      total > 0 ? Math.round((completedArr.length / total) * 100) : 0;

    let cancelled = false;

    async function saveProgress() {
      try {
        const payload = {
          user_id: user.id,
          course_id: COURSE_ID,
          progress_percent: progressPercent,
          completed_lessons: completedArr,
        };

        if (progressRowId) {
          // já existe linha → UPDATE
          const { error } = await supabase
            .from("user_course_progress")
            .update(payload)
            .eq("id", progressRowId);

          if (error) {
            console.error("Erro ao atualizar progresso do curso:", error.message);
          }
        } else {
          // ainda não existe linha → INSERT
          const { data, error } = await supabase
            .from("user_course_progress")
            .insert(payload)
            .select("id")
            .single();

          if (error) {
            console.error("Erro ao inserir progresso do curso:", error.message);
          } else if (!cancelled && data?.id) {
            setProgressRowId(data.id);
          }
        }
      } catch (e) {
        console.error("Erro inesperado ao salvar progresso do curso:", e);
      }
    }

    saveProgress();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [concluidos, user, total]);

  // -----------------------------
  // 4) FOGOS QUANDO CHEGA EM 100%
  // -----------------------------
  useEffect(() => {
    if (done === total && total > 0) {
      launchFireworks();
      if (containerRef.current) {
        launchCoinRain(containerRef.current);
      }
    }
  }, [done, total]);

  // -----------------------------
  // 5) FUNÇÃO PARA MARCAR CONCLUÍDO
  // -----------------------------
  const toggleConcluido = (id) => {
    setConcluidos((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // -----------------------------
  // RENDER
  // -----------------------------
  return (
    <div ref={containerRef} className="pt-3 pr-6 pl-0">
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

          {loadingProgress && (
            <p className="mt-2 text-xs text-slate-400">
              Carregando progresso do curso...
            </p>
          )}
        </div>
      </div>

      {/* BLOCO 2 – Cards */}
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
                {/* Porquinho */}
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
                  {/* Título + Badge ABSOLUTO */}
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
