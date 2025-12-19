// src/pages/Landing.jsx — Landing completa (Curso + App) com seções, oferta, FAQ e CTAs
import React, { useMemo, useState } from "react";

const IconWhatsApp = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
    <path d="M20.52 3.48A11.86 11.86 0 0 0 12.06 0C5.48 0 .13 5.35.13 11.94c0 2.1.55 4.14 1.6 5.96L0 24l6.28-1.64a11.92 11.92 0 0 0 5.78 1.48h.01c6.58 0 11.94-5.35 11.94-11.94a11.86 11.86 0 0 0-3.5-8.42ZM12.07 21.2h-.01a9.23 9.23 0 0 1-4.71-1.29l-.34-.2-3.73.98 1-3.64-.22-.37a9.25 9.25 0 0 1-1.41-4.95c0-5.1 4.15-9.25 9.26-9.25 2.47 0 4.79.96 6.53 2.7a9.2 9.2 0 0 1 2.71 6.55c0 5.1-4.15 9.24-9.26 9.24Z" />
  </svg>
);

const Check = (props) => (
  <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" {...props}>
    <path
      fillRule="evenodd"
      d="M16.704 5.29a1 1 0 01.006 1.414l-7.2 7.25a1 1 0 01-1.42.004L3.29 9.16a1 1 0 011.42-1.42l3.08 3.08 6.49-6.53a1 1 0 011.414-.006z"
      clipRule="evenodd"
    />
  </svg>
);

const Shield = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
    <path d="M12 1.75 3.5 5.4v6.1c0 6.1 3.8 10.7 8.5 12.75 4.7-2.05 8.5-6.65 8.5-12.75V5.4L12 1.75Zm0 19.82c-3.5-1.7-6-5.3-6-10.07V6.7L12 4.16l6 2.54v4.8c0 4.77-2.5 8.37-6 10.07Z" />
  </svg>
);

const Lightning = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
    <path d="M13 2 3 14h7l-1 8 12-14h-7l-1-6Z" />
  </svg>
);

const FAQItem = ({ q, a }) => (
  <details className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
    <summary className="cursor-pointer list-none flex items-center justify-between gap-4">
      <span className="text-slate-900 font-bold">{q}</span>
      <span className="text-slate-400 group-open:rotate-45 transition text-2xl leading-none">
        +
      </span>
    </summary>
    <div className="mt-3 text-slate-700 leading-relaxed">{a}</div>
  </details>
);

