// src/components/modals/EditAtivosModal.jsx
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Trash2, Copy } from "lucide-react";

/* ---------------------------
   Month/Year Picker premium
---------------------------- */
function MesAnoPicker({ value, onChange }) {
  const meses = [
    "Jan","Fev","Mar","Abr","Mai","Jun",
    "Jul","Ago","Set","Out","Nov","Dez"
  ];

  const [mesAtual, anoAtualStr] = String(value || "").split("/");
  const anoInicial = Number(anoAtualStr) || new Date().getFullYear();

  const [open, setOpen] = React.useState(false);
  const [ano, setAno] = React.useState(anoInicial);

  // sincroniza ano quando value muda
  React.useEffect(() => {
    const [, a] = String(value || "").split("/");
    if (a) setAno(Number(a));
  }, [value]);

  // fecha clicando fora
  const ref = React.useRef(null);
  React.useEffect(() => {
    function onDocClick(e) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      {/* Caixa premium */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 rounded-xl bg-slate-900/70 border border-white/10 px-3 py-2 text-sm text-slate-100 hover:bg-slate-800 transition shadow-sm"
        title="Selecionar mês"
      >
        <span className="text-[11px] uppercase tracking-wide text-slate-400">
          Mês
        </span>
        <span className="font-semibold">{value}</span>
        <span className="text-slate-400">▾</span>
      </button>

      {/* Popover calendário */}
      {open && (
        <div className="absolute left-0 mt-2 w-[260px] rounded-2xl border border-white/10 bg-slate-950 shadow-2xl p-3 z-50">
          {/* Header ano */}
          <div className="flex items-center justify-between mb-2">
            <button
              type="button"
              onClick={() => setAno((a) => a - 1)}
              className="h-8 w-8 rounded-lg bg-white/5 hover:bg-white/10 text-slate-200 transition"
              aria-label="Ano anterior"
            >
              ←
            </button>

            <div className="text-slate-100 font-semibold">
              {ano}
            </div>

            <button
              type="button"
              onClick={() => setAno((a) => a + 1)}
              className="h-8 w-8 rounded-lg bg-white/5 hover:bg-white/10 text-slate-200 transition"
              aria-label="Próximo ano"
            >
              →
            </button>
          </div>

          {/* Grid meses */}
          <div className="grid grid-cols-3 gap-2">
            {meses.map((m) => {
              const selected = m === mesAtual && ano === anoInicial;
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => {
                    onChange?.(`${m}/${ano}`);
                    setOpen(false);
                  }}
                  className={`rounded-xl px-3 py-2 text-sm font-medium transition
                    ${
                      selected
                        ? "bg-emerald-500 text-white"
                        : "bg-white/5 text-slate-200 hover:bg-white/10"
                    }`}
                >
                  {m}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------------------
      Modal principal
---------------------------- */
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
  // opcional: se quiser duplicar real do mês anterior, passe isso
  linhasMesAnterior = null,
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

  // ----- LINHAS -----
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
      return novo.length
        ? novo
        : [{ id: crypto.randomUUID(), nome: "", valor: "" }];
    });
  };

  const atualizarCampo = (id, campo, valor) => {
    setLinhas((prev) =>
      prev.map((l) => (l.id === id ? { ...l, [campo]: valor } : l))
    );
  };

  // ✅ DUPLICAR MÊS ANTERIOR
  const duplicarMesAnterior = () => {
    const fonte =
      Array.isArray(linhasMesAnterior) && linhasMesAnterior.length
        ? linhasMesAnterior
        : Array.isArray(linhasIniciais)
        ? linhasIniciais
        : [];

    if (!fonte.length) {
      setLinhas([{ id: crypto.randomUUID(), nome: "", valor: "" }]);
      return;
    }

    setLinhas(
      fonte.map((l) => ({
        id: crypto.randomUUID(),
        nome: String(l?.nome ?? ""),
        valor: formatPtBr(toNum(l?.valor ?? 0)),
      }))
    );
  };

  // ----- AUTOCOMPLETE -----
  const [focoId, setFocoId] = useState(null);
  const [query, setQuery] = useState("");

  const uniqAtivos = useMemo(() => {
    return Array.from(
      new Map(
        ativosExistentes.map((n) => [String(n).toLowerCase(), String(n)])
      ).values()
    ).sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [ativosExistentes]);

  const sugestoes = useMemo(() => {
    // se não tem query, mostra lista base ao focar
    if (!query) return uniqAtivos.slice(0, 8);
    const q = query.toLowerCase();
    return uniqAtivos.filter((n) => n.toLowerCase().includes(q)).slice(0, 8);
  }, [query, uniqAtivos]);

  const selecionarSugestao = (id, nome) => {
    atualizarCampo(id, "nome", nome);
    setFocoId(null);
    setQuery("");
  };

  // ----- SALVAR (ordenado por valor) -----
  const salvar = useCallback(() => {
    const itensLimpos = linhas
      .filter((l) => String(l.nome).trim() !== "")
      .map((l) => ({
        nome: l.nome.trim(),
        valor: toNum(l.valor),
      }))
      .sort((a, b) => b.valor - a.valor);

    const payload = {
      mesAno,
      itens: itensLimpos,
      total: itensLimpos.reduce((acc, i) => acc + i.valor, 0),
    };

    onSave?.(payload);
    onClose?.();
  }, [mesAno, linhas, onSave, onClose]);

  const onBackdropClick = (e) => {
    if (e.target === backdropRef.current) onClose?.();
  };

  // ----- ATALHOS -----
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
        className="w-[920px] max-w-[96vw] rounded-2xl bg-slate-950/95 border border-white/10 shadow-2xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <span className="text-slate-100 text-lg font-semibold">
              Editar Ativos
            </span>

            {/* ✅ NOVO calendário premium */}
            <MesAnoPicker
              value={mesAno}
              onChange={(novo) => setMesAno(novo)}
            />

            {/* Duplicar mês anterior */}
            <button
              onClick={duplicarMesAnterior}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-white/10 bg-slate-900 text-sm text-slate-100 hover:bg-slate-800 transition"
              title="Duplicar mês anterior"
            >
              <Copy size={14} />
              Duplicar mês anterior
            </button>
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
          {/* Cabeçalho colunas */}
          <div className="grid grid-cols-[minmax(0,2.2fr)_minmax(0,1fr)_auto] gap-3 text-[11px] font-medium uppercase tracking-wide text-slate-400 mb-2 px-1">
            <span>Ativo</span>
            <span className="text-right">Valor</span>
            <span className="text-center">Ações</span>
          </div>

          {/* Linhas */}
          <div className="space-y-2 max-h-[440px] overflow-y-auto pr-1">
            {linhas.map((l) => (
              <div
                key={l.id}
                className="grid grid-cols-[minmax(0,2.2fr)_minmax(0,1fr)_auto] gap-3 items-center rounded-xl bg-slate-900/70 hover:bg-slate-900 border border-white/10 px-4 py-2.5 transition-colors"
              >
                {/* Ativo */}
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
                      setQuery(e.target.value);
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

                {/* Valor */}
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
                      atualizarCampo(
                        l.id,
                        "valor",
                        num > 0 ? formatPtBr(num) : ""
                      );
                    }}
                  />
                </div>

                {/* Ações */}
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
