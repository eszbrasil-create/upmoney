// src/components/modals/EditAtivosModal.jsx
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Trash2 } from "lucide-react";

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
    "Jan","Fev","Mar","Abr","Mai","Jun",
    "Jul","Ago","Set","Out","Nov","Dez",
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

  // ----- Helpers valor -----
  function toNum(x) {
    if (x === "" || x == null) return 0;
    const n = Number(String(x).replace(/\./g, "").replace(",", "."));
    return Number.isFinite(n) ? n : 0;
  }

  function formatPtBr(n) {
    return n.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  // ----- TABELA (LINHAS) -----
  const [linhas, setLinhas] = useState([
    { id: crypto.randomUUID(), nome: "", valor: "" },
  ]);

  useEffect(() => {
    if (!open) return;
    setMesAno(padraoMesAno);

    if (Array.isArray(linhasIniciais) && linhasIniciais.length) {
      setLinhas(
        linhasIniciais.map((l) => ({
          id: crypto.randomUUID(),
          nome: String(l?.nome ?? ""),
          // mantém string formatada sempre
          valor: formatPtBr(toNum(l?.valor ?? 0)),
        }))
      );
    } else {
      setLinhas([{ id: crypto.randomUUID(), nome: "", valor: "" }]);
    }
  }, [open, padraoMesAno, linhasIniciais]);

  const total = useMemo(
    () => linhas.reduce((acc, l) => acc + toNum(l.valor), 0),
    [linhas]
  );

  const adicionarLinha = () => {
    setLinhas((prev) => [
      ...prev,
      { id: crypto.randomUUID(), nome: "", valor: "" },
    ]);
  };

  const removerLinha = (id) => {
    setLinhas((prev) => {
      const novo = prev.filter((l) => l.id !== id);
      return novo.length ? novo : [{ id: crypto.randomUUID(), nome: "", valor: "" }];
    });
  };

  const atualizarCampo = (id, campo, valor) => {
    setLinhas((prev) =>
      prev.map((l) => (l.id === id ? { ...l, [campo]: valor } : l))
    );
  };

  // ----- AUTOCOMPLETE -----
  const [focoId, setFocoId] = useState(null);
  const [query, setQuery] = useState("");

  // lista única de ativos
  const uniqAtivos = useMemo(() => {
    return Array.from(
      new Map(
        ativosExistentes.map((n) => [String(n).toLowerCase(), String(n)])
      ).values()
    ).sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [ativosExistentes]);

  const sugestoes = useMemo(() => {
    // ✅ NOVO: se não tem query e está focado, mostra lista base
    if (!query) return uniqAtivos.slice(0, 8);

    const q = query.toLowerCase();
    return uniqAtivos.filter((n) => n.toLowerCase().includes(q)).slice(0, 8);
  }, [query, uniqAtivos]);

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
          valor: toNum(l.valor),
        })),
      total,
    };
    onSave?.(payload);
    onClose?.();
  }, [mesAno, linhas, total, onSave, onClose]);

  const onBackdropClick = (e) => {
    if (e.target === backdropRef.current) onClose?.();
  };

  // ----- ATALHOS (Esc fecha, Ctrl/Cmd+Enter salva) -----
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose?.();
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
        className="w-[900px] max-w-[95vw] rounded-2xl bg-slate-950/95 border border-white/10 shadow-2xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Cabeçalho (mais leve) */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <span className="text-slate-100 text-lg font-semibold">
              Editar Ativos
            </span>

            <select
              value={mesAno}
              onChange={(e) => setMesAno(e.target.value)}
              className="bg-slate-900 text-slate-100 text-sm rounded-lg px-3 py-2 border border-white/10 outline-none focus:ring-2 focus:ring-emerald-500"
              title="Selecionar mês"
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
          {/* Cabeçalho de colunas */}
          <div className="grid grid-cols-[minmax(0,2.2fr)_minmax(0,1fr)_auto] gap-3 text-[11px] font-medium uppercase tracking-wide text-slate-400 mb-2 px-1">
            <span>Ativo</span>
            <span className="text-right">Valor</span>
            <span className="text-center">Ações</span>
          </div>

          {/* Linhas (mais alta) */}
          <div className="space-y-2 max-h-[440px] overflow-y-auto pr-1">
            {linhas.map((l) => (
              <div
                key={l.id}
                className="grid grid-cols-[minmax(0,2.2fr)_minmax(0,1fr)_auto] gap-3 items-center rounded-xl bg-slate-900/70 hover:bg-slate-900 border border-white/10 px-4 py-2.5 transition-colors"
              >
                {/* ATIVO + lista ao focar */}
                <div className="relative">
                  <input
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="Digite ou selecione um ativo"
                    value={l.nome}
                    onChange={(e) => {
                      atualizarCampo(l.id, "nome", e.target.value);
                      setFocoId(l.id);
                      setQuery(e.target.value);
                    }}
                    onFocus={(e) => {
                      setFocoId(l.id);
                      setQuery(e.target.value); // pode ser vazio -> lista aparece
                    }}
                    onBlur={() => {
                      setTimeout(() => {
                        setFocoId((prev) => (prev === l.id ? null : prev));
                        setQuery("");
                      }, 120);
                    }}
                  />

                  {focoId === l.id && sugestoes.length > 0 && (
                    <div className="absolute z-20 mt-1 w-full max-h-48 overflow-auto rounded-lg border border-white/10 bg-slate-950 shadow-lg">
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

                {/* VALOR (máscara leve) */}
                <div>
                  <input
                    className="w-full text-right bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 outline-none focus:ring-2 focus:ring-emerald-500 tabular-nums"
                    inputMode="decimal"
                    placeholder="0,00"
                    value={l.valor}
                    onChange={(e) => {
                      const raw = e.target.value;
                      if (!/^[0-9.,]*$/.test(raw)) return;
                      atualizarCampo(l.id, "valor", raw);
                    }}
                    onBlur={(e) => {
                      const num = toNum(e.target.value);
                      atualizarCampo(l.id, "valor", num > 0 ? formatPtBr(num) : "");
                    }}
                  />
                </div>

                {/* AÇÕES (discreto) */}
                <div className="flex justify-center">
                  <button
                    onClick={() => removerLinha(l.id)}
                    className="inline-flex items-center justify-center h-9 w-9 rounded-lg bg-white/5 hover:bg-rose-500/15 text-slate-300 hover:text-rose-300 transition"
                    title="Remover linha"
                    aria-label="Remover linha"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Total */}
          <div className="mt-4 rounded-xl bg-slate-900/80 border border-white/10 px-4 py-3 flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-100">Total</span>
            <span className="text-sm font-semibold text-emerald-300 tabular-nums">
              {total.toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
                maximumFractionDigits: 2,
              })}
            </span>
          </div>

          {/* Barra inferior */}
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
