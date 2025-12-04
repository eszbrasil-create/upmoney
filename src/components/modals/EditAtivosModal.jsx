// src/components/modals/EditAtivosModal.jsx — VERSÃO PLANILHA LIMPA (EXCEL STYLE)
import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Trash2, Plus, X } from "lucide-react";
import { supabase } from "../../lib/supabaseClient";

function MesAnoPicker({ value, onChange }) {
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
        className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm rounded-lg transition"
      >
        {value || "Mês/Ano"}
      </button>

      {open && createPortal(
        <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/60" onClick={() => setOpen(false)}>
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <button onClick={() => setAno(a => a - 1)} className="w-10 h-10 hover:bg-gray-100 rounded-full text-xl">←</button>
              <span className="text-2xl font-bold text-emerald-600">{ano}</span>
              <button onClick={() => setAno(a => a + 1)} className="w-10 h-10 hover:bg-gray-100 rounded-full text-xl">→</button>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {meses.map(m => (
                <button
                  key={m}
                  onClick={() => { onChange(`${m}/${ano}`); setOpen(false); }}
                  className={`py-3 rounded-lg font-medium transition ${value?.startsWith(m) ? "bg-emerald-600 text-white" : "hover:bg-gray-100"}`}
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

export default function EditAtivosModal({
  open = false,
  onClose,
  onSave,
  mesAnoInicial = "",
  ativosExistentes = ["Ações", "Renda Fixa", "Cripto", "FIIs", "Caixa", "Poupança"],
}) {
  const [mesAno, setMesAno] = useState(mesAnoInicial);
  const [linhas, setLinhas] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const total = linhas.reduce((acc, l) => acc + (Number(l.valor.replace(/\./g, "").replace(",", ".")) || 0), 0);

  useEffect(() => {
    if (!open) return;
    const hoje = new Date();
    const meses = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    if (!mesAno) setMesAno(`${meses[hoje.getMonth()]}/${hoje.getFullYear()}`);
    if (linhas.length === 0) setLinhas([{ id: "1", nome: "", valor: "" }]);
  }, [open]);

  useEffect(() => {
    if (!open || !mesAno) return;
    const carregar = async () => {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

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
          ? itens.map((i, idx) => ({
              id: String(idx),
              nome: i.nome_ativo,
              valor: Number(i.valor).toLocaleString("pt-BR", { minimumFractionDigits: 2 }),
            }))
          : [{ id: "1", nome: "", valor: "" }]
        );
      }
      setIsLoading(false);
    };
    carregar();
  }, [open, mesAno]);

  const adicionarLinha = () => setLinhas(prev => [...prev, { id: Date.now().toString(), nome: "", valor: "" }]);
  const atualizarLinha = (id, campo, valor) => setLinhas(prev => prev.map(l => l.id === id ? { ...l, [campo]: valor } : l));
  const removerLinha = (id) => setLinhas(prev => prev.filter(l => l.id !== id));

  const salvar = async () => {
    const validos = linhas.filter(l => l.nome.trim() && l.valor.trim());
    if (validos.length === 0) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const totalCalc = validos.reduce((acc, l) => acc + Number(l.valor.replace(/\D/g, "")) / 100, 0);

      const { data: regExistente } = await supabase
        .from("registros_ativos")
        .select("id")
        .eq("user_id", user.id)
        .eq("mes_ano", mesAno)
        .maybeSingle();

      if (regExistente) {
        await supabase.from("registros_ativos_itens").delete().eq("registro_id", regExistente.id);
        await supabase.from("registros_ativos").delete().eq("id", regExistente.id);
      }

      const { data: novo } = await supabase
        .from("registros_ativos")
        .insert({ user_id: user.id, mes_ano: mesAno, total: totalCalc })
        .select()
        .single();

      await supabase.from("registros_ativos_itens").insert(
        validos.map(l => ({
          registro_id: novo.id,
          nome_ativo: l.nome.trim(),
          valor: Number(l.valor.replace(/\D/g, "")) / 100,
        }))
      );

      onSave?.();
      onClose();
    } catch (err) {
      alert("Erro: " + err.message);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[92vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
        
        {/* Header super compacto */}
        <div className="bg-emerald-600 text-white px-6 py-3 flex justify-between items-center">
          <h2 className="text-lg font-bold">Editar Ativos — {mesAno}</h2>
          <button onClick={onClose} className="p-1 hover:bg-white/20 rounded transition">
            <X size={20} />
          </button>
        </div>

        {/* Barra de ferramentas */}
        <div className="bg-gray-50 border-b px-6 py-3 flex items-center justify-between">
          <MesAnoPicker value={mesAno} onChange={setMesAno} />
          <button onClick={adicionarLinha} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition">
            <Plus size={16} /> Nova linha
          </button>
        </div>

        {/* Tabela estilo Excel */}
        <div className="flex-1 overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 sticky top-0">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-700 w-full">Nome do Ativo</th>
                <th className="px-4 py-3 text-right font-medium text-gray-700 w-32">Valor (R$)</th>
                <th className="w-12"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {linhas.map((linha) => (
                <LinhaExcel key={linha.id} linha={linha} onUpdate={atualizarLinha} onRemove={() => removerLinha(linha.id)} ativosExistentes={ativosExistentes} />
              ))}
            </tbody>
          </table>
        </div>

        {/* Rodapé compacto */}
        <div className="bg-gray-50 border-t px-6 py-4 flex justify-between items-center">
          <button
            onClick={() => confirm("Zerar este mês?") && setLinhas([{ id: "1", nome: "", valor: "" }])}
            className="text-red-600 hover:text-red-700 text-sm font-medium flex items-center gap-1"
          >
            <Trash2 size={16} /> Zerar mês
          </button>
          <div className="text-right">
            <div className="text-xs text-gray-600">Total</div>
            <div className="text-2xl font-bold text-emerald-600">
              R$ {total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </div>
          </div>
        </div>

        {/* Botão salvar fixo no canto */}
        <div className="p-4 bg-white border-t">
          <button
            onClick={salvar}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition shadow-lg"
          >
            Salvar Alterações
          </button>
        </div>
      </div>
    </div>
  );
}

function LinhaExcel({ linha, onUpdate, onRemove, ativosExistentes }) {
  const inputRef = useRef(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [query, setQuery] = useState("");

  const sugestoes = useMemo(() => 
    query.trim() ? ativosExistentes.filter(a => a.toLowerCase().includes(query.toLowerCase())).slice(0, 6) : []
  , [query, ativosExistentes]);

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-4 py-3">
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={linha.nome}
            onChange={(e) => { onUpdate(linha.id, "nome", e.target.value); setQuery(e.target.value); setShowDropdown(true); }}
            onFocus={() => setShowDropdown(true)}
            onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
            placeholder="Digite o ativo..."
            className="w-full px-3 py-2 border border-gray-300 rounded focus:border-emerald-500 focus:outline-none"
          />
          {showDropdown && sugestoes.length > 0 && createPortal(
            <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-md shadow-lg z-10 mt-1">
              {sugestoes.map(s => (
                <button key={s} onMouseDown={() => onUpdate(linha.id, "nome", s)} className="block w-full text-left px-3 py-2 hover:bg-emerald-50 text-sm">
                  {s}
                </button>
              ))}
            </div>,
            document.body
          )}
        </div>
      </td>
      <td className="px-4 py-3 text-right">
        <input
          type="text"
          value={linha.valor}
          onChange={(e) => /^[0-9.,]*$/.test(e.target.value) && onUpdate(linha.id, "valor", e.target.value)}
          onBlur={(e) => {
            const num = Number(e.target.value.replace(/\./g, "").replace(",", "."));
            if (!isNaN(num)) onUpdate(linha.id, "valor", num.toLocaleString("pt-BR", { minimumFractionDigits: 2 }));
          }}
          placeholder="0,00"
          className="w-28 px-3 py-2 text-right border border-gray-300 rounded focus:border-emerald-500 focus:outline-none font-medium"
        />
      </td>
      <td className="px-2">
        <button onClick={onRemove} className="p-2 text-red-500 hover:bg-red-50 rounded transition">
          <Trash2 size={16} />
        </button>
      </td>
    </tr>
  );
}