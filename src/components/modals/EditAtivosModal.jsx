// src/components/modals/EditAtivosModal.jsx
import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { Trash2 } from "lucide-react";

/* --------------------------------------------------
      SELECTOR DE MÊS / ANO
-------------------------------------------------- */
function MesAnoPicker({ value, onChange }) {
  const meses = [
    "Jan","Fev","Mar","Abr","Mai","Jun",
    "Jul","Ago","Set","Out","Nov","Dez"
  ];

  const [mesAtual, anoAtualStr] = String(value || "").split("/");
  const anoInicial = Number(anoAtualStr) || new Date().getFullYear();
  const [open, setOpen] = useState(false);
  const [ano, setAno] = useState(anoInicial);

  const ref = useRef(null);

  useEffect(() => {
    function onDocClick(e) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  useEffect(() => {
    const [, a] = String(value || "").split("/");
    if (a) setAno(Number(a));
  }, [value]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 rounded-lg bg-gray-100 border border-gray-300 px-3 py-2 text-sm text-gray-800 hover:bg-gray-200 transition"
      >
        <span>{value}</span>
        ▾
      </button>

      {open && (
        <div className="absolute left-0 mt-2 w-[240px] rounded-xl border border-gray-300 bg-white shadow-xl p-3 z-50">
          <div className="flex items-center justify-between mb-2">
            <button
              type="button"
              onClick={() => setAno((a) => a - 1)}
              className="h-8 w-8 rounded bg-gray-200 hover:bg-gray-300"
            >
              ←
            </button>

            <div className="font-semibold text-gray-800">{ano}</div>

            <button
              type="button"
              onClick={() => setAno((a) => a + 1)}
              className="h-8 w-8 rounded bg-gray-200 hover:bg-gray-300"
            >
              →
            </button>
          </div>

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
                  className={`rounded-lg px-3 py-2 text-sm transition ${
                    selected
                      ? "bg-emerald-500 text-white"
                      : "bg-gray-100 text-gray-800 hover:bg-gray-200"
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

/* --------------------------------------------------
      MODAL PRINCIPAL
-------------------------------------------------- */
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
  // usado para sugerir o último ativo ao adicionar linha
  linhasMesAnterior = [],
}) {
  const backdropRef = useRef(null);

  const mesesLista = [
    "Jan","Fev","Mar","Abr","Mai","Jun",
    "Jul","Ago","Set","Out","Nov","Dez"
  ];
  const hoje = new Date();
  const mesBase = hoje.getMonth();
  const anoBase = hoje.getFullYear();

  const padraoMesAno = mesAnoInicial || `${mesesLista[mesBase]}/${anoBase}`;
  const [mesAno, setMesAno] = useState(padraoMesAno);

  const toNum = (x) => {
    if (x === "" || x == null) return 0;
    const n = Number(String(x).replace(/\./g, "").replace(",", "."));
    return Number.isFinite(n) ? n : 0;
  };

  const formatPtBr = (n) =>
    n.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const [linhas, setLinhas] = useState([
    { id: crypto.randomUUID(), nome: "", valor: "" },
  ]);

  // 🔒 Travar scroll do fundo enquanto o modal está aberto
  useEffect(() => {
    if (!open) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [open]);

  // carregar dados ao abrir
  useEffect(() => {
    if (!open) return;

    setMesAno(padraoMesAno);

    if (Array.isArray(linhasIniciais) && linhasIniciais.length > 0) {
      setLinhas(
        linhasIniciais.map((l) => ({
          id: crypto.randomUUID(),
          nome: l.nome || "",
          valor: formatPtBr(toNum(l.valor)),
        }))
      );
    } else {
      setLinhas([{ id: crypto.randomUUID(), nome: "", valor: "" }]);
    }
  }, [open, padraoMesAno, linhasIniciais]);

  // adicionar linha NOVA no topo, usando referência do mês anterior
  const adicionarLinha = () => {
    let base = { nome: "", valor: "" };

    if (Array.isArray(linhasMesAnterior) && linhasMesAnterior.length > 0) {
      const ultimo = linhasMesAnterior[0]; // primeiro da lista anterior
      base = {
        nome: ultimo?.nome || "",
        valor: formatPtBr(toNum(ultimo?.valor || 0)),
      };
    }

    setLinhas((prev) => [
      { id: crypto.randomUUID(), ...base },
      ...prev,
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

  const total = linhas.reduce((acc, l) => acc + toNum(l.valor), 0);

  const salvar = useCallback(() => {
    const itensLimpos = linhas
      .filter((l) => l.nome.trim() !== "")
      .map((l) => ({
        nome: l.nome.trim(),
        valor: toNum(l.valor),
      }));

    onSave?.({ mesAno, itens: itensLimpos, total });
    onClose?.();
  }, [mesAno, linhas, total, onSave, onClose]);

  if (!open) return null;

  return (
    <div
      ref={backdropRef}
      onMouseDown={(e) => e.target === backdropRef.current && onClose?.()}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-hidden"
    >
      <div
        className="w-[900px] max-w-[96vw] max-h-[90vh] rounded-xl bg-white shadow-2xl flex flex-col"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="px-6 py-4 border-b border-gray-300 bg-gray-100 rounded-t-xl flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900">Editar Ativos</h2>

          <button
            onClick={onClose}
            className="text-gray-700 hover:text-black text-xl"
          >
            ×
          </button>
        </div>

        {/* CONTEÚDO: cabeçalho + tabela COM SCROLL INTERNO */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Topo: mês + adicionar linha */}
          <div className="px-6 mt-4 flex items-center gap-4">
            <MesAnoPicker value={mesAno} onChange={setMesAno} />

            <button
              onClick={adicionarLinha}
              className="inline-flex items-center gap-2 text-emerald-600 hover:text-emerald-700 text-sm font-medium"
            >
              + Adicionar linha
            </button>
          </div>

          {/* Cabeçalho de colunas */}
          <div className="grid grid-cols-[2fr_1fr_60px] gap-0 px-6 mt-6 text-xs font-semibold text-gray-600 uppercase">
            <div className="border-b border-gray-300 pb-1">Nome do Ativo</div>
            {/* 👉 Valor alinhado à esquerda (sem text-right) */}
            <div className="border-b border-gray-300 pb-1">Valor</div>
            <div className="border-b border-gray-300 pb-1 text-center">Ação</div>
          </div>

          {/* LINHAS com SCROLL INTERNO */}
          <div className="px-6 mt-2 flex-1 overflow-y-auto">
            {linhas.map((l) => (
              <div
                key={l.id}
                className="grid grid-cols-[2fr_1fr_60px] items-center border-b border-gray-200 py-2"
              >
                {/* Nome */}
                <div className="pr-3 border-r border-gray-300">
                  <input
                    className="w-full bg-transparent px-2 py-1 text-sm text-gray-900 outline-none"
                    placeholder="Digite um ativo"
                    value={l.nome}
                    onChange={(e) =>
                      atualizarCampo(l.id, "nome", e.target.value)
                    }
                  />
                </div>

                {/* Valor – alinhado à esquerda */}
                <div className="pl-3 pr-3 border-r border-gray-300">
                  <input
                    className="w-full bg-transparent px-2 py-1 text-sm text-gray-900 outline-none"
                    inputMode="decimal"
                    placeholder="0,00"
                    value={l.valor}
                    onChange={(e) => {
                      const raw = e.target.value;
                      if (/^[0-9.,]*$/.test(raw)) {
                        atualizarCampo(l.id, "valor", raw);
                      }
                    }}
                    onBlur={(e) =>
                      atualizarCampo(
                        l.id,
                        "valor",
                        formatPtBr(toNum(e.target.value))
                      )
                    }
                  />
                </div>

                {/* Ação */}
                <div className="flex justify-center">
                  <button
                    onClick={() => removerLinha(l.id)}
                    className="text-gray-500 hover:text-red-500"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* TOTAL */}
        <div className="px-6 py-4 flex justify-between border-t border-gray-300">
          <span className="font-semibold text-gray-900">Total:</span>
          <span className="font-semibold text-emerald-600">
            {total.toLocaleString("pt-BR", {
              style: "currency",
              currency: "BRL",
            })}
          </span>
        </div>

        {/* FOOTER */}
        <div className="px-6 py-4 flex justify-end gap-3 border-t border-gray-200 rounded-b-xl">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300"
          >
            Fechar
          </button>

          <button
            onClick={salvar}
            className="px-5 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-500"
          >
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
}
