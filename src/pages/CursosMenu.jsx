import React from "react";
import { ArrowRight, Sparkles, PiggyBank } from "lucide-react";

function CourseCard({
  title,
  subtitle,
  bullets = [],
  badge,
  imageUrl,
  icon,
  onClick,
  imagePosition = "50% 50%", // ✅ controla o foco do corte (object-position)
}) {
  return (
    <button
      onClick={onClick}
      className="group w-full text-left rounded-2xl overflow-hidden border border-white/10 bg-slate-900/40 hover:bg-slate-900/60 transition shadow-lg"
    >
      {/* IMAGEM / CAPA */}
      <div className="relative h-48 w-full overflow-hidden">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={title}
            className="h-full w-full object-cover opacity-90 group-hover:opacity-100 transition"
            style={{ objectPosition: imagePosition }} // ✅ aqui ajusta sem “estragar” o layout
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-slate-700 via-slate-900 to-indigo-900" />
        )}

        {/* OVERLAY */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/30 to-transparent" />

        {/* BADGE */}
        {badge && (
          <div className="absolute top-4 left-4 inline-flex items-center gap-2 rounded-full bg-emerald-500/15 border border-emerald-400/30 px-3 py-1 text-xs text-emerald-100">
            <Sparkles size={14} />
            {badge}
          </div>
        )}

        {/* HEADER DO CARD */}
        <div className="absolute bottom-4 left-4 right-4 flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-slate-950/70 border border-white/10 flex items-center justify-center">
            {icon}
          </div>
          <div className="text-slate-100">
            <div className="text-lg font-bold leading-tight">{title}</div>
            <div className="text-xs text-slate-300 mt-0.5">{subtitle}</div>
          </div>
        </div>
      </div>

      {/* CONTEÚDO */}
      <div className="p-5">
        <div className="grid gap-2">
          {bullets.map((item, index) => (
            <div key={index} className="text-sm text-slate-200 flex gap-2">
              <span className="mt-[6px] h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <span>{item}</span>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-6 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            Clique para ver detalhes do curso
          </span>

          <span className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition">
            Ver curso <ArrowRight size={18} />
          </span>
        </div>
      </div>
    </button>
  );
}

export default function CursosMenu({ onNavigate }) {
  return (
    <div className="pt-3 pr-6 pl-0">
      <div className="rounded-2xl bg-slate-800/70 border border-white/10 shadow-lg w-[1200px] max-w-full p-6">
        {/* HEADER */}
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold text-slate-100">
              Menu de Cursos
            </h1>
            <p className="text-slate-300 mt-2 max-w-xl">
              Aprenda com um método prático, organizado e focado em resultado real.
            </p>
          </div>

          {/* CTA AUXILIAR */}
          <a
            href="https://wa.me/"
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2 rounded-lg border border-white/10 bg-slate-900/40 hover:bg-slate-900/60 text-slate-100 text-sm transition"
          >
            Falar no WhatsApp
          </a>
        </div>

        {/* GRID DE CURSOS */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <CourseCard
            title="Meu Primeiro Dividendo"
            subtitle="Do zero à renda passiva"
            badge="Curso principal"
            imageUrl="/img/curso-dividendo.jpg"
            imagePosition="50% 45%"   // ✅ leve ajuste (opcional)
            icon={<PiggyBank size={22} className="text-emerald-300" />}
            bullets={[
              "Entenda renda fixa e variável sem confusão",
              "Monte sua estratégia com segurança",
              "Acompanhe tudo dentro do UpControl",
            ]}
            onClick={() => onNavigate("cursos-dashboard")}
          />

          <CourseCard
            title="Configuração Mental"
            subtitle="Disciplina, foco e execução"
            badge="Novo"
            imageUrl="/img/curso-mente.jpg"
            imagePosition="70% 40%"   // ✅ move o foco pra direita e alinha com o outro
            icon={<Sparkles size={22} className="text-emerald-300" />}
            bullets={[
              "Elimine procrastinação e bloqueios mentais",
              "Construa disciplina com ações simples",
            ]}
            onClick={() => onNavigate("curso-configuracao-mental")}
          />
        </div>

        {/* FOOTER */}
        <div className="mt-6 text-xs text-slate-500">
          As imagens devem ficar em <span className="text-slate-200">/public/img</span>.
          Exemplo: <span className="text-slate-200">curso-dividendo.jpg</span>
        </div>
      </div>
    </div>
  );
}
