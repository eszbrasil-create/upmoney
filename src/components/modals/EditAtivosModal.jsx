import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Trash2, Plus } from "lucide-react";
import { supabase } from "../../lib/supabaseClient";

/* ============== SELETOR DE MÊS/ANO ============== */
function MesAnoPickerTopo({ value, onChange }) {
  const meses = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  const [open, setOpen] = useState(false);
  const [ano, setAno] = useState(new Date().getFullYear());

  useEffect(() => {
    if (value) {
      const match = value.match(/(\w+)\/(\d{4})/);
      if (match) setAno(Number(match[2]));
    }
  }, [value]);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-lg rounded-xl shadow-lg transition min-w-56"
      >
        {value || "Selecione o mês"}
      </button>

      {open && createPortal(
        <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/70" onClick={() => setOpen(false)}>
          <div className="bg-white rounded-3xl shadow-3xl p-10 max-w-md w-full border-4 border-gray-200" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-10">
              <button className="w-14 h-14 hover:bg-gray-100 rounded-full text-3xl font-bold text-gray-900" onClick={() => setAno(a => a - 1)}>←</button>
              <span className="text-3xl font-black text-gray-900">{ano}</span>
              <button className="w-14 h-14 hover:bg-gray-100 rounded-full text-3xl font-bold text-gray-900" onClick={() => setAno(a => a + 1)}>→</button>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {meses.map(m => (
                <button
                  key={m}
                  onClick={() => { onChange(`${m}/${ano}`); setOpen(false); }}
                  className={`py-6 rounded-2xl font-bold text-xl transition-all ${
                    value?.startsWith(m)
                      ? "bg-emerald-600 text-white"
                      : "bg-gray-50 text-gray-900 hover:bg-emerald-100"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

/* ============== LINHA DE ATIVO RESPONSIVA ============== */
function LinhaAtivo({ linha, onUpdate, onRemove, ativosExistentes }) {
  const inputRef = useRef(null);
  const [query, setQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

  const sugestoes = useMemo(() => {
    if (!query.trim()) return [];
    return ativosExistentes.filter(a => a.toLowerCase().includes(query.toLowerCase())).slice(0, 10);
  }, [query, ativosExistentes]);

  const dropdownStyle = inputRef.current
    ? {
        position: "fixed",
        top: inputRef.current.getBoundingClientRect().bottom + window.scrollY + 10,
        left: inputRef.current.getBoundingClientRect().left + window.scrollX,
        width: inputRef.current.offsetWidth,
        zIndex: 9999999
      }
    : {};

  return (
    <div className="grid grid-cols-1 md:grid-cols-[3fr_2fr_70px] gap-4 md:gap-6 items-center py-4 md:py-5 px-4 md:px-8 bg-white rounded-2xl shadow-md border border-gray-200 hover:shadow-lg transition">

      {/* Nome */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          placeholder="Nome do ativo"
          value={linha.nome}
          onChange={(e) => { onUpdate("nome", e.target.value); setQuery(e.target.value); setShowDropdown(true); }}
          onFocus={() => query && setShowDropdown(true)}
          onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
          className="w-full px-6 py-4 text-lg md:text-xl font-medium text-gray-900 bg-gray-50 border-2 border-gray-300 rounded-xl focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
        />

        {showDropdown && sugestoes.length > 0 &&
          createPortal(
            <div style={dropdownStyle} className="bg-white border-2 border-gray-300 rounded-xl shadow-2xl overflow-hidden">
              {sugestoes.map(s => (
                <button
                  key={s}
                  className="block w-full text-left px-6 py-4 hover:bg-emerald-50 font-medium"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => { onUpdate("nome", s); setQuery(""); setShowDropdown(false); }}
                >
                  {s}
                </button>
              ))}
            </div>,
            document.body
          )}
      </div>

      {/* Valor */}
      <input
        type="text"
        inputMode="decimal"
        placeholder="0,00"
        value={linha.valor}
        onChange={(e) => /^[0-9.,]*$/.test(e.target.value) && onUpdate("valor", e.target.value)}
        onBlur={(e) => {
          const num = Number(e.target.value.replace(/\./g, "").replace(",", "."));
          if (!isNaN(num)) onUpdate("valor", num.toLocaleString("pt-BR", { minimumFractionDigits: 2 }));
        }}
        className="px-6 py-4 ttext-lg font-bold text-right text-emerald-700 bg-gray-50 border-2 border-gray-300 rounded-xl"
      />

      {/* Remover */}
      <button className="text-red-600 hover:text-red-800 p-2 md:p-3" onClick={onRemove}>
        <Trash2 size={26} />
      </button>
    </div>
  );
}

/* ============== MODAL PRINCIPAL ============== */
export default function EditAtivosModal({ open = false, onClose, onSave, mesAnoInicial = "", ativosExistentes }) {
  const [mesAno, setMesAno] = useState(mesAnoInicial);
  const [linhas, setLinhas] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [erro, setErro] = useState("");

  const total = linhas.reduce((acc, l) => acc + (Number(l.valor.replace(/\./g, "").replace(",", ".")) || 0), 0);

  useEffect(() => {
    if (!open) return;

    const hoje = new Date();
    const meses = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

    if (!mesAno) setMesAno(`${meses[hoje.getMonth()]}/${hoje.getFullYear()}`);

    if (linhas.length === 0) {
      setLinhas([
        { id: crypto.randomUUID(), nome: "", valor: "" },
        { id: crypto.randomUUID(), nome: "", valor: "" }
      ]);
    }
  }, [open]);

  useEffect(() => {
    if (!open || !mesAno) return;

    const carregar = async () => {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return setIsLoading(false);

      const { data: reg } = await supabase.from("registros_ativos").select("id").eq("user_id", user.id).eq("mes_ano", mesAno).maybeSingle();

      if (reg) {
        const { data: itens } = await supabase.from("registros_ativos_itens").select("nome_ativo, valor").eq("registro_id", reg.id);

        setLinhas(
          itens?.length
            ? itens.map(i => ({ id: crypto.randomUUID(), nome: i.nome_ativo, valor: Number(i.valor).toLocaleString("pt-BR", { minimumFractionDigits: 2 }) }))
            : [{ id: crypto.randomUUID(), nome: "", valor: "" }]
        );
      }
      setIsLoading(false);
    };

    carregar();
  }, [open, mesAno]);

  const adicionarLinha = () => setLinhas(prev => [...prev, { id: crypto.randomUUID(), nome: "", valor: "" }]);
  const atualizarLinha = (id, campo, valor) => setLinhas(prev => prev.map(l => (l.id === id ? { ...l, [campo]: valor } : l)));
  const removerLinha = id => setLinhas(prev => prev.filter(l => l.id !== id));

  const salvar = async () => {
    if (!mesAno) return setErro("Selecione um mês");

    const itensValidos = linhas.filter(l => l.nome.trim() && l.valor.trim());

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const totalCalc = itensValidos.reduce((acc, l) => acc + Number(l.valor.replace(/\./g, "").replace(",", ".")), 0);

      const { data: regExistente } = await supabase.from("registros_ativos").select("id").eq("user_id", user.id).eq("mes_ano", mesAno).maybeSingle();

      let registroId = regExistente?.id;

      if (!registroId) {
        const { data } = await supabase.from("registros_ativos").insert({ user_id: user.id, mes_ano: mesAno, total: totalCalc }).select("id").single();
        registroId = data.id;
      } else {
        await supabase.from("registros_ativos").update({ total: totalCalc }).eq("id", registroId);
      }

      await supabase.from("registros_ativos_itens").delete().eq("registro_id", registroId);

      if (itensValidos.length > 0) {
        await supabase.from("registros_ativos_itens").insert(
          itensValidos.map(l => ({ registro_id: registroId, user_id: user.id, nome_ativo: l.nome.trim(), valor: Number(l.valor.replace(/\./g, "").replace(",", ".")) }))
        );
      }

      onSave?.({ mesAno, total: totalCalc });
      onClose();
    } catch (err) {
      setErro("Erro ao salvar: " + err.message);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[9999] flex items-center justify-center p-6" onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-3xl w-full max-w-3xl lg:max-w-4xl max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>

        {/* HEADER (mais compacto) */}
        <div className="px-6 md:px-8 py-3 bg-gradient-to-r from-emerald-50 to-teal-50 border-b flex justify-between items-center">
          <h2 className="text-2xl font-black">Editar Ativos</h2>
          <button className="text-3xl text-gray-500 hover:text-gray-800" onClick={onClose}>×</button>
        </div>

        {/* Seletor mês + Add */}
        <div className="px-6 md:px-8 py-4 bg-gray-50 border-b flex flex-col md:flex-row gap-4 md:justify-between">
          <MesAnoPickerTopo value={mesAno} onChange={setMesAno} />
          <button onClick={adicionarLinha} className="flex items-center gap-3 px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg">
            <Plus size={24} /> Adicionar ativo
          </button>
        </div>

        {/* Lista */}
        <div className="p-6 md:p-8 flex-1 overflow-y-auto space-y-6">
          {isLoading ? <p className="text-center text-xl text-gray-600">Carregando...</p> : linhas.map(l => (
            <LinhaAtivo key={l.id} linha={l} onUpdate={(c, v) => atualizarLinha(l.id, c, v)} onRemove={() => removerLinha(l.id)} ativosExistentes={ativosExistentes} />
          ))}
        </div>

        {/* RODAPÉ compacto */}
        <div className="px-6 md:px-8 py-3 bg-gray-50 border-t">
          <div className="flex justify-between items-center mb-3">
            <button className="text-red-600 hover:text-red-800 font-bold" onClick={() => { setLinhas([]); salvar(); }}>Zerar tudo</button>
            <span className="text-2xl font-black text-emerald-600">Total: R$ {total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
          </div>

          <button onClick={salvar} className="w-full px-12 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg">
            Salvar alterações
          </button>
        </div>

        {erro && <div className="p-4 bg-red-100 text-red-700 text-center font-bold">{erro}</div>}
      </div>
    </div>
  );
}

/* ============== DELETE HELPER ============== */
export async function deleteRegistroAtivosPorMesAno(mesAno) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Usuário não autenticado");

  const { data: regExistente, error: regError } = await supabase
    .from("registros_ativos")
    .select("id")
    .eq("user_id", user.id)
    .eq("mes_ano", mesAno)
    .maybeSingle();

  if (regError) throw regError;
  if (!regExistente) return;

  const { error: itensError } = await supabase
    .from("registros_ativos_itens")
    .delete()
    .eq("registro_id", regExistente.id);

  if (itensError) throw itensError;

  const { error: delRegError } = await supabase
    .from("registros_ativos")
    .delete()
    .eq("id", regExistente.id);

  if (delRegError) throw delRegError;
}
