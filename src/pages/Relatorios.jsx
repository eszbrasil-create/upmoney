// src/pages/Relatorios.jsx
// Relatórios 2.0 — Protótipo inicial lúdico, visual e moderno

import React from "react";
import { TrendingUp, BookOpen, Coins, PieChart, Layers } from "lucide-react";

export default function Relatorios() {
  return (
    <div className="pt-4 pr-6 pl-0 text-slate-100">

      {/* ================= HERO PRINCIPAL ================= */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 p-6 shadow-lg">
        <div className="absolute inset-0 opacity-20 bg-[url('/hero-pattern.png')] bg-cover" />
        <h1 className="relative text-2xl font-bold tracking-tight">
          Sua Jornada Financeira
        </h1>
        <p className="relative mt-1 text-sm text-white/90">
          Um resumo claro, bonito e motivador da sua evolução.
        </p>

        <div className="relative mt-5 grid grid-cols-2 md:grid-cols-4 gap-4">
          <HeroCard label="Patrimônio Atual" value="R$ 0,00" icon={TrendingUp} />
          <HeroCard label="Evolução Total" value="+0%" icon={PieChart} />
          <HeroCard label="Nível da Jornada" value="Iniciante" icon={Layers} />
          <HeroCard label="Meses Consistentes" value="0" icon={BookOpen} />
        </div>
      </section>

      {/* ================= BLOCO: 5 SEÇÕES ================= */}
      <div className="mt-6 space-y-6">

        {/* DESPESAS & RECEITAS */}
        <SectionCard title="Despesas & Receitas do Mês" icon={Coins}>
          <p className="text-slate-400 text-sm">
            Em breve, gráficos e análises reais baseados nos seus registros.
          </p>
          <PlaceholderGraph />
        </SectionCard>

        {/* CURSOS & APRENDIZADO */}
        <SectionCard title="Seu progresso nos Cursos" icon={BookOpen}>
          <p className="text-slate-400 text-sm">
            Acompanhe seu avanço no aprendizado e veja o impacto no seu patrimônio.
          </p>
          <PlaceholderBar />
        </SectionCard>

        {/* DIVIDENDOS */}
        <SectionCard title="Dividendos Recebidos" icon={Coins}>
          <p className="text-slate-400 text-sm">
            Aqui você vai ver seus dividendos mensais e totais do ano.
          </p>
          <PlaceholderGraph />
        </SectionCard>

        {/* CARTEIRA CASH */}
        <SectionCard title="Distribuição da Carteira" icon={PieChart}>
          <p className="text-slate-400 text-sm">
            Visual moderno da sua carteira — Ações, FIIs, Cripto, Caixa e mais.
          </p>
          <PlaceholderPie />
        </SectionCard>

      </div>
    </div>
  );
}

/* ------------------------- COMPONENTES BASE ------------------------- */

function HeroCard({ label, value, icon: Icon }) {
  return (
    <div className="rounded-xl bg-white/15 backdrop-blur-sm p-4 shadow flex flex-col items-start">
      <div className="bg-white/20 p-2 rounded-lg mb-2">
        <Icon size={22} />
      </div>
      <span className="text-xs text-white/80">{label}</span>
      <span className="text-lg font-bold">{value}</span>
    </div>
  );
}

function SectionCard({ title, icon: Icon, children }) {
  return (
    <section className="rounded-xl bg-slate-900/60 border border-slate-700/50 p-5 shadow-md">
      <div className="flex items-center gap-2 mb-3">
        <Icon size={18} className="text-emerald-400" />
        <h2 className="text-sm font-semibold uppercase tracking-wide text-emerald-300">
          {title}
        </h2>
      </div>
      {children}
    </section>
  );
}

/* ----------- PLACEHOLDERS LÚDICOS (trocamos depois) ----------- */

function PlaceholderGraph() {
  return (
    <div className="mt-3 h-32 rounded-xl bg-slate-800/60 border border-slate-700/40 flex items-center justify-center text-xs text-slate-500">
      Gráfico virá aqui
    </div>
  );
}

function PlaceholderBar() {
  return (
    <div className="mt-3 h-24 rounded-xl bg-slate-800/60 border border-slate-700/40 flex items-center justify-center text-xs text-slate-500">
      Barra de progresso virá aqui
    </div>
  );
}

function PlaceholderPie() {
  return (
    <div className="mt-3 h-40 rounded-xl bg-slate-800/60 border border-slate-700/40 flex items-center justify-center text-xs text-slate-500">
      Gráfico de pizza virá aqui
    </div>
  );
}
