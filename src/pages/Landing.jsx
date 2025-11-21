// src/pages/Landing.jsx
// Página inicial completa do ecossistema "Meu Patrimônio"

import React, { useState } from "react";

const IconWhatsApp = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
    <path d="M20.52 3.48A11.86 11.86 0 0 0 12.06 0C5.48 0 .13 5.35.13 11.94c0 2.1.55 4.14 1.6 5.96L0 24l6.28-1.64a11.92 11.92 0 0 0 5.78 1.48h.01c6.58 0 11.94-5.35 11.94-11.94a11.86 11.86 0 0 0-3.5-8.42ZM12.07 21.2h-.01a9.23 9.23 0 0 1-4.71-1.29l-.34-.2-3.73.98 1-3.64-.22-.37a9.25 9.25 0 0 1-1.41-4.95c0-5.1 4.15-9.25 9.26-9.25 2.47 0 4.79.96 6.53 2.7a9.2 9.2 0 0 1 2.71 6.55c0 5.1-4.15 9.24-9.26 9.24Z" />
  </svg>
);

export default function Landing({ onNavigate }) {
  // 🔥 SEUS CONTATOS
  const RECEIVER_EMAIL = "eszbrasil@gmail.com";
  const WHATSAPP_NUMBER = "393517380919"; // formato correto para wa.me

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({ nome: "", email: "", telefone: "" });

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const subject = "Novo agendamento — Meu Primeiro Dividendo";
    const body = `Nome: ${form.nome}\nE-mail: ${form.email}\nTelefone: ${form.telefone}\nOrigem: Landing > Agendar reunião`;

    // Enviar e-mail
    window.location.href = `mailto:${RECEIVER_EMAIL}?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(body)}`;

    // Enviar WhatsApp
    window.open(
      `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(body)}`,
      "_blank"
    );

    setIsModalOpen(false);
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
            upControl
          </button>

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

            <a
              href="#cashcontrol"
              onClick={(e) => {
                e.preventDefault();
                onNavigate?.("cashcontrol-home");
              }}
              className="hover:text-white"
            >
              CashControl
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate?.("login")}
              className="rounded-xl bg-[#d6af5f] px-4 py-2 font-medium text-[#1f3548] hover:brightness-105"
            >
              Meu Plano
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1">
        <section className="bg-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 grid md:grid-cols-2 gap-10 items-center">
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

            {/* Texto */}
            <div className="order-1 md:order-2">
              <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-[#1f3548]">
                Conquiste seu Primeiro Dividendo
              </h1>

              <p className="mt-4 text-lg text-[#1f3548]/80">
                O passo a passo para começar a investir e conquistar sua primeira
                renda passiva com acompanhamento educacional individual.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                {/* Botão Quero começar – abre o modal */}
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="inline-flex items-center rounded-xl bg-[#d6af5f] px-5 py-3 font-semibold text-[#1f3548] shadow-sm hover:brightness-105"
                >
                  Quero começar
                </button>

                {/* Botão WhatsApp direto */}
                <a
                  href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
                    "Olá! Quero saber mais sobre o curso Meu Primeiro Dividendo."
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl bg-[#00e59b] px-5 py-3 font-semibold text-[#073b2c] hover:brightness-105"
                >
                  <IconWhatsApp className="h-5 w-5" />
                  Falar no WhatsApp
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex justify-between items-start">
              <h2 className="text-xl font-bold text-[#1f3548]">
                Agendar reunião gratuita
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-2 py-1 rounded-lg text-[#1f3548]/70 hover:bg-[#cfd6dc]/40"
                aria-label="Fechar"
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
                  className="bg-[#d6af5f] px-5 py-2 rounded-xl font-semibold text-[#1f3548] hover:brightness-105"
                >
                  Agendar minha análise
                </button>
              </div>
            </form>

            <p className="mt-4 text-xs text-[#1f3548]/60">
              Seus dados serão enviados para e-mail e WhatsApp.
            </p>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="mt-10 bg-[#1f3548] text-white/95">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
          <nav className="flex items-center gap-6">
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

          <p className="mt-8 text-sm text-white/75">
            Meu Patrimônio — Educação e controle financeiro para uma vida com
            liberdade.
          </p>
        </div>
      </footer>
    </div>
  );
}
