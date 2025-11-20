// src/pages/Cursos.jsx
// Página full-screen de Cursos, reutilizando o layout da Saída Fiscal

import React from "react";

const IconWhatsApp = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
    <path d="M20.52 3.48A11.86 11.86 0 0 0 12.06 0C5.48 0 .13 5.35.13 11.94c0 2.1.55 4.14 1.6 5.96L0 24l6.28-1.64a11.92 11.92 0 0 0 5.78 1.48h.01c6.58 0 11.94-5.35 11.94-11.94a11.86 11.86 0 0 0-3.5-8.42ZM12.07 21.2h-.01a9.23 9.23 0 0 1-4.71-1.29l-.34-.2-3.73.98 1-3.64-.22-.37a9.25 9.25 0 0 1-1.41-4.95c0-5.1 4.15-9.25 9.26-9.25 2.47 0 4.79.96 6.53 2.7a9.2 9.2 0 0 1 2.71 6.55c0 5.1-4.15 9.24-9.26 9.24Zm5.27-6.91c-.29-.14-1.7-.84-1.96-.93-.26-.1-.45-.14-.64.14s-.74.93-.9 1.12c-.17.19-.33.21-.62.07-.29-.14-1.22-.45-2.33-1.44-.86-.76-1.44-1.7-1.61-1.98-.17-.29-.02-.45.12-.59.13-.13.29-.33.43-.5.14-.17.19-.29.29-.48.1-.19.05-.36-.02-.5-.07-.14-.64-1.55-.88-2.12-.23-.55-.47-.47-.64-.48-.17-.01-.36-.01-.55-.01-.19 0-.5.07-.76.36-.26.29-1 1-1 2.43 0 1.43 1.03 2.82 1.17 3.01.14.19 2.03 3.1 4.92 4.35.69.3 1.22.48 1.64.61.69.22 1.31.19 1.8.12.55-.08 1.7-.69 1.95-1.36.24-.67.24-1.24.17-1.36-.06-.12-.26-.2-.55-.34Z" />
  </svg>
);

const IconYouTube = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
    <path d="M23.5 6.19a3.03 3.03 0 0 0-2.13-2.13C19.6 3.5 12 3.5 12 3.5s-7.6 0-9.37.56A3.03 3.03 0 0 0 .5 6.19 31.5 31.5 0 0 0 0 12c0 1.94.18 3.87.5 5.81.28 1.01 1.11 1.8 2.13 2.08C4.4 20.5 12 20.5 12 20.5s7.6 0 9.37-.56a3.03 3.03 0 0 0 2.13-2.13c.32-1.93.5-3.86.5-5.81 0-1.94-.18-3.87-.5-5.81ZM9.75 15.5v-7l6 3.5-6 3.5Z" />
  </svg>
);

const IconInstagram = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
    <path d="M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.81.25 2.24.42.56.22.96.49 1.38.9.41.41.67.82.9 1.38.17.43.37 1.07.42 2.24.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.81-.42 2.24a3.6 3.6 0 0 1-.9 1.38 3.6 3.6 0 0 1-1.38.9c-.43.17-1.07.37-2.24.42-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.81-.25-2.24-.42a3.6 3.6 0 0 1-1.38-.9 3.6 3.6 0 0 1-.9-1.38c-.17-.43-.37-1.07-.42-2.24C2.17 15.58 2.16 15.2 2.16 12s.01-3.58.07-4.85c.05-1.17.25-1.81.42-2.24.22-.56.49-.96.9-1.38.41-.41.82-.67 1.38-.9.43-.17 1.07-.37 2.24-.42C8.42 2.17 8.8 2.16 12 2.16Zm0 3.4c-3.16 0-3.53.01-4.77.07-.98.05-1.52.21-1.87.35-.47.18-.8.4-1.15.75-.35.35-.57.68-.75 1.15-.14.35-.3.89-.35 1.87-.06 1.24-.07 1.61-.07 4.77s.01 3.53.07 4.77c.05.98.21 1.52.35 1.87.18.47.4.8.75 1.15.35.35.68.57 1.15.75.35.14.89.3 1.87.35 1.24.06 1.61.07 4.77.07s3.53-.01 4.77-.07c.98-.05 1.52-.21 1.87-.35.47-.18.8-.4 1.15-.75.35-.35.57-.68.75-1.15.14-.35.3-.89.35-1.87.06-1.24.07-1.61.07-4.77s-.01-3.53-.07-4.77c-.05-.98-.21-1.52-.35-1.87a2.62 2.62 0 0 0-.75-1.15c-.35-.35-.68-.57-1.15-.75-.35-.14-.89-.3-1.87-.35-1.24-.06-1.61-.07-4.77-.07Zm0 2.7a4.64 4.64 0 1 1 0 9.28 4.64 4.64 0 0 1 0-9.28Zm0 1.8a2.84 2.84 0 1 0 0 5.68 2.84 2.84 0 0 0 0-5.68Zm5.93-2.18a1.09 1.09 0 1 1 0 2.18 1.09 1.09 0 0 1 0-2.18Z" />
  </svg>
);

