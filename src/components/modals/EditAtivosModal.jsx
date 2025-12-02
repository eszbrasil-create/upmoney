// src/components/modals/
import React, {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { Trash2 } from "lucide-react";
import { supabase } from "../../lib/supabaseClient";
import { salvarRegistroAtivos } from "../../lib/salvarRegistroAtivos"; // ajuste o caminho se necessário

/* ---------------------------
   Hook para dropdown flutuante
---------------------------- */
function useFloatingDropdown(ref, offset = 4) {
  const [style, setStyle] = useState({});

  useLayoutEffect(() => {
    function update() {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      setStyle({
        position: "absolute",
        top: rect.bottom + offset + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width,
        zIndex: 9999,
      });
    }
    update();
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [ref, offset]);

  return style;
}

/* ---------------------------
   Month / Year Picker
---------------------------- */
function MesAnoPicker({ value, onChange }) {
  const meses = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  const [mesAtual, anoAtualStr] = String(value || "").split("/");
  const anoInicial = Number(anoAtualStr) || new Date().getFullYear();

  const [open, setOpen] = useState(false);
  const [ano, setAno] = useState(anoInicial);
  const ref = useRef(null);

  useEffect(() => {
    const [, a] = String(value || "").split("/");
    if (a) setAno(Number(a));
  }, [value]);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 rounded-lg bg-gray-100 border border-gray-300 px-3 py-2 text-sm text-gray-800 hover:bg-gray-200 transition"
      >
        <span>{value}</span>
        <span>▼</span>
      </button>

      {open && (
        <div className="absolute left-0 mt-2 w-60 rounded-xl border border-gray-300 bg-white shadow-xl p-4 z-50">
          <div className="flex items-center justify-between mb-3">
            <button onClick={() => setAno((a) => a - 1)} className="w-8 h-8 rounded hover:bg-gray-200">←</button>
            <span className="font-semibold">{ano}</span>
            <button onClick={() => setAno((a) => a + 1)} className="w-8 h-8 rounded hover:bg-gray-200">→</button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {meses.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => {
                  onChange(`${m}/${ano}`);
                  setOpen(false);
                }}
                className={`py-2 px-3 rounded text-sm transition ${
                  m === mesAtual && ano === anoInicial
                    ? "bg-emerald-500 text-white"
                    : "hover:bg-gray-100"
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------------------
   Linha da tabela
---------------------------- */
function LinhaAtivo({
  linha,
  focoId,
  setFocoId,
  sugestoes,
  selecionarSugestao,
  atualizarCampo,
  removerLinha,
  setQuery,
  formatPtBr,
  toNum,
}) {
  const inputRef = useRef(null);
  const dropdownStyle = useFloatingDropdown(inputRef, 4);

  const hasNome = (linha.nome || "").trim() !== "";
  const hasValor = String(linha.valor ?? "").trim() !== "";
  const erroValorSemNome = hasValor && !hasNome;

  return (
    <div className={`grid grid-cols-[2fr_1fr_60px] gap-0 items-center border-b border-gray-200 py-2 ${focoId === linha.id ? "relative z-20 bg-white" : ""}`}>
      {/* NOME */}
      <div className="pr-3 border-r border-gray-300 relative">
        <input
          ref={inputRef}
          className="w-full bg-transparent px-2 py-1 text-sm text-gray-900 outline-none"
          placeholder="Digite um ativo"
          value={linha.nome || ""}
          onChange={(e) => {
            atualizarCampo(linha.id, "nome", e.target.value);
            setFocoId(linha.id);
            setQuery(e.target.value);
          }}
          onFocus={() => setFocoId(linha.id)}
          onBlur={() => setTimeout(() => setFocoId(null), 150)}
        />

        {focoId === linha.id && sugestoes.length > 0 && typeof document !== "undefined" && createPortal(
          <div style={dropdownStyle} className="bg-white border border-gray-300 rounded-lg shadow-xl max-h-60 overflow-y-auto">
            {sugestoes.map((s) => (
              <button
                key={s}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => selecionarSugestao(linha.id, s)}
                className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
              >
                {s}
              </button>
            ))}
          </div>,
          document.body
        )}
      </div>

      {/* VALOR */}
      <div className="pl-3 pr-3 border-r border-gray-300">
        <input
          className="w-full text-left bg-transparent px-2 py-1 text-sm text-gray-900 outline-none"
          inputMode="decimal"
          placeholder="0,00"
          value={linha.valor || ""}
          onChange={(e) => {
            const raw = e.target.value;
            if (/^[0-9.,]*$/.test(raw)) {
              atualizarCampo(linha.id, "valor", raw);
            }
          }}
          onBlur={(e) => atualizarCampo(linha.id, "valor", formatPtBr(toNum(e.target.value)))}
        />
        {erroValorSemNome && <p className="mt-1 text-xs text-red-500">Nome obrigatório</p>}
      </div>

      {/* LIXO */}
      <div className="flex justify-center">
        <button onClick={() => removerLinha(linha.id)} className="text-gray-500 hover:text-red-600">
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}

/* ---------------------------
   MODAL PRINCIPAL – FINAL E INQUEBRÁVEL
---------------------------- */
export default function EditAtivosModal({
  open,
  isOpen,
  onClose,
  onSave,
  ativosExistentes = ["Ações", "Renda Fixa", "Cripto", "FIIs", "Caixa", "Banco", "Viagem", "Cofre"],
  mesAnoInicial,
}) {
  const visible = Boolean(open ?? isOpen);
  const [user, setUser] = useState(null);
  const [mesAno, setMesAno] = useState("");
  const [linhas, setLinhas] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [erroGlobal, setErroGlobal] = useState("");
  const [focoId, setFocoId] = useState(null);
  const [query, setQuery] = useState("");

  const toNum = (v) => Number(String(v).replace(/\./g, "").replace(",", ".")) || 0;
  const formatPtBr = (n) => Number(n).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const total = linhas.reduce((acc, l) => acc + toNum(l.valor), 0);

  const sugestoes = useMemo(() => {
    if (!query.trim()) return ativosExistentes.slice(0, 8);
    return ativosExistentes.filter(a => a.toLowerCase().includes(query.toLowerCase())).slice(0, 8);
  }, [query, ativosExistentes]);

  // CARREGA DADOS AO ABRIR
  useEffect(() => {
    if (!visible) return;

    const carregarDados = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      const hoje = new Date();
      const meses = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
      const mesAnoPadrao = mesAnoInicial || `${meses[hoje.getMonth()]}/${hoje.getFullYear()}`;
      setMesAno(mesAnoPadrao);

      if (!user) return;

      const { data: cabecalho } = await supabase
        .from("registros_ativos")
        .select("id")
        .eq("user_id", user.id)
        .eq("mes_ano", mesAnoPadrao)
        .maybeSingle();

      if (cabecalho) {
        const { data: itens } = await supabase
          .from("registros_ativos_itens")
          .select("nome_ativo, valor")
          .eq("registro_id", cabecalho.id);

        if (itens?.length > 0) {
          setLinhas(itens.map(i => ({
            id: crypto.randomUUID(),
            nome: i