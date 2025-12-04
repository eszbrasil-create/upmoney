// src/components/modals/EditAtivosModal.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Trash2, Plus, X } from "lucide-react";
import { supabase } from "../../lib/supabaseClient";

/* ============== SELETOR DE MÊS/ANO (mantido, lindo!) ============== */
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
        className="px-10 py-5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xl rounded-2xl shadow-xl transition min-w-64"
      >
        {value || "Selecione o mês"}
      </button>

      {open && createPortal(
        <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/70" onClick={() => setOpen(false)}>
          <div className="bg-white rounded-3xl shadow-3xl p-12 max-w-md w-full border-8 border-gray-100" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-12">
              <button onClick={() => setAno(a => a - 1)} className="w-16 h-16 hover:bg-gray-100 rounded-full text-4xl font-bold">←</button>
              <span className="text-4xl font-black text-emerald-600">{ano}</span>
              <button onClick={() => setAno(a => a + 1)} className="w-16 h-16 hover:bg-gray-100 rounded-full text-4xl font-bold">→</button>
            </div>
            <div className="grid grid-cols-3 gap-6">
              {meses.map((m) => (
                <button
                  key={m}
                  onClick={() => { onChange(`${m}/${ano}`); setOpen(false); }}
                  className={`py-8 rounded-3xl font-bold text-2xl transition-all ${value?.startsWith(m) ? "bg-emerald-600 text-white shadow-xl scale-110" : "bg-gray-50 hover:bg-emerald-100"}`}
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

/* ============== MODAL PRINCIPAL — FAIXAS REDUZIDAS E LINDO ============== */
export default function EditAtivosModal({
  open = false,
  onClose,
  onSave,
  mesAnoInicial = "",
  ativosExistentes = ["Ações", "Renda Fixa", "Cripto", "FIIs", "Caixa", "Banco", "Viagem", "Cofre", "Poupança", "Previdência"],
}) {
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
        { id: crypto.randomUUID(), nome: "", valor: "" },
      ]);
    }
  }, [open]);

  useEffect(() => {
    if (!open || !mesAno) return;
    const carregar = async () => {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setIsLoading(false); return; }

      const { data: reg } = await supabase
        .from("registros_ativos")
        .select("id")
        .eq("user_id", user.id)
        .eq("mes_ano", mesAno)
        .maybeSingle();

      if (reg) {
        const { data: itens } = await supabase
          .from("registros_ativos_itens")
          .select("nome_ativo, valor")
          .eq("registro_id", reg.id);

        setLinhas(itens?.length > 0
          ? itens.map(i => ({
              id: crypto.randomUUID(),
              nome: i.nome_ativo,
              valor: Number(i.valor).toLocaleString("pt-BR", { minimumFractionDigits: 2 }),
            }))
          : [{ id: crypto.randomUUID(), nome: "", valor: "" }]
        );
      }
      setIsLoading(false);
    };
    carregar();
  }, [open, mesAno]);

  const adicionarLinha = () => setLinhas(prev => [...prev, { id: crypto.randomUUID(), nome: "", valor: "" }]);
  const atualizarLinha = (id, campo, valor) => setLinhas(prev => prev.map(l => l.id === id ? { ...l, [campo]: valor } : l));
  const removerLinha = (id) => setLinhas(prev => prev.filter(l => l.id !== id));

  const salvar = async () => {
    if (!mesAno) return setErro("Selecione um mês");
    const itensValidos = linhas.filter(l => l.nome.trim() && l.valor.trim());

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const totalCalc = itensValidos.reduce((acc, l) => acc + (Number(l.valor.replace(/\./g, "").replace(",", ".")) || 0), 0);

      const { data: regExistente } = await supabase
        .from("registros_ativos")
        .select("id")
        .eq("user_id", user.id)
        .eq("mes_ano", mesAno)
        .maybeSingle();

      if (itensValidos.length === 0 && regExistente) {
        await supabase.from("registros_ativos_itens").delete().eq("registro_id", regExistente.id);
        await supabase.from("registros_ativos").delete().eq("id", regExistente.id);
        onSave?.({ mesAno, total: 0, deleted: true });
        onClose();
        return;
      }

      let registroId = regExistente?.id;
      if (!registroId) {
        const { data } = await supabase
          .from("registros_ativos")
          .insert({ user_id: user.id, mes_ano: mesAno, total: totalCalc })
          .select("id")
          .single();
        registroId = data.id;
      } else {
        await supabase.from("registros_ativos").update({ total: totalCalc }).eq("id", registroId);
      }

      await supabase.from("registros_ativos_itens").delete().eq("registro_id", registroId);
      if (itensValidos.length > 0) {
        await supabase.from("registros_ativos_itens").insert(
          itensValidos.map(l => ({
            registro_id: registroId,
            user_id: user.id,
            nome_ativo: l.nome.trim(),
            valor: Number(l.valor.replace(/\./g, "").replace(",", ".")),
          }))
        );
      }

      onSave?.({ mesAno, total: totalCalc, deleted: false });
      onClose();
    } catch (err) {
      setErro("Erro ao salvar: " + err.message);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[9999] flex items-center justify-center p-6" onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-3xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>

        {/* HEADER REDUZIDO */}
        <div className="p-6 bg-emerald-600 text-white flex justify-between items-center">
          <h2 className="text-2xl font-bold">Editar Ativos</h2>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition">
            <X size={28} />
          </button>
        </div>

        {/* MÊS + ADICIONAR */}
        <div className="p-6 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <MesAnoPickerTopo value={mesAno} onChange={setMesAno} />
            <button onClick={adicionarLinha} className="flex items-center gap-3 px-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-lg rounded-2xl shadow-xl transition hover:scale-105">
              <Plus size={28} /> Adicionar ativo
            </button>
          </div>
        </div>

        {/* TABELA */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="bg-white rounded-2xl shadow-inner border border-gray-200">
            <table className="w-full">
              <thead className="bg-gray-100 text-gray-700 font-bold text-lg border-b-2 border-gray-300">
                <tr>
                  <th className="px-8 py-5 text-left">Nome do Ativo</th>
                  <th className="px-8 py-5 text-right">Valor (R$)</th>
                  <th className="w-20"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {isLoading ? (
                  <tr><td colSpan={3} className="text-center py-12 text-gray-500 text-xl">Carregando...</td></tr>
                ) : linhas.map(linha => (
                  <LinhaAtivoSimples key={linha.id} linha={linha} onUpdate={atualizarLinha} onRemove={() => removerLinha(linha.id)} ativosExistentes={ativosExistentes} />
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* RODAPÉ COMPACTO E LINDO */}
        <div className="p-5 bg-gray-50 border-t border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <button onClick={() => { if (confirm("Zerar todos os ativos deste mês?")) { setLinhas([]); salvar(); } }}
                    className="text-red-600 hover:text-red-700 font-medium flex items-center gap-2">
              <Trash2 size={18} /> Zerar este mês
            </button>
            <div className="text-right">
              <div className="text-sm text-gray-600">Total do mês</div>
              <div className="text-3xl font-black text-emerald-600">
                R$ {total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </div>
            </div>
          </div>
          <button onClick={salvar} className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xl font-bold rounded-xl transition shadow-lg">
            Salvar Alterações
          </button>
        </div>

        {erro && <div className="p-5 bg-red-100 text-red-700 text-center font-bold">{erro}</div>}
      </div>
    </div>
  );
}

/* ============== LINHA DA TABELA (com autocompletar) ============== */
function LinhaAtivoSimples({ linha, onUpdate, onRemove, ativosExistentes }) {
  const inputRef = useRef(null);
  const [query, setQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

  const sugestoes = useMemo(() => {
    if (!query.trim()) return [];
    return ativosExistentes.filter(a => a.toLowerCase().includes(query.toLowerCase())).slice(0, 8);
  }, [query, ativosExistentes]);

  return (
    <tr className="hover:bg-gray-50 transition">
      <td className="px-8 py-5">
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={linha.nome}
            onChange={(e) => { onUpdate(linha.id, "nome", e.target.value); setQuery(e.target.value); setShowDropdown(true); }}
            onFocus={() => query && setShowDropdown(true)}
            onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
            placeholder="Ex: Petrobras, Tesouro Selic..."
            className="w-full px-6 py-4 text-lg font-medium bg-white border-2 border-gray-300 rounded-xl focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 outline-none"
          />
          {showDropdown && sugestoes.length > 0 && createPortal(
            <div className="fixed bg-white border-2 border-gray-300 rounded-xl shadow-2xl overflow-hidden z-50" style={{
              top: inputRef.current?.getBoundingClientRect().bottom + window.scrollY + 8,
              left: inputRef.current?.getBoundingClientRect().left + window.scrollX,
              width: inputRef.current?.offsetWidth,
            }}>
              {sugestoes.map(s => (
                <button key={s} onMouseDown={e => e.preventDefault()} onClick={() => { onUpdate(linha.id, "nome", s); setShowDropdown(false); }}
                        className="block w-full text-left px-6 py-4 hover:bg-emerald-50 font-medium">
                  {s}
                </button>
              ))}
            </div>,
            document.body
          )}
        </div>
      </td>
      <td className="px-8 py-5">
        <input
          type="text"
          value={linha.valor}
          onChange={(e) => /^[0-9.,]*$/.test(e.target.value) && onUpdate(linha.id, "valor", e.target.value)}
          onBlur={(e) => {
            const num = Number(e.target.value.replace(/\./g, "").replace(",", "."));
            if (!isNaN(num)) onUpdate(linha.id, "valor", num.toLocaleString("pt-BR", { minimumFractionDigits: 2 }));
          }}
          placeholder="0,00"
          className="w-full px-6 py-4 text-lg font-bold text-right text-emerald-700 bg-white border-2 border-gray-300 rounded-xl focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 outline-none"
        />
      </td>
      <td className="px-6 text-center">
        <button onClick={onRemove} className="p-3 text-red-600 hover:bg-red-50 rounded-full transition">
          <Trash2 size={24} />
        </button>
      </td>
    </tr>
  );
}

/* ============== HELPER PARA DELETAR MÊS ============== */
export async function deleteRegistroAtivosPorMesAno(mesAno) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Usuário não autenticado");

  const { data: regExistente } = await supabase
    .from("registros_ativos")
    .select("id")
    .eq("user_id", user.id)
    .eq("mes_ano", mesAno)
    .maybeSingle();

  if (!regExistente) return;

  await supabase.from("registros_ativos_itens").delete().eq("registro_id", regExistente.id);
  await supabase.from("registros_ativos").delete().eq("id", regExistente.id);
}