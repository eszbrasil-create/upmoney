// src/modules/Sidebar.jsx
import {
  Home,
  GraduationCap,
  DollarSign,
  Wallet,
  BarChart3,
  Settings,
  RotateCcw,
  UserCircle,
} from "lucide-react";

export default function Sidebar({
  onEditAtivos = () => {},
  onResetAll = () => {},
  onNavigate = () => {},
  currentView = "",
}) {
  return (
    <aside className="fixed left-0 top-0 w-48 h-screen bg-slate-900 text-white flex flex-col justify-between p-4 border-r border-slate-700 select-none">
      {/* Logo */}
      <div className="mt-4 text-center text-2xl font-semibold tracking-wide leading-none">
        upControl
      </div>

      <div className="border-t border-white/30 mb-3" />

      {/* Menu Superior */}
      <nav className="flex flex-col gap-3 text-base font-medium tracking-wide">
        <button
          onClick={() => {
            window.location.href = "/";
          }}
          className="flex flex-col items-center gap-1 hover:text-sky-400 transition"
        >
          <UserCircle size={36} strokeWidth={2} />
          <span>Sair</span>
        </button>

        <button
          onClick={onEditAtivos}
          className="flex flex-col items-center gap-1 hover:text-purple-400 transition"
        >
          <Settings size={36} strokeWidth={2} />
          <span>Editar Ativos</span>
        </button>

        <button
          onClick={onResetAll}
          className="flex flex-col items-center gap-1 hover:text-red-400 transition"
        >
          <RotateCcw size={36} strokeWidth={2} />
          <span>Zerar Tudo</span>
        </button>
      </nav>

      <div className="border-t border-white/20 my-3" />

      {/* Menu Inferior */}
      <nav className="flex flex-col gap-3 text-base font-medium tracking-wide">

        {/* Dash */}
        <button
          onClick={() => onNavigate("dashboard")}
          className={`flex flex-col items-center gap-1 transition hover:text-yellow-400 ${
            currentView === "dashboard" ? "text-yellow-400" : "text-slate-100"
          }`}
        >
          <Home size={36} strokeWidth={2} />
          <span>Dash</span>
        </button>

        {/* Cursos */}
        <button
          onClick={() => onNavigate("cursos-dashboard")}
          className={`flex flex-col items-center gap-1 transition hover:text-emerald-400 ${
            currentView === "cursos-dashboard"
              ? "text-emerald-400"
              : "text-slate-100"
          }`}
        >
          <GraduationCap size={36} strokeWidth={2} />
          <span>Cursos</span>
        </button>

        {/* Carteira */}
        <button
          onClick={() => onNavigate("carteira")}
          className={`flex flex-col items-center gap-1 transition hover:text-orange-500 ${
            currentView === "carteira"
              ? "text-orange-500"
              : "text-slate-100"
          }`}
        >
          <DollarSign size={36} strokeWidth={2} />
          <span>Carteira Cash</span>
        </button>

        {/* Despesas */}
        <button
          onClick={() => onNavigate("despesas")}
          className={`flex flex-col items-center gap-1 transition hover:text-red-400 ${
            currentView === "despesas"
              ? "text-red-400"
              : "text-slate-100"
          }`}
        >
          <Wallet size={36} strokeWidth={2} />
          <span>Despesas</span>
        </button>

        {/* Relatórios */}
        <button
          onClick={() => onNavigate("relatorios")}
          className={`flex flex-col items-center gap-1 transition hover:text-pink-400 ${
            currentView === "relatorios"
              ? "text-pink-400"
              : "text-slate-100"
          }`}
        >
          <BarChart3 size={36} strokeWidth={2} />
          <span>Relatórios</span>
        </button>
      </nav>

      <div className="text-center text-xs text-slate-500 mt-3">v0.1</div>
    </aside>
  );
}
