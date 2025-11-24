// src/pages/Landing.jsx
// Página inicial completa do ecossistema "Meu Patrimônio"

import React, { useState } from "react";

const IconWhatsApp = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
    <path d="M20.52 3.48A11.86 11.86 0 0 0 12.06 0C5.48 0 .13 5.35.13 11.94c0 2.1.55 4.14 1.6 5.96L0 24l6.28-1.64a11.92 11.92 0 0 0 5.78 1.48h.01c6.58 0 11.94-5.35 11.94-11.94a11.86 11.86 0 0 0-3.5-8.42ZM12.07 21.2h-.01a9.23 9.23 0 0 1-4.71-1.29l-.34-.2-3.73.98 1-3.64-.22-.37a9.25 9.25 0 0 1-1.41-4.95c0-5.1 4.15-9.25 9.26-9.25 2.47 0 4.79.96 6.53 2.7a9.2 9.2 0 0 1 2.71 6.55c0 5.1-4.15 9.24-9.26 9.24Z" />
  </svg>
);

const IconYouTube = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
    <path d="M23.5 6.19a3.03 3.03 0 0 0-2.13-2.13C19.6 3.5 12 3.5 12 3.5s-7.6 0-9.37.56A3.03 3.03 0 0 0 .5 6.19 31.5 31.5 0 0 0 0 12c0 1.94.18 3.87.5 5.81.28 1.01 1.11 1.8 2.13 2.08C4.4 20.5 12 20.5 12 20.5s7.6 0 9.37-.56a3.03 3.03 0 0 0 2.13-2.13c.32-1.93.5-3.86.5-5.81 0-1.94-.18-3.87-.5-5.81ZM9.75 15.5v-7l6 3.5-6 3.5Z" />
  </svg>
);

const IconInstagram = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
    <path d="M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.81.25 2.24.42.56.22.96.49 1.38.9.41.41.67.82.9 1.38.17.43.37 1.07.42 2.24.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.81-.42 2.24a3.6 3.6 0 0 1-.9 1.38 3.6 3.6 0 0 1-1.38.9c-.43.17-1.07.37-2.24.42-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.81-.25-2.24-.42a3.6 3.6 0 0 1-1.38-.9 3.6 3.6 0 0 1-.9-1.38c-.17-.43-.37-1.07-.42-2.24C2.17 15.58 2.16 15.2 2.16 12s.01-3.58.07-4.85c.05-1.17.25-1.81.42-2.24.22-.56.49-.96.9-1.38.41-.41.82-.67 1.38-.9.43-.17 1.07-.37 2.24-.42C8.42 2.17 8.8 2.16 12 2.16Z" />
  </svg>
);

// divisor premium entre faixas
const SectionDivider = () => (
  <div className="w-full">
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="h-px w-full bg-gradient-to-r from-transparent via-[#1f3548]/30 to-transparent" />
    </div>
    <div className="h-10" />
  </div>
);

