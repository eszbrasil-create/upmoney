// src/pages/CursoConfiguracaoMental.jsx
import React from "react";

export default function CursoConfiguracaoMental({ onNavigate = () => {} }) {
  return (
    <div className="p-6 text-white">
      <h1 className="text-2xl font-bold">Configuracao Mental</h1>
      <p className="text-slate-300 mt-2">Pagina em construcao.</p>

      <button
        onClick={() => onNavigate("cursos-menu")}
        className="mt-4 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-white/10"
      >
        Voltar ao menu
      </button>
    </div>
  );
}
