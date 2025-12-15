// src/pages/CursosMenu.jsx
import React from "react";

export default function CursosMenu({ onNavigate = () => {} }) {
  return (
    <div className="p-6 text-white">
      <h1 className="text-2xl font-bold">Menu de Cursos</h1>

      <div className="mt-4 flex gap-3 flex-wrap">
        <button
          onClick={() => onNavigate("cursos-dashboard")}
          className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-white/10"
        >
          Meu Primeiro Dividendo
        </button>

        <button
          onClick={() => onNavigate("curso-configuracao-mental")}
          className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-white/10"
        >
          Configuracao Mental
        </button>
      </div>
    </div>
  );
}