export default function Cursos({ onNavigate }) {
  const WHATSAPP_NUMBER = "5585999999999";

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      {/* Header (mesmo layout do SaidaFiscal, com Cursos ativo) */}
      <header className="sticky top-0 z-40 bg-[#020617] text-white/95 border-b border-slate-800/60">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div
            className="font-semibold tracking-tight text-xl cursor-pointer"
            onClick={() => onNavigate?.("landing")}
          >
            Meu Patrimônio
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm">
            <button
              onClick={() => onNavigate?.("cursos")}
              className="text-emerald-300 font-semibold"
            >
              Cursos
            </button>

            <button
              onClick={() => onNavigate?.("saida-fiscal")}
              className="hover:text-white text-slate-200"
            >
              Saída Fiscal
            </button>

            <button
              onClick={() => onNavigate?.("invista-exterior")}
              className="hover:text-white text-slate-200"
            >
              Invista no Exterior
            </button>

            <button
              onClick={() => onNavigate?.("noticias")}
              className="hover:text-white text-slate-200"
            >
              Últimas notícias
            </button>

            <button
              onClick={() => onNavigate?.("cashcontrol-home")}
              className="hover:text-white text-slate-200"
            >
              CashControl
            </button>
          </nav>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate?.("login")}
              className="rounded-xl bg-[#d6af5f] px-4 py-2 font-medium text-[#1f3548] hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-emerald-400/60"
            >
              Meu Plano
            </button>

            <a
              href="https://youtube.com"
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/10 hover:bg-white/20"
              aria-label="YouTube"
            >
              <IconYouTube className="h-4 w-4" />
            </a>

            <a
              href="https://instagram.com"
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/10 hover:bg-white/20"
              aria-label="Instagram"
            >
              <IconInstagram className="h-4 w-4" />
            </a>
          </div>
        </div>
      </header>

      {/* Conteúdo principal (mesma estrutura de grid do SaidaFiscal) */}
      <main className="flex-1">
        <section className="bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 md:py-16 grid md:grid-cols-2 gap-10 items-center">
            {/* Coluna texto */}
            <div>
              <p className="text-emerald-300 text-xs font-semibold tracking-[0.2em] uppercase mb-3">
                Programa Educacional
              </p>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-50">
                Cursos & trilhas{" "}
                <span className="text-emerald-300">para construir patrimônio</span>
              </h1>

              <p className="mt-4 text-sm sm:text-base text-slate-300 max-w-xl">
                Aulas e acompanhamentos desenhados para você sair do zero,
                organizar suas finanças e começar a investir com confiança —
                sempre conectado ao uso do CashControl.
              </p>

              <ul className="mt-5 space-y-2 text-sm text-slate-300">
                <li>• Linguagem simples, foco total na prática.</li>
                <li>• Integração direta com seus dashboards do CashControl.</li>
                <li>• Acompanhamento por WhatsApp no programa principal.</li>
              </ul>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <a
                  href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
                    "Olá! Quero mais detalhes sobre o curso 'Do Zero ao Meu Primeiro Dividendo'."
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 font-semibold text-slate-950 shadow-lg shadow-emerald-500/30 hover:bg-emerald-400"
                >
                  <IconWhatsApp className="h-5 w-5" />
                  Quero participar
                </a>

                <button className="inline-flex items-center rounded-xl border border-slate-600 px-4 py-2.5 text-sm font-medium text-slate-200 hover:border-emerald-400 hover:text-emerald-300">
                  Ver detalhes do programa
                </button>
              </div>
            </div>

            {/* Coluna card do curso */}
            <div className="md:pl-4">
              <div className="rounded-2xl border border-slate-700/80 bg-slate-900/70 p-5 shadow-2xl shadow-emerald-500/10">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-sm font-semibold text-slate-100">
                      Do Zero ao Meu Primeiro Dividendo
                    </h2>
                    <p className="text-xs text-slate-400">
                      Programa principal de acompanhamento
                    </p>
                  </div>
                  <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold text-emerald-300">
                    30 dias
                  </span>
                </div>

                <ul className="space-y-3 text-sm text-slate-200">
                  <li>
                    <span className="font-semibold">3 encontros 1:1</span> para
                    organizar suas finanças e definir sua estratégia.
                  </li>
                  <li>
                    <span className="font-semibold">Acesso ao CashControl</span>{" "}
                    para acompanhar sua evolução patrimonial.
                  </li>
                  <li>
                    <span className="font-semibold">
                      Roteiro prático de investimentos
                    </span>{" "}
                    até o seu primeiro dividendo.
                  </li>
                  <li>
                    Suporte por WhatsApp durante todo o período do programa.
                  </li>
                </ul>

                <div className="mt-5 rounded-xl border border-slate-700 bg-slate-900/80 px-3 py-2 text-[11px] text-slate-300">
                  <p>
                    <span className="font-semibold text-emerald-300">
                      Importante:
                    </span>{" "}
                    este é um programa educacional, focado em ensinar você a
                    tomar decisões com consciência. Não é recomendação
                    individual de investimento.
                  </p>
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-950/60 p-4 text-xs text-slate-300">
                <p className="font-semibold text-slate-100 mb-1">
                  Próximas trilhas que estamos preparando:
                </p>
                <ul className="space-y-1.5">
                  <li>• Fundamentos da Renda Fixa</li>
                  <li>• FIIs para renda mensal</li>
                  <li>• Como investir no exterior do zero</li>
                  <li>• Estratégias de acumulação para longo prazo</li>
                </ul>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer igual ao da Saída Fiscal */}
      <footer className="mt-10 bg-[#020617] text-white/95 border-t border-slate-800/60">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <nav className="flex items-center gap-6 text-sm">
              <a href="#sobre" className="hover:text-white">
                Sobre
              </a>
              <a href="#contato" className="hover:text-white">
                Contato
              </a>
              <a href="#privacidade" className="hover:text-white">
                Política de Privacidade
              </a>
            </nav>
          </div>

          <p className="mt-6 text-xs text-white/70">
            Meu Patrimônio — Conteúdo educacional. Não constitui recomendação
            de investimento.
          </p>
        </div>
      </footer>
    </div>
  );
}