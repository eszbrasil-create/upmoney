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
   Month/Year Picker
---------------------------- */
function MesAnoPicker({ value, onChange }) {
  const meses = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
  const [mesAtual, anoAtualStr] = String(value || "").split("/");
  const anoInicial = Number(anoAtualStr) || new Date().getFullYear();

  const [open, setOpen] = useState(false);
  const [ano, setAno] = useState(anoInicial);

  const ref = useRef(null);

  // fecha clicando fora
  useEffect(() => {
    function onDocClick(e) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 hover:bg-gray-100"
      >
        <span className="font-semibold">{value}</span>
        <span className="text-gray-500">▾</span>
      </button>

      {open && (
        <div className="absolute left-0 mt-2 w-52 rounded-lg border border-gray-300 bg-white shadow-xl z-50 p-3">
          {/* Header ano */}
          <div className="flex items-center justify-between mb-2 text-gray-900">
            <button
              onClick={() => setAno((a) => a - 1)}
              className="h-7 w-7 rounded-md bg-gray-200 hover:bg-gray-300"
            >
              ←
            </button>

            <div className="font-semibold">{ano}</div>

            <button
              onClick={() => setAno((a) => a + 1)}
              className="h-7 w-7 rounded-md bg-gray-200 hover:bg-gray-300"
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
                  onClick={() => {
                    onChange?.(`${m}/${ano}`);
                    setOpen(false);
                  }}
                  className={`px-2 py-2 rounded-md text-sm transition ${
                    selected ? "bg-blue-600 text-white" : "bg-gray-100 hover:bg-gray-200 text-gray-900"
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
  ativosExistentes = ["Ações", "Renda Fixa", "Cripto", "FIIs", "Caixa", "Banco"],
  mesAnoInicial,
  linhasIniciais = [],
}) {
  const backdropRef = useRef(null);

  const mesesLista = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
  const hoje = new Date();
  const mesBase = hoje.getMonth();
  const anoBase = hoje.getFullYear();

  const padraoMesAno = mesAnoInicial || `${mesesLista[mesBase]}/${anoBase}`;
  const [mesAno, setMesAno] = useState(padraoMesAno);

  function toNum(x) {
    if (!x) return 0;
    return Number(String(x).replace(/\./g, "").replace(",", ".")) || 0;
  }

  function formatPtBr(n) {
    return n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  // Linhas
  const [linhas, setLinhas] = useState([{ id: crypto.randomUUID(), nome: "", valor: "" }]);

  useEffect(() => {
    if (!open) return;
    setMesAno(padraoMesAno);

    if (linhasIniciais.length) {
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
  }, [open, mesAnoInicial]);

  const total = linhas.reduce((acc, l) => acc + toNum(l.valor), 0);

  const adicionarLinha = () => {
    setLinhas([...linhas, { id: crypto.randomUUID(), nome: "", valor: "" }]);
  };

  const removerLinha = (id) => {
    let novo = linhas.filter((l) => l.id !== id);
    if (!novo.length) novo = [{ id: crypto.randomUUID(), nome: "", valor: "" }];
    setLinhas(novo);
  };

  const atualizarCampo = (id, campo, valor) => {
    setLinhas(linhas.map((l) => (l.id === id ? { ...l, [campo]: valor } : l)));
  };

  const salvar = () => {
    const itens = linhas
      .filter((l) => l.nome.trim() !== "")
      .map((l) => ({ nome: l.nome.trim(), valor: toNum(l.valor) }));

    onSave?.({ mesAno, itens, total });
    onClose?.();
  };

  if (!open) return null;

  return (
    <div
      ref={backdropRef}
      onMouseDown={(e) => e.target === backdropRef.current && onClose?.()}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    >
      <div
        onMouseDown={(e) => e.stopPropagation()}
        className="bg-white w-[900px] max-w-[95vw] rounded-2xl shadow-2xl border border-gray-300"
      >
        {/* ---------------- HEADER ---------------- */}
        <div className="px-6 py-4 border-b border-gray-300 bg-gray-100 rounded-t-2xl">
          <h2 className="text-lg font-semibold text-gray-900">Editar Ativos</h2>
        </div>

        {/* ----------- TOOLBAR (data + add + fechar + salvar) ----------- */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center gap-3">
          <MesAnoPicker value={mesAno} onChange={setMesAno} />

          <button
            onClick={adicionarLinha}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-500"
          >
            + Adicionar linha
          </button>

          <div className="flex-1"></div>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-900 rounded-lg text-sm hover:bg-gray-300"
          >
            Fechar
          </button>

          <button
            onClick={salvar}
            className="px-5 py-2 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-500"
          >
            Salvar
          </button>
        </div>

        {/* ---------------- TABELA ---------------- */}
        <div className="px-6 pb-6 pt-4">
          {/* Cabeçalho da tabela */}
          <div className="grid grid-cols-[2fr_1fr_70px] border-b border-gray-300 pb-2 mb-2 font-semibold text-sm text-gray-700">
            <span>Nome do Ativo</span>
            <span className="text-right">Valor</span>
            <span className="text-center">Ação</span>
          </div>

          {/* Linhas */}
          <div className="max-h-[430px] overflow-y-auto">
            {linhas.map((l) => (
              <div
                key={l.id}
                className="grid grid-cols-[2fr_1fr_70px] items-center border-b border-gray-200 py-2"
              >
                {/* Nome */}
                <input
                  className="bg-white border border-gray-300 rounded-md px-3 py-2 text-sm w-full text-gray-900"
                  value={l.nome}
                  placeholder="Digite um ativo"
                  onChange={(e) => atualizarCampo(l.id, "nome", e.target.value)}
                />

                {/* Valor */}
                <input
                  className="bg-white border border-gray-300 rounded-md px-3 py-2 text-sm w-full text-right text-gray-900"
                  value={l.valor}
                  placeholder="0,00"
                  inputMode="decimal"
                  onChange={(e) => {
                    const raw = e.target.value;
                    if (/^[0-9.,]*$/.test(raw)) atualizarCampo(l.id, "valor", raw);
                  }}
                  onBlur={(e) => {
                    atualizarCampo(l.id, "valor", formatPtBr(toNum(e.target.value)));
                  }}
                />

                {/* Remover */}
                <button
                  onClick={() => removerLinha(l.id)}
                  className="flex items-center justify-center h-9 w-9 rounded-lg bg-red-50 hover:bg-red-100 text-red-500"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>

          {/* Total */}
          <div className="mt-4 flex justify-between border-t pt-3 border-gray-300">
            <span className="font-semibold text-gray-800">Total:</span>
            <span className="font-semibold text-emerald-600">
              {total.toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              })}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
