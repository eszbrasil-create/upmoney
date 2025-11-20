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
        {/* Login → redireciona para a página principal (Meu Patrimônio) */}
        <button
          onClick={() => {
            window.location.href = "/"; // abre a homepage (Landing.jsx)
          }}
          className="flex flex-col items-center gap-1 hover:text-sky-400 transition"
        >
          <UserCircle size={36} strokeWidth={2} />
          <span>Login</span>
        </button>

        {/* Editar Ativos */}
        <button
          onClick={onEditAtivos}
          className="flex flex-col items-center gap-1 hover:text-purple-400 transition"
        >
          <Settings size={36} strokeWidth={2} />
          <span>Editar Ativos</span>
        </button>

        {/* Zerar Tudo */}
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
          className="flex flex-col items-center gap-1 hover:text-yellow-400 transition"
        >
          <Home size={36} strokeWidth={2} />
          <span>Dash</span>
        </button>

        {/* Cursos */}
        <button
          onClick={() => onNavigate("cursos-dashboard")}
          className="flex flex-col items-center gap-1 hover:text-emerald-400 transition"
        >
          <GraduationCap size={36} strokeWidth={2} />
          <span>Cursos</span>
        </button>

        {/* Carteira Cash */}
        <button
          onClick={() => onNavigate("carteira")}
          className="flex flex-col items-center gap-1 hover:text-orange-500 transition"
        >
          <DollarSign size={36} strokeWidth={2} />
          <span>Carteira Cash</span>
        </button>

        {/* Despesas */}
        <button
          onClick={() => onNavigate("despesas")}
          className="flex flex-col items-center gap-1 hover:text-red-400 transition"
        >
          <Wallet size={36} strokeWidth={2} />
          <span>Despesas</span>
        </button>

        {/* Relatórios */}
        <button
          onClick={() => onNavigate("relatorios")}
          className="flex flex-col items-center gap-1 hover:text-pink-400 transition"
        >
          <BarChart3 size={36} strokeWidth={2} />
          <span>Relatórios</span>
        </button>
      </nav>

      <div className="text-center text-xs text-slate-500 mt-3">v0.1</div>
    </aside>
  );
}