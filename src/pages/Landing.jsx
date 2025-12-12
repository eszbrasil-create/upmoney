// src/pages/Landing.jsx → VERSÃO FINAL DO TEU JEITO (SUBIU TUDO + YOUTUBE BRABO)
import React, { useState } from "react";

const IconWhatsApp = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
    <path d="M20.52 3.48A11.86 11.86 0 0 0 12.06 0C5.48 0 .13 5.35.13 11.94c0 2.1.55 4.14 1.6 5.96L0 24l6.28-1.64a11.92 11.92 0 0 0 5.78 1.48h.01c6.58 0 11.94-5.35.94-11.94a11.86 11.86 0 0 0-3.5-8.42ZM12.07 21.2h-.01a9.23 9.23 0 0 1-4.71-1.29l-.34-.2-3.73.98 1-3.64-.22-.37a9.25 9.25 0 0 1-1.41-4.95c0-5.1 4.15-9.25 9.26-9.25 2.47 0 4.79.96 6.53 2.7a9.2 9.2 0 0 1 2.71 6.55c0 5.1-4.15 9.24-9.26 9.24Z" />
  </svg>
);

export default function Landing({ onNavigate }) {
  const WHATSAPP_NUMBER = "393517380919";
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({ nome: "", email: "", telefone: "" });

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const enviarWhats = (e) => {
    e.preventDefault();
    const msg = `Olá! Vim da landing.\nNome: ${form.nome}\nE-mail: ${form.email}\nTel: ${form.telefone}\nQuero a avaliação gratuita`;
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`, "_blank");
    setIsModalOpen(false);
  };

  const falarAgora = () => {
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=Oi! Quero meu primeiro dividendo em 30 dias. Podemos falar agora?`, "_blank");
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* HEADER */}
      <header className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <button onClick={() => onNavigate?.("landing")} className="text-2xl font-black text-white">
            UpMoney
          </button>

          <nav className="hidden lg:flex items-center gap-10 text-white/80 font-medium">
            <button onClick={() => onNavigate?.("cursos")} className="hover:text-white">Cursos</button>
            <button onClick={() => onNavigate?.("cashcontrol-home")} className="hover:text-white">UpControl</button>
            <button onClick={() => onNavigate?.("saida-fiscal")} className="hover:text-white">Saída Fiscal</button>
            <button onClick={() => onNavigate?.("invista-exterior")} className="hover:text-white">Invista no Exterior</button>
          </nav>

          <div className="flex items-center gap-4">
            <button onClick={() => onNavigate?.("login")} className="bg-gradient-to-r from-amber-500 to-yellow-600 text-slate-900 px-6 py-2.5 rounded-xl font-bold hover:scale-105 transition hidden sm:block">
              Meu Plano
            </button>

            {/* YOUTUBE COM CARA DE YOUTUBE */}
            <a href="https://youtube.com/@upmoney" target="_blank" rel="noopener noreferrer" className="group">
              <div className="w-12 h-12 bg-red-600 rounded-xl flex items-center justify-center shadow-lg hover:shadow-red-600/60 hover:scale-110 transition-all">
                <svg className="w-8 h-8 text-white drop-shadow-md" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.5 6.19a3.03 3.03 0 0-2.13-2.13C19.6 3.5 12 3.5 12 3.5s-7.6 0-9.37.56A3.03 3.03 0 0 0 .5 6.19 31.5 31.5 0 0 0 0 12c0 1.94.18 3.87.5 5.81.28 1.01 1.11 1.8 2.13 2.08C4.4 20.5 12 20.5 12 20.5s7.6 0 9.37-.56a3.03 3.03 0 0 0 2.13-2.13c.32-1.93.5-3.86.5-5.81 0-1.94-.18-3.87-.5-5.81ZM9.75 15.5v-7l6 3.5-6 3.5Z"/>
                </svg>
              </div>
            </a>

            {/* INSTAGRAM LINDO */}
            <a href="https://instagram.com/upmoneybr" target="_blank" rel="noopener noreferrer" className="group">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 rounded-xl p-0.5">
                <div className="w-full h-full bg-slate-900 rounded-xl flex items-center justify-center hover:scale-110 transition-all">
                  <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.81.25 2.24.42.56.22.96.49 1.38.9.41.41.67.82.9 1.38.17.43.37 1.07.42 2.24.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.81-.42 2.24a3.6 3.6 0 0 1-.9 1.38 3.6 3.6 0 0 1-1.38.9c-.43.17-1.07.37-2.24.42-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.81-.25-2.24-.42a3.6 3.6 0 0 1-1.38-.9 3.6 3.6 0 0 1-.9-1.38c-.17-.43-.37-1.07-.42-2.24C2.17 15.58 2.16 15.2 2.16 12s.01-3.58.07-4.85c.05-1.17.25-1.81.42-2.24.22-.56.49-.96.9-1.38.41-.41.82-.67 1.38-.9.43-.17 1.07-.37 2.24-.42C8.42 2.17 8.8 2.16 12 2.16Zm0 3.4c-3.16 0-3.53.01-4.77.07-.98.05-1.52.21-1.87.35-.47.18-.8.4-1.15.75-.35.35-.57.68-.75 1.15-.14.35-.3.89-.35 1.87-.06 1.24-.07 1.61-.07 4.77s.01 3.53.07 4.77c.05.98.21 1.52.35 1.87.18.47.4.8.75 1.15.35.35.68.57 1.15.75.35.14.89.3 1.87.35 1.24.06 1.61.07 4.77.07s3.53-.01 4.77-.07c.98-.05 1.52-.21 1.87-.35.47-.18.8-.4 1.15-1.15.35-.35.57-.68.75-1.15.14-.35.3-.89.35-1.87.06-1.24.07-1.61.07-4.77s-.01-3.53-.07-4.77c-.05-.98.21-1.52.35-1.87a2.62 2.62 0 0 0-.75-1.15c-.35-.35-.68-.57-1.15-.75-.35-.14-.89-.3-1.87-.35-1.24-.06-1.61-.07-4.77-.07Zm0 2.7a4.64 4.64 0 1 1 0 9.28 4.64 4.64 0 0 1 0-9.28Zm0 1.8a2.84 2.84 0 1 0 0 5.68 2.84 2.84 0 0 0 0-5.68Zm5.93-2.18a1.09 1.09 0 1 1 0 2.18 1.09 1.09 0 0 1 0-2.18Z"/>
                  </svg>
                </div>
              </div>
            </a>
          </div>
        </div>
      </header>

      {/* HERO FINAL – BADGE SUBIDO E CENTRALIZADO */}
      <section className="relative bg-gradient-to-b from-white to-amber-50/30 pt-16 pb-20">
        {/* BADGE VERMELHO SUBIDO ATÉ QUASE O HEADER */}
        <div className="container mx-auto px-4 text-center -mt-10 mb-10">
          <div className="inline-flex items-center gap-4 bg-red-600 text-white px-10 py-5 rounded-full text-2xl font-black uppercase tracking-wider shadow-2xl shadow-red-600/50 animate-pulse">
            <span className="relative flex h-5 w-5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-80"></span>
              <span className="relative inline-flex rounded-full h-5 w-5 bg-white"></span>
            </span>
            VAGAS LIMITADAS PARA 1 TURMA · DEPOIS SÓ EM 2026
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left">
              <h1 className="text-5xl lg:text-6xl font-black tracking-tight text-slate-900 leading-tight">
                Receba seu <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-600 to-orange-600">primeiro dividendo</span>
                <br className="hidden lg:block" />
                em até <span className="text-amber-600">30 dias</span>
              </h1>

              <p className="mt-6 text-xl lg:text-2xl text-slate-700 font-medium">
                Programa completo com acompanhamento individual até o dinheiro pingar na sua conta.
              </p>

              <p className="mt-4 text-2xl font-bold text-amber-600">
                Resultado garantido ou devolvo cada centavo.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <button onClick={() => setIsModalOpen(true)} className="group relative overflow-hidden bg-gradient-to-r from-amber-500 to-orange-600 px-10 py-5 rounded-2xl text-xl font-bold text-white shadow-2xl hover:shadow-amber-500/50 hover:scale-105 transition-all duration-300">
                  <span className="absolute inset-0 bg-white/25 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                  Quero meu primeiro dividendo em 30 dias
                </button>
                <button onClick={falarAgora} className="flex items-center justify-center gap-3 bg-[#25D366] px-10 py-5 rounded-2xl text-xl font-bold text-white shadow-2xl hover:shadow-green-500/50 hover:scale-105 transition">
                  <IconWhatsApp className="w-8 h-8" />
                  Falar agora no WhatsApp
                </button>
              </div>

              <div className="mt-6">
                <button onClick={() => setIsModalOpen(true)} className="inline-flex items-center gap-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-8 py-4 rounded-2xl font-bold text-lg shadow-xl hover:shadow-emerald-500/50 hover:scale-105 transition-all duration-300">
                  <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                  </svg>
                  Avaliação gratuita • 15 minutos • 100% gratuita e sem compromisso
                </button>
              </div>
            </div>

            <div className="relative">
              <div className="bg-white rounded-3xl shadow-2xl p-8 border border-slate-200">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center text-white text-5xl font-black shadow-2xl">
                    U
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-slate-900">UpControl</div>
                    <div className="text-slate-600">Controle total do seu patrimônio</div>
                  </div>
                </div>
                <img src="/dash_recortado.jpg" alt="Dashboard UpControl" className="w-full rounded-2xl border border-slate-200 shadow-inner" />
                <div className="mt-6 bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-center py-6 rounded-2xl shadow-lg">
                  <div className="text-4xl font-black">R$ 1.847,22</div>
                  <div className="text-lg opacity-90">Dividendos este mês</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-slate-900">Avaliação Gratuita (15 min)</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-3xl text-slate-400 hover:text-slate-600">×</button>
            </div>
            <form onSubmit={enviarWhats} className="space-y-5">
              <input type="text" name="nome" value={form.nome} onChange={handleChange} placeholder="Seu nome completo" required className="w-full px-5 py-4 border border-slate-300 rounded-xl focus:ring-4 focus:ring-amber-300" />
              <input type="email" name="email" value={form.email} onChange={handleChange} placeholder="seu@email.com" required className="w-full px-5 py-4 border border-slate-300 rounded-xl focus:ring-4 focus:ring-amber-300" />
              <input type="tel" name="telefone" value={form.telefone} onChange={handleChange} placeholder="(11) 98765-4321" required className="w-full px-5 py-4 border border-slate-300 rounded-xl focus:ring-4 focus:ring-amber-300" />
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-4 border border-slate-300 rounded-xl font-medium hover:bg-slate-50">Cancelar</button>
                <button type="submit" className="flex-1 py-4 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl font-bold hover:scale-105 transition">Enviar e falar no WhatsApp</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <footer className="bg-slate-900 text-white/60 py-12 mt-20">
        <div className="max-w-7xl mx-auto px-6 text-center text-sm">
          UpMoney © 2025 — O seu primeiro dividendo começa aqui.
        </div>
      </footer>
    </div>
  );
}