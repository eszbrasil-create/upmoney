// src/components/modals/EditAtivosModal.jsx
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

export default function EditAtivosModal({
  open,
  onClose,
  onSave,
  ativosExistentes = [
    "Ações",
    "Renda Fixa",
    "Cripto",
    "FIIs",
    "Caixa",
    "Banco",
    "Viagem",
    "Cofre",
  ],
  mesAnoInicial,
  linhasIniciais = [],
}) {
  const backdropRef = useRef(null);

  // ----- MÊS / ANO -----
  const mesesLista = [
    "Jan",
    "Fev",
    "Mar",
    "Abr",
    "Mai",
    "Jun",
    "Jul",
    "Ago",
    "Set",
    "Out",
    "Nov",
    "Dez",
  ];
  const hoje = new Date();
  const mesBase = hoje.getMonth();
  const anoBase = hoje.getFullYear();

  const opcoesMesAno = useMemo(() => {
    const opts = [];
    const inicioAno = anoBase - 3;
    const fimAno = anoBase + 10;
    for (let a = inicioAno; a <= fimAno; a++) {
      for (let m = 0; m < 12; m++) {
        const v = `${mesesLista[m]}/${a}`;
        opts.push({ label: v, value: v });
      }
    }
    return opts;
  }, [anoBase, mesesLista]);

  const padraoMesAno = useMemo(() => {
    if (mesAnoInicial && opcoesMesAno.some((o) => o.value === mesAnoInicial)) {
      return mesAnoInicial;
    }
    return `${mesesLista[mesBase]}/${anoBase}`;
  }, [mesAnoInicial, mesBase, anoBase, opcoesMesAno, mesesLista]);

  const [mesAno, setMesAno] = useState(padraoMesAno);

  // ----- TABELA (LINHAS) -----
  const [linhas, setLinhas] = useState([
    { id: crypto.randomUUID(), nome: "", valor: 0 },
  ]);

  useEffect(() => {
    if (!open) return;
    setMesAno(padraoMesAno);

    if (Array.isArray(linhasIniciais) && linhasIniciais.length) {
      setLinhas(
        linhasIniciais.map((l) => ({
          id: crypto.randomUUID(),
          nome: String(l?.nome ?? ""),
          valor: Number.isFinite(Number(l?.valor)) ? Number(l.valor) : 0,
        }))
      );
    } else {
      setLinhas([{ id: crypto.randomUUID(), nome: "", valor: 0 }]);
    }
  }, [open, padraoMesAno, linhasIniciais]);

  const total = useMemo(
    () => linhas.reduce((acc, l) => acc + (Number(l.valor) || 0), 0),
    [linhas]
  );

  const adicionarLinha = () => {
    setLinhas((prev) => [
      ...prev,
      { id: crypto.randomUUID(), nome: "", valor: 0 },
    ]);
  };

  const removerLinha = (id) => {
    setLinhas((prev) => prev.filter((l) => l.id !== id));
  };

  const atualizarCampo = (id, campo, valor) => {
    setLinhas((prev) =>
      prev.map((l) => (l.id === id ? { ...l, [campo]: valor } : l))
    );
  };

  // ----- AUTOCOMPLETE -----
  const [focoId, setFocoId] = useState(null);
  const [query, setQuery] = useState("");

  const sugestoes = useMemo(() => {
    if (!query) return [];
    const q = query.toLowerCase();
    const uniq = Array.from(
      new Map(
        ativosExistentes.map((n) => [String(n).toLowerCase(), String(n)])
      ).values()
    );
    return uniq.filter((n) => n.toLowerCase().includes(q)).slice(0, 8);
  }, [query, ativosExistentes]);

  const selecionarSugestao = (id, nome) => {
    atualizarCampo(id, "nome", nome);
    setFocoId(null);
    setQuery("");
  };

  // ----- SALVAR -----
  const salvar = useCallback(() => {
    const payload = {
      mesAno,
      itens: linhas
        .filter((l) => String(l.nome).trim() !== "")
        .map((l) => ({
          nome: l.nome.trim(),
          valor: Number(l.valor) || 0,
        })),
      total,
    };
    onSave?.(payload);
    onClose?.();
  }, [mesAno, linhas, total, onSave, onClose]);

  const onBackdropClick = (e) => {
    if (e.target === backdropRef.current) onClose?.();
  };

  // ----- ATALHOS DE TECLADO (Esc para fechar, Ctrl/Cmd+Enter para salvar) -----
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose?.();
      }

      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        salvar();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, salvar, onClose]);

  if (!open) return null;

  return (
    <div
      ref={backdropRef}
      onMouseDown={onBackdropClick}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div
        className="w-[880px] max-w-[95vw] rounded-2xl bg-slate-950/95 border border-white/10 shadow-2xl shadow-emerald-500/10"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Cabeçalho */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="flex flex-col">
              <span className="text-slate-100 text-lg font-semibold">
                Editar Ativos
              </span>
              <span className="text-xs text-slate-400">
                Mês selecionado: {mesAno}
              </span>
            </div>

            <select
              value={mesAno}
              onChange={(e) => setMesAno(e.target.value)}
              className="bg-slate-900 text-slate-100 text-sm rounded-lg px-3 py-2 border border-white/10 outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {opcoesMesAno.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-100 text-xl leading-none"
            aria-label="Fechar"
            title="Fechar"
          >
            ×
          </button>
        </div>

        {/* Conteúdo */}
        <div className="px-6 pt-4 pb-5">
          {/* Cabeçalho das colunas (no estilo Despesas, sem tabela) */}
          <div className="grid grid-cols-[minmax(0,2.2fr)_minmax(0,1fr)_auto] gap-3 text-[11px] font-medium uppercase tracking-wide text-slate-400 mb-2 px-1">
            <span>Ativo</span>
            <span className="text-right">Valor</span>
            <span className="text-center">Ações</span>
          </div>

          {/* Linhas */}
          <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
            {linhas.map((l) => (
              <div
                key={l.id}
                className="grid grid-cols-[minmax(0,2.2fr)_minmax(0,1fr)_auto] gap-3 items-center rounded-xl bg-slate-900/70 hover:bg-slate-900 border border-white/10 px-4 py-2.5 transition-colors"
              >
                {/* ATIVO + sugestões */}
                <div className="relative">
                  <input
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="Digite o nome do ativo"
                    value={l.nome}
                    onChange={(e) => {
                      atualizarCampo(l.id, "nome", e.target.value);
                      setFocoId(l.id);
                      setQuery(e.target.value);
                    }}
                    onFocus={(e) => {
                      setFocoId(l.id);
                      setQuery(e.target.value);
                    }}
                    onBlur={() => {
                      setTimeout(() => {
                        setFocoId((prev) => (prev === l.id ? null : prev));
                      }, 120);
                    }}
                  />

                  {focoId === l.id && sugestoes.length > 0 && (
                    <div className="absolute z-20 mt-1 w-full max-h-44 overflow-auto rounded-lg border border-white/10 bg-slate-950 shadow-lg">
                      {sugestoes.map((s) => (
                        <button
                          key={s}
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => selecionarSugestao(l.id, s)}
                          className="w-full px-3 py-2 text-left text-sm text-slate-100 hover:bg-slate-800"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* VALOR */}
                <div>
                  <input
                    className="w-full text-right bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 outline-none focus:ring-2 focus:ring-emerald-500"
                    inputMode="decimal"
                    placeholder="0,00"
                    value={
                      typeof l.valor === "string" ? l.valor : String(l.valor)
                    }
                    onChange={(e) => {
                      const raw = e.target.value;
                      if (!/^[0-9.,]*$/.test(raw)) return;
                      atualizarCampo(l.id, "valor", raw);
                    }}
                    onBlur={(e) => {
                      const num = Number(
                        String(e.target.value).replace(",", ".")
                      );
                      atualizarCampo(
                        l.id,
                        "valor",
                        Number.isFinite(num) ? num : 0
                      );
                    }}
                  />
                </div>

                {/* AÇÕES */}
                <div className="flex justify-center">
                  <button
                    onClick={() => removerLinha(l.id)}
                    className="inline-flex items-center justify-center h-9 px-3 rounded-lg bg-rose-600 text-xs font-semibold text-white hover:bg-rose-500"
                    title="Excluir linha"
                  >
                    Apagar
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Total */}
          <div className="mt-4 rounded-xl bg-slate-900/80 border border-white/10 px-4 py-3 flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-100">Total</span>
            <span className="text-sm font-semibold text-emerald-300">
              {total.toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
                maximumFractionDigits: 2,
              })}
            </span>
          </div>

          {/* Barra de ações inferior (estilo Despesas) */}
          <div className="mt-4 flex items-center justify-between">
            <button
              onClick={adicionarLinha}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-600 bg-slate-900 text-sm text-slate-100 hover:bg-slate-800"
            >
              <span className="text-lg leading-none">＋</span>
              Adicionar linha
            </button>

            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-lg border border-slate-600 bg-slate-900 text-sm text-slate-100 hover:bg-slate-800"
              >
                Fechar
              </button>
              <button
                onClick={salvar}
                className="px-5 py-2 rounded-lg bg-emerald-600 text-sm font-semibold text-white hover:bg-emerald-500"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
