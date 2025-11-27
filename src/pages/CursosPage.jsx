<div
  key={m.id}
  className={`relative group rounded-xl border p-4 flex items-start gap-3 transition-colors duration-300 ${
    isDone
      ? "border-emerald-500/60 bg-emerald-900/30"
      : "border-white/10 bg-slate-900/40"
  }`}
>
  {/* 🟢 Badge "Concluído" sem alterar o tamanho do card */}
  {isDone && (
    <span className="absolute top-2 right-2 inline-flex items-center gap-1 rounded-full bg-emerald-600/20 border border-emerald-500/60 px-2 py-1 text-[11px] font-medium text-emerald-100">
      <CheckCircle2 size={14} />
      Concluído
    </span>
  )}

  {/* Porquinho animado */}
  <div
    className="shrink-0 transition-transform duration-300 group-hover:scale-105"
    style={{
      animation: isDone ? "pig-pulse 1200ms ease-in-out infinite" : "none",
      transformOrigin: "center",
    }}
  >
    <PiggyBank size={100} color={isDone ? GREEN : ORANGE} />
  </div>

  <div className="flex-1">
    <h3 className="text-slate-200 font-semibold">
      {m.id}. {m.titulo}
    </h3>

    <div className="mt-3 flex flex-wrap items-center gap-3">
      {/* Ver PDF */}
      <a
        href={m.pdf}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-slate-800 px-3 py-2 text-xs text-slate-100 hover:bg-slate-700"
      >
        Ver PDF
      </a>

      {/* Baixar PDF */}
      <a
        href={m.pdf}
        download
        className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-slate-800 px-3 py-2 text-xs text-slate-100 hover:bg-slate-700"
      >
        <FileDown size={20} />
        Baixar PDF
      </a>

      {/* Botão concluir */}
      <button
        onClick={() => toggleConcluido(m.id)}
        className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs border ${
          isDone
            ? "bg-emerald-600 text-white border-emerald-500 hover:bg-emerald-500"
            : "bg-slate-800 text-slate-100 border-white/10 hover:bg-slate-700"
        }`}
      >
        {isDone ? (
          <>
            <CheckCircle2 size={20} /> Concluído
          </>
        ) : (
          "Marcar como concluído"
        )}
      </button>
    </div>
  </div>
</div>
