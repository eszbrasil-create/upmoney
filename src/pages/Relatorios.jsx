// src/pages/Relatorios.jsx
// Relatórios 2.0 — Tela BLOQUEADA (em construção)
// ✅ Retorno ao Dashboard FUNCIONANDO via <a href>

import React from "react";
import {
  TrendingUp,
  BookOpen,
  Coins,
  PieChart,
  Layers,
  Construction,
} from "lucide-react";

export default function Relatorios() {
  return (
    <div className="relative min-h-screen text-slate-100 overflow-hidden">

      {/* ================= OVERLAY BLOQUEADOR ================= */}
      <div className="fixed inset-0 z-[9999] bg-slate-950/85 backdrop-blur-sm flex items-center justify-center">
        <div className="max-w-md mx-4 rounded-2xl border border-amber-400/30 bg-slate-900/90 p-6 shadow-2xl text-center">

          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-amber-400/15 p-4 border border-amber-400/30">
              <Construction className="text-amber-300" size={32} />
            </div>
          </div>

          <h2 className="text-lg font-semibold text-amber-200">
            Relatórios em construção
          </h2>

          <p className="mt-2 text-sm text-slate-300 leading-relaxed">
            Estamos trabalhando para transformar esta área em um painel completo
            de análises financeiras, com gráficos claros e insights úteis.
          </p>

          <p className="mt-3 text-xs text-slate-400">
            Por enquanto, esta seção está disponível apenas para visualização.
          </p>

          {/* ✅ BOTÃO REAL, IGUAL AO MENU */}
          <a
            href="#/dash"
            className="
              mt-5 inline-flex items-center justify-center
              rounded-xl px-4 py-2
              bg-emerald-500 hover:bg-emerald-400
              text-slate-950 font-semibold text-sm
              transition shadow
            "
          >
            Voltar para o Dashboard
          </a>

        </div>
      </div>

      {/* ================= CONTEÚDO VISUAL (BLOQUEADO) ================= */}
      <div className="pt-4 pr-6 pl-0">

        <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 p-6 shadow-lg">
          <h1 className="text-2xl font-bold tracking-tight">
            Sua Jornada Financeira
          </h1>

          <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-4">
            <HeroCard label="Patrimônio Atual" value="R$ 0,00" icon={TrendingUp} />
            <HeroCard label="Evolução Total" value="+0%" icon={PieChart} />
            <HeroCard label="Nível da Jornada" value="Iniciante" icon={Layers} />
            <HeroCard label="Meses Consistentes" value="0" icon={BookOpen} />
          </div>
        </section>
      </div>
    </div>
  );
}

/* ================= COMPONENTES BASE ================= */

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