export default function Landing({ onNavigate }) {
  const WHATSAPP_NUMBER = "393517380919";
  const OWNER_EMAIL = "eszbrasil@gmail.com"; // <- e-mail que vai receber os leads

  const [isModalOpen, setIsModalOpen] = useState(false); // modal avaliação gratuita
  const [form, setForm] = useState({ nome: "", email: "", telefone: "" });

  // modal “Quero entrar na turma”
  const [isTurmaOpen, setIsTurmaOpen] = useState(false);
  const [leadOk, setLeadOk] = useState(false);
  const [lead, setLead] = useState({
    nome: "",
    sobrenome: "",
    email: "",
    telefone: "",
  });

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleLeadChange = (e) =>
    setLead({ ...lead, [e.target.name]: e.target.value });

  const enviarWhats = (e) => {
    e.preventDefault();
    const msg = `Olá! Vim da landing.\nNome: ${form.nome}\nE-mail: ${form.email}\nTel: ${form.telefone}\nQuero a avaliação gratuita de 15 minutos`;
    window.open(
      `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`,
      "_blank",
      "noopener,noreferrer"
    );
    setIsModalOpen(false);
  };

  const falarAgora = () => {
    window.open(
      `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
        "Oi! Quero começar o Meu Primeiro Dividendo. Podemos falar agora?"
      )}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  const irParaCompra = () => {
    // Se você tiver uma rota interna de checkout / plano
    onNavigate?.("login");
  };

  // ENVIAR LEAD (TURMA): WhatsApp + Email (mailto) + mensagem de confirmação
  const enviarTurma = (e) => {
    e.preventDefault();

    const nome = (lead.nome || "").trim();
    const sobrenome = (lead.sobrenome || "").trim();
    const email = (lead.email || "").trim();
    const telefone = (lead.telefone || "").trim();

    const msg = [
      "🔥 Novo interessado na turma (UpMoney)",
      "",
      `Nome: ${nome} ${sobrenome}`,
      `E-mail: ${email}`,
      `WhatsApp: ${telefone}`,
      "",
      "Quero entrar na turma",
    ].join("\n");

    // 1) WhatsApp
    const waUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
      msg
    )}`;
    window.open(waUrl, "_blank", "noopener,noreferrer");

    // 2) E-mail (cliente abre o app de e-mail com o texto pronto)
    const subject = "Novo lead — Quero entrar na turma (UpMoney)";
    const mailtoUrl = `mailto:${OWNER_EMAIL}?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(msg)}`;

    // pequeno delay para reduzir bloqueio em alguns navegadores
    setTimeout(() => {
      window.location.href = mailtoUrl;
    }, 350);

    // 3) Confirmação no modal + reset
    setLeadOk(true);

    setTimeout(() => {
      setIsTurmaOpen(false);
      setLeadOk(false);
      setLead({ nome: "", sobrenome: "", email: "", telefone: "" });
    }, 2500);
  };

  const oferta = useMemo(
    () => ({
      titulo: "Meu Primeiro Dividendo em até 30 dias",
      subtitulo:
        "Programa educacional com acompanhamento individual + 12 meses de UpControl",
      preco: "R$ 497",
      bonus: "UpControl por 12 meses incluso",
      oQueInclui: [
        "Programa educacional (30 dias) com roteiro de execução",
        "3 horas de acompanhamento 1:1 (encontros ao vivo)",
        "Suporte via WhatsApp durante 30 dias",
        "Acesso ao UpControl por 12 meses (bônus incluso)",
        "Materiais de apoio (checklist + apostila + passos práticos)",
        "Opção de horas extras após o programa",
      ],
    }),
    []
  );

  const produtoAppOnly = useMemo(
    () => ({
      titulo: "UpControl Essencial (somente app)",
      preco: "R$ 199",
      detalhe:
        "Acesso anual ao app para controle de despesas/receitas e organização financeira.",
      inclui: [
        "Controle de despesas e receitas (dash Despesas)",
        "Organização mensal/por ano",
        "Exportação PDF (relatório)",
        "Acesso por 12 meses",
      ],
      observacao: "Sem acompanhamento 1:1 e sem trilha do curso.",
    }),
    []
  );

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* HEADER */}
      <header className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <button
            onClick={() => onNavigate?.("landing")}
            className="text-2xl font-black text-white"
          >
            UpMoney
          </button>

          <nav className="hidden lg:flex items-center gap-10 text-white/80 font-medium">
            <button
              onClick={() => onNavigate?.("cursos")}
              className="hover:text-white"
            >
              Cursos
            </button>
            <button
              onClick={() => onNavigate?.("cashcontrol-home")}
              className="hover:text-white"
            >
              UpControl
            </button>
            <button
              onClick={() => onNavigate?.("saida-fiscal")}
              className="hover:text-white"
            >
              Saída Fiscal
            </button>
            <button
              onClick={() => onNavigate?.("invista-exterior")}
              className="hover:text-white"
            >
              Invista no Exterior
            </button>
          </nav>

          <div className="flex items-center gap-4">
            <button
              onClick={irParaCompra}
              className="bg-gradient-to-r from-amber-500 to-yellow-600 text-slate-900 px-6 py-2.5 rounded-xl font-black hover:scale-105 transition hidden sm:block"
            >
              Meu Plano
            </button>

            {/* YOUTUBE */}
            <a
              href="https://youtube.com/@upmoney"
              target="_blank"
              rel="noopener noreferrer"
              className="group"
            >
              <div className="w-14 h-14 bg-red-600 rounded-2xl flex items-center justify-center shadow-xl hover:shadow-red-600/60 hover:scale-110 transition-all duration-300">
                <svg
                  className="w-9 h-9 text-white drop-shadow-md"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.016 3.016 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.016 3.016 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.75 15.5l6.225-3.5L9.75 8.5v7z" />
                </svg>
              </div>
            </a>

            {/* INSTAGRAM */}
            <a
              href="https://instagram.com/upmoneybr"
              target="_blank"
              rel="noopener noreferrer"
              className="group"
            >
              <div className="w-14 h-14 bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 rounded-2xl p-0.5">
                <div className="w-full h-full bg-slate-900 rounded-2xl flex items-center justify-center hover:scale-110 transition-all">
                  <svg
                    className="w-8 h-8 text-white"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.81.25 2.24.42.56.22.96.49 1.38.9.41.41.67.82.9 1.38.17.43.37 1.07.42 2.24.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.81-.42 2.24a3.6 3.6 0 0 1-.9 1.38 3.6 3.6 0 0 1-1.38.9c-.43.17-1.07.37-2.24.42-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.81-.25-2.24-.42a3.6 3.6 0 0 1-1.38-.9 3.6 3.6 0 0 1-.9-1.38c-.17-.43-.37-1.07-.42-2.24C2.17 15.58 2.16 15.2 2.16 12s.01-3.58.07-4.85c.05-1.17.25-1.81.42-2.24.22-.56.49-.96.9-1.38.41-.41.82-.67 1.38-.9.43-.17 1.07-.37 2.24-.42C8.42 2.17 8.8 2.16 12 2.16Zm0 3.4c-3.16 0-3.53.01-4.77.07-.98.05-1.52.21-1.87.35-.47.18-.8.4-1.15.75-.35.35-.57.68-.75 1.15-.14.35-.3.89-.35 1.87-.06 1.24-.07 1.61-.07 4.77s.01 3.53.07 4.77c.05.98.21 1.52.35 1.87.18.47.4.8.75 1.15.35.35.68.57 1.15.75.35.14.89.3 1.87.35 1.24.06 1.61.07 4.77.07s3.53-.01 4.77-.07c.98-.05 1.52-.21 1.87-.35.47-.18.8-.4 1.15-1.15.35-.35.57-.68.75-1.15.14-.35.3-.89.35-1.87.06-1.24.07-1.61.07-4.77s-.01 3.53-.07 4.77c-.05-.98.21-1.52.35-1.87a2.62 2.62 0 0 0-.75-1.15c-.35-.35-.68-.57-1.15-.75-.35-.14-.89-.3-1.87-.35-1.24-.06-1.61-.07-4.77-.07Zm0 2.7a4.64 4.64 0 1 1 0 9.28 4.64 4.64 0 0 1 0-9.28Zm0 1.8a2.84 2.84 0 1 0 0 5.68 2.84 2.84 0 0 0 0-5.68Zm5.93-2.18a1.09 1.09 0 1 1 0 2.18 1.09 1.09 0 0 1 0-2.18Z" />
                  </svg>
                </div>
              </div>
            </a>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="relative bg-gradient-to-b from-white to-amber-50/30 pt-16 pb-16">
        <div className="container mx-auto px-4 text-center -mt-12 mb-10">
          <div className="inline-flex items-center gap-4 bg-red-600 text-white px-8 py-4 rounded-full text-xl sm:text-2xl font-black uppercase tracking-wider shadow-2xl shadow-red-600/50">
            <span className="relative flex h-4 w-4 sm:h-5 sm:w-5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-80"></span>
              <span className="relative inline-flex rounded-full h-full w-full bg-white"></span>
            </span>
            VAGAS LIMITADAS NA TURMA
          </div>
          <div className="mt-3 text-xs text-slate-500">
            *Vagas limitadas por agenda (acompanhamento 1:1).
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left">
              <h1 className="text-5xl lg:text-6xl font-black tracking-tight text-slate-900 leading-tight">
                Receba seu{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-600 to-orange-600">
                  primeiro dividendo
                </span>
                <br className="hidden lg:block" />
                com um plano claro em até{" "}
                <span className="text-amber-600">30 dias</span>
              </h1>

              <p className="mt-6 text-xl lg:text-2xl text-slate-700 font-medium">
                Programa educacional com acompanhamento individual até você sair
                com um roteiro executável — e controle tudo no{" "}
                <span className="font-black text-slate-900">UpControl</span>.
              </p>

              <div className="mt-5 inline-flex flex-wrap items-center justify-center lg:justify-start gap-3">
                <span className="inline-flex items-center gap-2 rounded-full bg-slate-900 text-white px-4 py-2 text-sm font-bold">
                  <Shield className="w-5 h-5" />
                  Garantia de satisfação (educacional)
                </span>
                <span className="inline-flex items-center gap-2 rounded-full bg-amber-100 text-amber-900 px-4 py-2 text-sm font-bold">
                  <Lightning className="w-5 h-5" />
                  3h 1:1 + WhatsApp 30 dias
                </span>
                <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 text-emerald-900 px-4 py-2 text-sm font-bold">
                  <Check className="w-5 h-5" />
                  App por 12 meses incluso
                </span>
              </div>

              <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <button
                  onClick={() => setIsTurmaOpen(true)}
                  className="group relative overflow-hidden bg-gradient-to-r from-amber-500 to-orange-600 px-10 py-5 rounded-2xl text-xl font-black text-white shadow-2xl hover:shadow-amber-500/50 hover:scale-[1.02] transition-all duration-300"
                >
                  <span className="absolute inset-0 bg-white/25 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                  Quero entrar na turma
                </button>

                <button
                  onClick={falarAgora}
                  className="flex items-center justify-center gap-3 bg-[#25D366] px-10 py-5 rounded-2xl text-xl font-black text-white shadow-2xl hover:shadow-green-500/50 hover:scale-[1.02] transition"
                >
                  <IconWhatsApp className="w-8 h-8" />
                  Falar agora no WhatsApp
                </button>
              </div>

              <div className="mt-6">
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="inline-flex items-center gap-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-8 py-4 rounded-2xl font-black text-lg shadow-xl hover:shadow-emerald-500/50 hover:scale-[1.02] transition-all duration-300"
                >
                  <svg
                    className="w-7 h-7"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                  </svg>
                  Avaliação gratuita • 15 minutos • sem compromisso
                </button>
              </div>

              <div className="mt-6 text-sm text-slate-500 leading-relaxed">
                <strong>Importante:</strong> o programa é{" "}
                <span className="font-bold">educacional</span>. Não é
                recomendação individual de investimento. Você aprende método,
                estratégia e execução — com clareza e responsabilidade.
              </div>
            </div>

            {/* CARD APP */}
            <div className="relative">
              <div className="bg-white rounded-3xl shadow-2xl p-8 border border-slate-200">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center text-white text-5xl font-black shadow-2xl">
                    U
                  </div>
                  <div>
                    <div className="text-2xl font-black text-slate-900">
                      UpControl
                    </div>
                    <div className="text-slate-600">
                      Controle total do seu patrimônio
                    </div>
                  </div>
                </div>

                <img
                  src="/dash_recortado.jpg"
                  alt="Dashboard UpControl"
                  className="w-full rounded-2xl border border-slate-200 shadow-inner"
                />

                <div className="mt-6 bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-center py-6 rounded-2xl shadow-lg">
                  <div className="text-4xl font-black">Organização</div>
                  <div className="text-lg opacity-90">
                    Você enxerga o mês inteiro em 1 tela
                  </div>
                </div>

                <div className="mt-5 grid sm:grid-cols-2 gap-3 text-sm">
                  <div className="rounded-2xl border border-slate-200 p-4">
                    <div className="font-black text-slate-900">
                      Despesas & Receitas
                    </div>
                    <div className="text-slate-600 mt-1">
                      Tabela mensal + resumo anual
                    </div>
                  </div>
                  <div className="rounded-2xl border border-slate-200 p-4">
                    <div className="font-black text-slate-900">Relatório PDF</div>
                    <div className="text-slate-600 mt-1">
                      Exporte quando quiser
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* /CARD APP */}
          </div>
        </div>
      </section>

      {/* O QUE VOCÊ VAI SAIR COM */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <h2 className="text-4xl font-black text-slate-900">
              O que você vai sair com em 30 dias
            </h2>
            <p className="mt-4 text-lg text-slate-700">
              Não é teoria solta. É um plano simples, executável e acompanhado —
              pra você ganhar clareza e consistência.
            </p>
          </div>

          <div className="mt-10 grid md:grid-cols-3 gap-6">
            {[
              {
                title: "Roteiro claro de execução",
                desc: "Você sabe o que fazer, em qual ordem, e como medir seu avanço.",
              },
              {
                title: "Base financeira organizada",
                desc: "Você controla despesas e receitas, e entende quanto pode investir com segurança.",
              },
              {
                title: "Acompanhamento e correção",
                desc: "Você não fica travado: tem 1:1 e WhatsApp para ajustar o caminho.",
              },
            ].map((c) => (
              <div
                key={c.title}
                className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm"
              >
                <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center mb-4 font-black">
                  U
                </div>
                <div className="text-xl font-black text-slate-900">
                  {c.title}
                </div>
                <div className="mt-2 text-slate-700 leading-relaxed">
                  {c.desc}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* COMO FUNCIONA */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <h2 className="text-4xl font-black text-slate-900">
              Como funciona (30 dias)
            </h2>
            <p className="mt-4 text-lg text-slate-700">
              Um processo leve, direto e prático — com acompanhamento para você
              não se perder.
            </p>
          </div>

          <div className="mt-10 grid lg:grid-cols-4 gap-6">
            {[
              {
                step: "Semana 1",
                title: "Organização e visão geral",
                desc: "Mapear sua realidade, metas e rotina. UpControl configurado.",
              },
              {
                step: "Semana 2",
                title: "Estratégia e fundamentos",
                desc: "Entender opções, riscos e montar uma rota coerente.",
              },
              {
                step: "Semana 3",
                title: "Execução guiada",
                desc: "Passo a passo para tirar do papel com consistência.",
              },
              {
                step: "Semana 4",
                title: "Ajustes e autonomia",
                desc: "Revisar, corrigir e deixar o processo rodando sozinho.",
              },
            ].map((s) => (
              <div
                key={s.step}
                className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm"
              >
                <div className="text-sm font-black text-amber-700 bg-amber-100 inline-flex px-3 py-1 rounded-full">
                  {s.step}
                </div>
                <div className="mt-4 text-xl font-black text-slate-900">
                  {s.title}
                </div>
                <div className="mt-2 text-slate-700 leading-relaxed">
                  {s.desc}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* OFERTA / PREÇOS */}
      <section className="py-16 bg-white" id="planos">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <h2 className="text-4xl font-black text-slate-900">
              Escolha o melhor caminho
            </h2>
            <p className="mt-4 text-lg text-slate-700">
              Se você quer velocidade e clareza, vá no programa completo. Se
              quer só o app, existe o plano essencial.
            </p>
          </div>

          <div className="mt-10 grid lg:grid-cols-2 gap-8 items-stretch">
            {/* PLANO PRINCIPAL */}
            <div className="relative rounded-3xl border border-slate-200 bg-white p-8 shadow-xl">
              <div className="absolute -top-4 left-8 bg-gradient-to-r from-amber-500 to-orange-600 text-white px-4 py-2 rounded-full text-sm font-black shadow-lg">
                Mais escolhido
              </div>

              <div className="flex items-start justify-between gap-6">
                <div>
                  <div className="text-2xl font-black text-slate-900">
                    {oferta.titulo}
                  </div>
                  <div className="mt-2 text-slate-600">{oferta.subtitulo}</div>
                </div>
                <div className="text-right">
                  <div className="text-4xl font-black text-slate-900">
                    {oferta.preco}
                  </div>
                  <div className="text-sm text-emerald-700 font-black mt-1">
                    {oferta.bonus}
                  </div>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                {oferta.oQueInclui.map((item) => (
                  <div key={item} className="flex gap-3">
                    <Check className="w-6 h-6 text-emerald-600 shrink-0" />
                    <div className="text-slate-800">{item}</div>
                  </div>
                ))}
              </div>

              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => setIsTurmaOpen(true)}
                  className="flex-1 bg-gradient-to-r from-amber-500 to-orange-600 text-white py-4 rounded-2xl font-black text-lg shadow-lg hover:shadow-amber-500/40 hover:scale-[1.01] transition"
                >
                  Entrar na turma (R$ 497)
                </button>
                <button
                  onClick={falarAgora}
                  className="flex-1 bg-slate-900 text-white py-4 rounded-2xl font-black text-lg shadow-lg hover:scale-[1.01] transition"
                >
                  Tirar dúvidas no WhatsApp
                </button>
              </div>

              <div className="mt-6 rounded-2xl bg-slate-50 border border-slate-200 p-5">
                <div className="flex items-center gap-3 text-slate-900 font-black">
                  <Shield className="w-6 h-6 text-slate-900" />
                  Garantia de satisfação
                </div>
                <div className="mt-2 text-slate-700 text-sm leading-relaxed">
                  Se você entrar, seguir o processo e sentir que o programa não
                  te entregou clareza e estrutura educacional, você pode
                  solicitar avaliação de reembolso conforme as regras do
                  checkout/plataforma.
                </div>
              </div>

              <div className="mt-4 text-xs text-slate-500 leading-relaxed">
                *Conteúdo educacional. Não é recomendação individual de
                investimento. Resultados variam conforme execução e contexto.
              </div>
            </div>

            {/* APP ONLY */}
            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
              <div className="text-2xl font-black text-slate-900">
                {produtoAppOnly.titulo}
              </div>
              <div className="mt-2 text-slate-600">{produtoAppOnly.detalhe}</div>

              <div className="mt-6 flex items-end justify-between">
                <div>
                  <div className="text-4xl font-black text-slate-900">
                    {produtoAppOnly.preco}
                  </div>
                  <div className="text-sm text-slate-500 font-medium">por ano</div>
                </div>
                <div className="text-sm font-black text-slate-900 bg-slate-100 px-4 py-2 rounded-full">
                  entrada fácil
                </div>
              </div>

              <div className="mt-6 space-y-3">
                {produtoAppOnly.inclui.map((item) => (
                  <div key={item} className="flex gap-3">
                    <Check className="w-6 h-6 text-emerald-600 shrink-0" />
                    <div className="text-slate-800">{item}</div>
                  </div>
                ))}
              </div>

              <div className="mt-6 text-sm text-slate-600">
                {produtoAppOnly.observacao}
              </div>

              <div className="mt-8">
                <button
                  onClick={irParaCompra}
                  className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-lg shadow-lg hover:scale-[1.01] transition"
                >
                  Quero só o app (R$ 199/ano)
                </button>
              </div>

              <div className="mt-4 text-xs text-slate-500 leading-relaxed">
                *Esse plano é ideal para quem quer organizar finanças com
                autonomia. Se você quer um caminho guiado para o primeiro
                dividendo, escolha o programa completo.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* DEPOIMENTOS */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <h2 className="text-4xl font-black text-slate-900">
              O que as pessoas costumam sentir
            </h2>
            <p className="mt-4 text-lg text-slate-700">
              Você pode trocar esse bloco por depoimentos reais conforme for
              coletando.
            </p>
          </div>

          <div className="mt-10 grid md:grid-cols-3 gap-6">
            {[
              {
                title: "Clareza",
                text: "“Agora eu sei exatamente o que fazer e como medir se estou no caminho certo.”",
              },
              {
                title: "Consistência",
                text: "“Antes eu começava e parava. Com o processo, ficou leve e contínuo.”",
              },
              {
                title: "Organização",
                text: "“Com o UpControl eu finalmente enxerguei onde eu estava vazando dinheiro.”",
              },
            ].map((t) => (
              <div
                key={t.title}
                className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm"
              >
                <div className="text-lg font-black text-slate-900">{t.title}</div>
                <div className="mt-3 text-slate-700 leading-relaxed">
                  {t.text}
                </div>
                <div className="mt-4 text-sm text-slate-500">— aluno(a) UpMoney</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <h2 className="text-4xl font-black text-slate-900">
              Perguntas frequentes
            </h2>
            <p className="mt-4 text-lg text-slate-700">
              Sem enrolação — respostas diretas.
            </p>
          </div>

          <div className="mt-10 grid lg:grid-cols-2 gap-6">
            <FAQItem
              q="Preciso ter muito dinheiro para começar?"
              a="Não. O foco é montar um processo realista com a sua realidade. Você aprende a organizar finanças, definir metas e executar um plano coerente."
            />
            <FAQItem
              q="Isso é recomendação de investimento?"
              a="Não. É um programa educacional. Você aprende fundamentos, método e execução. Decisões finais sempre são suas."
            />
            <FAQItem
              q="Como funciona o acompanhamento 1:1?"
              a="Você terá 3 horas de encontros ao vivo (formato combinado), além de suporte no WhatsApp por 30 dias para tirar dúvidas e destravar execução."
            />
            <FAQItem
              q="O app (UpControl) fica comigo por quanto tempo?"
              a="No programa completo: 12 meses incluídos. No plano somente app: 12 meses a partir da contratação."
            />
            <FAQItem
              q="Vou ver apenas meus dados dentro do app?"
              a="Sim — cada usuário acessa com login e enxerga apenas os próprios dados (desde que as regras de segurança/Policies do banco estejam ativas e corretas)."
            />
            <FAQItem
              q="Posso comprar mais horas depois?"
              a="Sim. Após o programa você pode contratar horas extras de acompanhamento, se quiser acelerar ou revisar estratégias."
            />
          </div>

          <div className="mt-10 flex flex-col sm:flex-row gap-4">
            <button
              onClick={() => setIsTurmaOpen(true)}
              className="flex-1 bg-gradient-to-r from-amber-500 to-orange-600 text-white py-4 rounded-2xl font-black text-lg shadow-lg hover:shadow-amber-500/40 hover:scale-[1.01] transition"
            >
              Entrar agora
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex-1 bg-slate-900 text-white py-4 rounded-2xl font-black text-lg shadow-lg hover:scale-[1.01] transition"
            >
              Fazer avaliação gratuita (15 min)
            </button>
          </div>

          <div className="mt-6 text-xs text-slate-500 leading-relaxed">
            Aviso legal: UpMoney/UpControl oferecem conteúdo educacional e
            ferramentas de organização financeira. Não são consultoria, não
            garantem retorno financeiro e não fazem recomendações
            individualizadas.
          </div>
        </div>
      </section>

      {/* MODAL - AVALIAÇÃO GRATUITA */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-black text-slate-900">
                Avaliação Gratuita (15 min)
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-3xl text-slate-400 hover:text-slate-600"
                aria-label="Fechar"
              >
                ×
              </button>
            </div>

            <form onSubmit={enviarWhats} className="space-y-5">
              <div className="space-y-1">
                <label className="text-xs font-black text-slate-700">Nome</label>
                <input
                  type="text"
                  name="nome"
                  value={form.nome}
                  onChange={handleChange}
                  placeholder="Seu nome completo"
                  required
                  className="w-full px-5 py-4 border border-slate-300 rounded-xl focus:ring-4 focus:ring-amber-300 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-black text-slate-700">E-mail</label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="seu@email.com"
                  required
                  className="w-full px-5 py-4 border border-slate-300 rounded-xl focus:ring-4 focus:ring-amber-300 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-black text-slate-700">WhatsApp</label>
                <input
                  type="tel"
                  name="telefone"
                  value={form.telefone}
                  onChange={handleChange}
                  placeholder="(11) 98765-4321"
                  required
                  className="w-full px-5 py-4 border border-slate-300 rounded-xl focus:ring-4 focus:ring-amber-300 outline-none"
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-4 border border-slate-300 rounded-xl font-black hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-4 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl font-black hover:scale-[1.02] transition"
                >
                  Enviar e falar no WhatsApp
                </button>
              </div>

              <div className="text-xs text-slate-500 leading-relaxed">
                Ao enviar, você será redirecionado para o WhatsApp com uma
                mensagem pré-formatada.
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL - QUERO ENTRAR NA TURMA (✅ melhorado com labels) */}
      {isTurmaOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-black text-slate-900">
                Quero entrar na turma
              </h2>
              <button
                onClick={() => {
                  setIsTurmaOpen(false);
                  setLeadOk(false);
                }}
                className="text-3xl text-slate-400 hover:text-slate-600 leading-none"
                aria-label="Fechar"
              >
                ×
              </button>
            </div>

            <p className="text-sm text-slate-600 mb-6">
              Preencha seus dados e nós entraremos em contato por WhatsApp.
            </p>

            {leadOk ? (
              <div className="rounded-2xl border border-emerald-500/40 bg-emerald-50 p-5">
                <div className="text-emerald-900 font-black text-lg">
                  Enviado com sucesso ✅
                </div>
                <div className="mt-2 text-emerald-800 text-sm leading-relaxed">
                  Aguarde — nosso time irá entrar em contato com você.
                </div>
              </div>
            ) : (
              <form onSubmit={enviarTurma} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-black text-slate-700">
                      Nome
                    </label>
                    <input
                      type="text"
                      name="nome"
                      value={lead.nome}
                      onChange={handleLeadChange}
                      placeholder="Ex: João"
                      required
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-4 focus:ring-amber-300 outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-black text-slate-700">
                      Sobrenome
                    </label>
                    <input
                      type="text"
                      name="sobrenome"
                      value={lead.sobrenome}
                      onChange={handleLeadChange}
                      placeholder="Ex: Silva"
                      required
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-4 focus:ring-amber-300 outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-700">
                    E-mail
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={lead.email}
                    onChange={handleLeadChange}
                    placeholder="ex: joao@email.com"
                    required
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-4 focus:ring-amber-300 outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-700">
                    WhatsApp
                  </label>
                  <input
                    type="tel"
                    name="telefone"
                    value={lead.telefone}
                    onChange={handleLeadChange}
                    placeholder="(DDD) 99999-9999"
                    required
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-4 focus:ring-amber-300 outline-none"
                  />
                  <div className="text-[11px] text-slate-500">
                    Usaremos este número apenas para falar com você sobre a
                    turma.
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsTurmaOpen(false)}
                    className="flex-1 py-3 rounded-xl font-black bg-slate-100 text-slate-900 border border-slate-300 hover:bg-slate-200 active:scale-[0.99] transition"
                  >
                    Voltar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl font-black hover:scale-[1.02] transition"
                  >
                    Enviar
                  </button>
                </div>

                <div className="text-xs text-slate-500 leading-relaxed">
                  Ao enviar, abriremos WhatsApp e e-mail com uma mensagem pronta
                  para você.
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="bg-slate-900 text-white/60 py-12 mt-10">
        <div className="max-w-7xl mx-auto px-6 text-center text-sm space-y-2">
          <div className="text-white font-black">
            UpMoney © 2025 — O seu primeiro dividendo começa com organização e
            método.
          </div>
          <div>
            Conteúdo educacional. Não constitui recomendação de investimento.
            Resultados variam conforme execução.
          </div>
        </div>
      </footer>
    </div>
  );
}
