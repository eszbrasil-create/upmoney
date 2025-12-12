// src/pages/Landing.jsx → VERSÃO 100% FUNCIONAL (COMPILA NO VERCEL)
import React, { useState } from "react";

const IconWhatsApp = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
    <path d="M20.52 3.48A11.86 11.86 0 0 0 12.06 0C5.48 0 .13 5.35.13 11.94c0 2.1.55 4.14 1.6 5.96L0 24l6.28-1.64a11.92 11.92 0 0 0 5.78 1.48h.01c6.58 0 11.94-5.35 11.94-11.94a11.86 11.86 0 0 0-3.5-8.42ZM12.07 21.2h-.01a9.23 9.23 0 0 1-4.71-1.29l-.34-.2-3.73.98 1-3.64-.22-.37a9.25 9.25 0 0 1-1.41-4.95c0-5.1 4.15-9.25 9.26-9.25 2.47 0 4.79.96 6.53 2.7a9.2 9.2 0 0 1 2.71 6.55c0 5.1-4.15 9.24-9.26 9.24Z" />
  </svg>
);

export default function Landing({ onNavigate }) {
  const WHATSAPP_NUMBER = "393517380919";

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({ nome: "", email: "", telefone: "" });

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const enviarWhats = (e) => {
    e.preventDefault();
    const msg = `Olá! Vim da landing.\nNome: ${form.nome}\nE-mail: ${form.email}\nTel: ${form.telefone}\nQuero a avaliação gratuita de 15 minutos`;
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`, "_blank");
    setIsModalOpen(false);
  };

  const falarAgora = () => {
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=Oi! Quero meu primeiro dividendo em 30 dias. Podemos conversar?`, "_blank");
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
          <button
            onClick={() => onNavigate?.("login")}
            className="bg-gradient-to-r from-amber-500 to-yellow-600 text-slate-900 px-6 py-2.5 rounded-xl font-bold hover:scale-105 transition"
          >
            Meu Plano
          </button>
        </div>
      </header>

      {/* HERO COM BOTÕES COLADOS */}
      <section className="relative overflow-hidden bg-gradient-to-b from-white to-amber-50/30 py-12 lg:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-start">
            {/* TEXTO + BOTÕES COLADÍSSIMOS */}
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 to-yellow-600 text-white px-5 py-2.5 rounded-full text-sm font-bold mb-6 shadow-lg">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
                </span>
                Vagas abertas para os próximos 50 alunos em 2025
              </div>

              <h1 className="text-5xl lg:text-6xl font-black tracking-tight text-slate-900 leading-tight">
                Receba seu <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-600 to-orange-600">primeiro dividendo</span>
                <br className="hidden lg:block" />
                em até <span className="text-amber-600">30 dias</span>
              </h1>

              <p className="mt-5 text-xl lg:text-2xl text-slate-700 font-medium">
                Programa completo com acompanhamento individual até o dinheiro pingar na sua conta.
              </p>

              <p className="mt-3 text-2xl font-bold text-amber-600">
                Resultado garantido ou devolvo cada centavo.
              </p>

              {/* BOTÕES QUASE ENCOSTADOS NO TEXTO */}
              <div className="mt-5 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="group relative overflow-hidden bg-gradient-to-r from-amber-500 to-orange-600 px-10 py-5 rounded-2xl text-xl font-bold text-white shadow-2xl hover:shadow-amber-500/50 hover:scale-105 transition-all duration-300"
                >
                  <span className="absolute inset-0 bg-white/25 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                  Quero meu primeiro dividendo em 30 dias
                </button>

                <button
                  onClick={falarAgora}
                  className="flex items-center justify-center gap-3 bg-[#25D366] px-10 py-5 rounded-2xl text-xl font-bold text-white shadow-2xl hover:shadow-green-500/50 hover:scale-105 transition"
                >
                  <IconWhatsApp className="w-8 h-8" />
                  Falar agora no WhatsApp
                </button>
              </div>

              <p className="mt-4 text-lg text-slate-600 font-medium">
                Avaliação gratuita • 15 minutos • 100% gratuita e sem compromisso
              </p>
            </div>

            {/* IMAGEM SUBIDA */}
            <div className="relative lg:-mt-10">
              <div className="absolute -inset-6 bg-gradient-to-r from-amber-400/20 to-orange-400/20 rounded-3xl blur-3xl -z-10" />
              <div className="bg-white rounded-3xl shadow-2xl p-6 border border-slate-200">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center text-white text-4xl font-black shadow-xl">
                    U
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-slate-900">UpControl</div>
                    <div className="text-slate-600">Controle total do seu patrimônio</div>
                  </div>
                </div>
                <img
                  src="/dash_recortado.jpg"
                  alt="Dashboard UpControl"
                  className="w-full rounded-2xl border border-slate-200 shadow-inner"
                />
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

      {/* FOOTER */}
      <footer className="bg-slate-900 text-white/60 py-12 mt-20">
        <div className="max-w-7xl mx-auto px-6 text-center text-sm">
          UpMoney © 2025 — O seu primeiro dividendo começa aqui.
        </div>
      </footer>
    </div>
  );
}