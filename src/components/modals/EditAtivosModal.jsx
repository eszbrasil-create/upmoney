// src/components/modals/EditAtivosModal.jsx
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Trash2 } from "lucide-react";

/* ---------------------------
   Month/Year Picker minimal
---------------------------- */
function MesAnoPicker({ value, onChange }) {
  const meses = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
  const [mesAtual, anoAtual] = String(value || "").split("/");
  const [open, setOpen] = useState(false);

  const anos = [];
  for (let y = 2022; y <= 2032; y++) anos.push(y);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-100"
      >
        {value}
      </button>

      {open && (
        <div className="absolute mt-2 bg-white border border-gray-200 rounded-xl shadow-lg p-3 z-50 w-44">
          <div className="text-sm font-medium text-gray-600 mb-1 px-1">
            Mês
          </div>
          <div className="grid grid-cols-3 gap-1 mb-3">
            {meses.map((m) => (
              <button
                key={m}
                onClick={() => {
                  onChange(`${m}/${anoAtual}`);
                  setOpen(false);
                }}
                className={`text-sm py-1 rounded-md ${
                  m === mesAtual ? "bg-emerald-500 text-white" : "hover:bg-gray-100"
                }`}
              >
                {m}
              </button>
            ))}
          </div>

          <div className="text-sm font-medium text-gray-600 mb-1 px-1">
            Ano
          </div>
          <div className="grid grid-cols-3 gap-1">
            {anos.map((a) => (
              <button
                key={a}
                onClick={() => {
                  onChange(`${mesAtual}/${a}`);
                  setOpen(false);
                }}
                className={`text-sm py-1 rounded-md ${
                  a == anoAtual ? "bg-emerald-500 text-white" : "hover:bg-gray-100"
                }`}
              >
                {a}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------------------
   MODAL PRINCIPAL
---------------------------- */
export default function EditAtivosModal({
  open,
  onClose,
  onSave,
  ativosExistentes = [],
  mesAnoInicial,
  linhasIniciais = [],
}) {
  const refBackdrop = useRef(null);

  const hoje = new Date();
  const meses = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];

  const mesPadrao = `${meses[hoje.getMonth()]}/${hoje.getFullYear()}`;
  const [mesAno, setMesAno] = useState(mesAnoInicial || mesPadrao);

  /* ------------ helpers num ------------ */
  const toNum = (x) => {
    if (!x) return 0;
    return Number(String(x).replace(/\./g, "").replace(",", ".")) || 0;
  };

  const format = (n) =>
    n.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  /* ------------ linhas ------------ */
  const [linhas, setLinhas] = useState([]);

  useEffect(() => {
    if (!open) return;

    if (linhasIniciais.length > 0) {
      setLinhas(
        linhasIniciais.map((l) => ({
          id: crypto.randomUUID(),
          nome: l.nome,
          valor: format(toNum(l.valor)),
        }))
      );
    } else {
      setLinhas([{ id: crypto.randomUUID(), nome: "", valor: "" }]);
    }
  }, [open, linhasIniciais]);

  const adicionarLinhaTopo = () => {
    setLinhas((prev) => [
      { id: crypto.randomUUID(), nome: "", valor: "" },
      ...prev,
    ]);
  };

  const remover = (id) => {
    const novo = linhas.filter((l) => l.id !== id);
    setLinhas(novo.length ? novo : [{ id: crypto.randomUUID(), nome: "", valor: "" }]);
  };

  const atualizar = (id, campo, valor) => {
    setLinhas((prev) =>
      prev.map((l) => (l.id === id ? { ...l, [campo]: valor } : l))
    );
  };

  const total = linhas.reduce((acc, l) => acc + toNum(l.valor), 0);

  /* ------------ salvar ------------ */
  const salvar = useCallback(() => {
    const itens = linhas
      .filter((l) => l.nome.trim() !== "")
      .map((l) => ({ nome: l.nome.trim(), valor: toNum(l.valor) }))
      .sort((a, b) => b.valor - a.valor);

    onSave?.({
      mesAno,
      itens,
      total: itens.reduce((acc, i) => acc + i.valor, 0),
    });

    onClose?.();
  }, [linhas, mesAno, onSave, onClose]);

  if (!open) return null;

  return (
    <div
      ref={refBackdrop}
      onMouseDown={(e) => e.target === refBackdrop.current && onClose?.()}
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div
        onMouseDown={(e) => e.stopPropagation()}
        className="w-[900px] max-w-[95vw] bg-white rounded-2xl shadow-xl border border-gray-200"
      >
        {/* ---------------- HEADER ---------------- */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#F2F2F2] rounded-t-2xl border-b border-gray-300">
          <div className="flex items-center gap-3">
            <div className="text-lg font-semibold text-gray-800">Editar Ativos</div>

            <MesAnoPicker value={mesAno} onChange={setMesAno} />
          </div>

          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-900 text-2xl leading-none px-2"
          >
            ×
          </button>
        </div>

        {/* ---------------- BOTÃO ADICIONAR LINHA (TOPO) ---------------- */}
        <div className="px-6 pt-4">
          <button
            onClick={adicionarLinhaTopo}
            className="inline-flex items-center gap-2 text-sm font-medium text-emerald-700 hover:text-emerald-900"
          >
            <span className="text-lg">＋</span> Adicionar linha
          </button>
        </div>

        {/* ---------------- TABELA ---------------- */}
        <div className="px-6 mt-3 max-h-[420px] overflow-y-auto">
          {/* Cabeçalho */}
          <div className="grid grid-cols-[2fr_1fr_40px] text-xs font-semibold text-gray-500 border-b border-gray-300 pb-1">
            <span>Nome do Ativo</span>
            <span className="text-right">Valor</span>
            <span></span>
          </div>

          {/* Linhas */}
          <div className="mt-2 space-y-1">
            {linhas.map((l) => (
              <div
                key={l.id}
                className="grid grid-cols-[2fr_1fr_40px] items-center py-2 border-b border-gray-200"
              >
                {/* Nome */}
                <input
                  value={l.nome}
                  onChange={(e) => atualizar(l.id, "nome", e.target.value)}
                  placeholder="Ativo"
                  className="text-sm px-1 py-1 border-b border-gray-300 focus:outline-none focus:border-emerald-500"
                />

                {/* Valor */}
                <input
                  value={l.valor}
                  onChange={(e) => {
                    if (/^[0-9.,]*$/.test(e.target.value)) {
                      atualizar(l.id, "valor", e.target.value);
                    }
                  }}
                  onBlur={(e) => atualizar(l.id, "valor", format(toNum(e.target.value)))}
                  placeholder="0,00"
                  className="text-sm px-1 py-1 text-right border-b border-gray-300 focus:outline-none focus:border-emerald-500"
                />

                {/* Remover */}
                <button
                  onClick={() => remover(l.id)}
                  className="h-8 w-8 flex items-center justify-center text-gray-400 hover:text-red-500"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* ---------------- TOTAL + BOTÕES ---------------- */}
        <div className="px-6 py-4 flex items-center justify-between border-t border-gray-300 mt-2">
          <div className="text-sm font-medium text-gray-700">
            Total:{" "}
            <span className="font-semibold text-emerald-700">
              {format(total)}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200"
            >
              Fechar
            </button>

            <button
              onClick={salvar}
              className="px-5 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-500"
            >
              Salvar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