export default function Landing({ onNavigate }) {
  const RECEIVER_EMAIL = "eszbrasil@gmail.com";
  const WHATSAPP_NUMBER = "393517380919";

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({ nome: "", email: "", telefone: "" });

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const subject = "Novo agendamento — Meu Primeiro Dividendo";
    const body = `Nome: ${form.nome}\nE-mail: ${form.email}\nTelefone: ${form.telefone}\nOrigem: Landing > Agendar avaliação gratuita`;

    window.location.href = `mailto:${RECEIVER_EMAIL}?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(body)}`;

    window.open(
      `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(body)}`,
      "_blank"
    );

    setIsModalOpen(false);
  };

  const openWhatsAppDirect = () => {
    const text =
      "Olá! Quero conquistar meu primeiro dividendo. Podemos falar sobre a avaliação gratuita de 15 minutos?";
    window.open(
      `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`,
      "_blank"
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-white text-[#1f3548]">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#1f3548] text-white/95">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <button
            type="button"
            onClick={() => onNavigate?.("landing")}
            className="font-semibold tracking-tight text-xl hover:opacity-90 transition-opacity"
          >
            UpMoney
          </button>

          {/* Navegação principal */}
          <nav className="hidden md:flex items-center gap-8 text-sm">
            <a
              href="#cursos"
              onClick={(e) => {
                e.preventDefault();
                onNavigate?.("cursos");
              }}
              className="hover:text-white"
            >
              Cursos
            </a>

            {/* ✅ UpControl logo após Cursos (mesmo estilo dos outros) */}
            <a
              href="#upcontrol"
              onClick={(e) => {
                e.preventDefault();
                onNavigate?.("cashcontrol-home");
              }}
              className="hover:text-white"
            >
              UpControl
            </a>

            <a
              href="#saida-fiscal"
              onClick={(e) => {
                e.preventDefault();
                onNavigate?.("saida-fiscal");
              }}
              className="hover:text-white"
            >
              Saída Fiscal
            </a>

            <a
              href="#invista-exterior"
              onClick={(e) => {
                e.preventDefault();
                onNavigate?.("invista-exterior");
              }}
              className="hover:text-white"
            >
              Invista no Exterior
            </a>

            <a
              href="#ultimas-noticias"
              onClick={(e) => {
                e.preventDefault();
                onNavigate?.("noticias");
              }}
              className="hover:text-white"
            >
              Últimas notícias
            </a>
          </nav>

          {/* Lado direito: Meu Plano + ícones sociais */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => onNavigate?.("plano")}
              className="hidden sm:inline-flex items-center rounded-xl bg-[#F5B60A] px-4 py-2 text-sm font-bold text-[#1f3548] shadow-sm hover:brightness-105 transition"
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

      {/* Hero 1 */}
      <main className="flex-1">
        <section className="bg-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 grid md:grid-cols-2 gap-12 items-center">
            {/* Imagem */}
            <div className="order-2 md:order-1">
              <div className="aspect-[4/3] w-full overflow-hidden rounded-2xl bg-[#cfd6dc]/30 flex items-center justify-center">
                <img
                  src="/hero-hand-tree.png"
                  alt="Mão com moedas e uma pequena árvore"
                  className="h-full w-full object-cover"
                />
              </div>
            </div>

            {/* Texto e CTA */}
            <div className="order-1 md:order-2">
              <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-[#1f3548] leading-tight">
                Conquiste seu Primeiro Dividendo em 30 dias
              </h1>

              <p className="mt-5 text-lg text-[#1f3548]/80 leading-relaxed">
                Nada de complicação, termos difíceis ou teoria sem prática.
                Aqui você aprende fazendo: passo a passo, no seu ritmo, com orientação real
                e o suporte que faltava para finalmente entrar no mundo dos investimentos.
              </p>

              {/* ✅ Botões com fonte maior (Hero 1) */}
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="inline-flex items-center gap-3 rounded-2xl bg-[#F5B60A] px-9 py-5 text-xl font-extrabold text-[#1f3548] shadow-sm hover:brightness-105 transition"
                >
                  <IconWhatsApp className="h-7 w-7" />
                  Agende sua avaliação gratuita
                </button>

                <button
                  onClick={openWhatsAppDirect}
                  className="inline-flex items-center gap-3 rounded-2xl bg-[#25D366] px-9 py-5 text-xl font-extrabold text-white shadow-sm hover:brightness-105 transition"
                >
                  <IconWhatsApp className="h-7 w-7" />
                  Falar no WhatsApp
                </button>
              </div>

              {/* Microprovas */}
              <div className="mt-4 flex flex-wrap gap-3 text-sm text-[#1f3548]/70">
                <span>✔ Ideal para iniciantes</span>
                <span>✔ Acompanhamento individual</span>
                <span>✔ App UpControl incluído</span>
              </div>
            </div>
          </div>
        </section>

        {/* Respiro entre faixas */}
        <div className="h-16 md:h-24" />
        <SectionDivider />

        {/* Hero 2 — Programa */}
        <section className="bg-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 grid md:grid-cols-2 gap-10 items-center">
            <div className="order-1">
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#1f3548]">
                O Programa Completo para Viver seu Primeiro Dividendo
              </h2>

              <p className="mt-4 text-lg text-[#1f3548]/80">
                Você terá acesso ao método que já ajudou muitas pessoas a saírem do zero
                e conquistarem renda passiva real com segurança e estratégia.
              </p>

              <ul className="mt-6 space-y-3 text-[#1f3548]/90">
                <li>📘 Curso completo de <strong>Renda Fixa</strong></li>
                <li>📗 Curso de <strong>Ações</strong> — como escolher empresas boas pagadoras</li>
                <li>📙 Curso de <strong>FIIs</strong> — renda mensal na prática</li>
                <li>📂 Material exclusivo (PDFs, resumos e roteiros)</li>
                <li>📊 Acesso ao <strong>UpControl</strong> (controle patrimonial)</li>
                <li>📅 Agenda de <strong>acompanhamento pessoal</strong> comigo</li>
                <li>💬 Grupo exclusivo no WhatsApp</li>
              </ul>

              <button
                onClick={() => setIsModalOpen(true)}
                className="mt-7 inline-flex items-center gap-2 rounded-xl bg-[#F5B60A] px-6 py-3 font-semibold text-[#1f3548] shadow hover:brightness-105 transition"
              >
                <IconWhatsApp className="h-5 w-5" />
                Agende sua avaliação gratuita
              </button>
            </div>

            <div className="order-2">
              <div className="aspect-[4/3] w-full overflow-hidden rounded-2xl bg-[#cfd6dc]/30 flex items-center justify-center">
                <img
                  src="/hero-dividendo.png"
                  alt="Benefícios do programa"
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Modal de agendamento */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between">
              <h2 className="text-xl font-bold text-[#1f3548]">
                Agendar avaliação gratuita
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="ml-4 rounded-lg px-2 py-1 text-[#1f3548]/70 hover:bg-[#cfd6dc]/40"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <input
                name="nome"
                value={form.nome}
                onChange={onChange}
                placeholder="Seu nome"
                className="w-full border rounded-xl px-3 py-2"
                required
              />
              <input
                name="email"
                value={form.email}
                onChange={onChange}
                placeholder="seu@email.com"
                className="w-full border rounded-xl px-3 py-2"
                required
              />
              <input
                name="telefone"
                value={form.telefone}
                onChange={onChange}
                placeholder="(DDD) 90000-0000"
                className="w-full border rounded-xl px-3 py-2"
                required
              />

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="border px-4 py-2 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-[#1f3548] px-5 py-2 rounded-xl font-semibold text-white hover:brightness-110"
                >
                  Enviar pelo WhatsApp
                </button>
              </div>
            </form>

            <p className="mt-4 text-xs text-[#1f3548]/60">
              Os dados serão enviados por e-mail e WhatsApp.
            </p>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="mt-10 bg-[#1f3548] text-white/95">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
          <p className="text-sm text-white/75">
            UpMoney — Educação e controle financeiro para uma vida com liberdade.
          </p>
        </div>
      </footer>
    </div>
  );
}
