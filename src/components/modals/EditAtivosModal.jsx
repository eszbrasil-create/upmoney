// src/components/modals/EditAtivosModal.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Trash2 } from "lucide-react";
import { supabase } from "../../lib/supabaseClient";

/* SELETOR DE MÊS/ANO - TEXTO SEMPRE PRETO FORTE */
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
      {/* BOTÃO PRINCIPAL - VERDE COM TEXTO BRANCO */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="px-12 py-5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-2xl rounded-2xl shadow-2xl transition-all transform hover:scale-105 min-w-72"
      >
        {value || "Selecione o mês"}
      </button>

      {/* CALENDÁRIO - TUDO PRETO FORTE */}
      {open && createPortal(
        <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/70" onClick={() => setOpen(false)}>
          <div
            className="bg-white rounded-3xl shadow-3xl p-10 max-w-md w-full border-4 border-gray-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* ANO */}
            <div className="flex items-center justify-between mb-10">
              <button onClick={() => setAno(a => a - 1)} className="w-16 h-16 hover:bg-gray-100 rounded-full text-4xl font-black text-gray-900">←</button>
              <span className="text-4xl font-black text-gray-900">{ano}</span>
              <button onClick={() => setAno(a => a + 1)} className="w-16 h-16 hover:bg-gray-100 rounded-full text-4xl font-black text-gray-900">→</button>
            </div>

            {/* MESES - PRETO FORTE */}
            <div className="grid grid-cols-3 gap-5">
              {meses.map((m) => (
                <button
                  key={m}
                  onClick={() => {
                    onChange(`${m}/${ano}`);
                    setOpen(false);
                  }}
                  className={`py-8 rounded-3xl font-black text-2xl transition-all transform hover:scale-110 shadow-lg ${
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

/* LINHA DE ATIVO - LETRAS PRETAS FORTES */
function LinhaAtivo({ linha, onUpdate, onRemove, ativosExistentes }) {
  const inputRef = useRef(null);
  const [query, setQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

  const sugestoes = useMemo(() => {
    if (!query.trim()) return [];
    return ativosExistentes
      .filter(a => a.toLowerCase().includes(query.toLowerCase()))
      .slice(0, 10);
  }, [query, ativosExistentes]);

  const dropdownStyle = inputRef.current
    ? {
        position: "fixed",
        top: inputRef.current.getBoundingClientRect().bottom + window.scrollY + 12,
        left: inputRef.current.getBoundingClientRect().left + window.scrollX,
        width: inputRef.current.offsetWidth,
        zIndex: 9999999,
      }
    : {};

  return (
    <div className="grid grid-cols-[2fr_1fr_80px] gap-6 items-center py-5 border-b border-gray-200 last:border-b-0">
      {/* NOME */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          placeholder="Nome do ativo"
          value={linha.nome}
          onChange={(e) => {
            const val = e.target.value;
            onUpdate("nome", val);
            setQuery(val);
            setShowDropdown(true);
          }}
          onFocus={() => query && setShowDropdown(true)}
          onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
          className="w-full px-6 py-5 bg-white border-2 border-gray-300 rounded-2xl focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100 outline-none transition text-black font-bold text-xl placeholder-gray-600"
        />

        {showDropdown && sugestoes.length > 0 && inputRef.current && createPortal(
          <div style={dropdownStyle} className="bg-white border-4 border-gray-300 rounded-2xl shadow-3xl overflow-hidden">
            {sugestoes.map((s) => (
              <button
                key={s}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onUpdate("nome", s);
                  setQuery("");
                  setShowDropdown(false);
                }}
                className="block w-full text-left px-6 py-5 hover:bg-emerald-100 text-black font-bold text-lg transition"
              >
                {s}
              </button>
            ))}
          </div>,
          document.body
        )}
      </div>

      {/* VALOR */}
      <input
        type="text"
        inputMode="decimal"
        placeholder="0,00"
        value={linha.valor}
        onChange={(e) => {
          if (/^[0-9.,]*$/.test(e.target.value)) {
            onUpdate("valor", e.target.value);
          }
        }}
        onBlur={(e) => {
          const num = Number(e.target.value.replace(/\./g, "").replace(",", "."));
          if (!isNaN(num)) {
            onUpdate("valor", num.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
          }
        }}
        className="px-6 py-5 bg-white border-2 border-gray-300 rounded-2xl text-right outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100 transition text-black font-bold text-xl placeholder-gray-600"
      />

      <button onClick={onRemove} className="text-red-600 hover:text-red-800 transition p-3">
        <Trash2 size={32} />
      </button>
    </div>
  );
}

/* MODAL PRINCIPAL */
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
  }, [open, mesAno, linhas.length]);

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
      <div className="bg-white rounded-3xl shadow-3xl w-full max-w-5xl max-h-[94vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="p-10 bg-gradient-to-br from-emerald-50 to-teal-50 flex justify-between items-center border-b-4 border-emerald-200">
          <h2 className="text-4xl font-black text-gray-900">Editar Ativos</h2>
          <button onClick={onClose} className="text-5xl text-gray-500 hover:text-gray-800">×</button>
        </div>

        <div className="p-10 flex-1 overflow-y-auto space-y-8">
          <div className="flex justify-center">
            <MesAnoPickerTopo value={mesAno} onChange={setMesAno} />
          </div>

          {isLoading ? (
            <p className="text-center text-2xl font-bold text-gray-700">Carregando...</p>
          ) : (
            <>
              {linhas.map(linha => (
                <LinhaAtivo
                  key={linha.id}
                  linha={linha}
                  onUpdate={(c, v) => atualizarLinha(linha.id, c, v)}
                  onRemove={() => removerLinha(linha.id)}
                  ativosExistentes={ativosExistentes}
                />
              ))}

              <button
                onClick={adicionarLinha}
                className="w-full py-6 border-4 border-dashed border-emerald-400 bg-emerald-50 text-emerald-700 rounded-3xl text-2xl font-black hover:bg-emerald-100 transition-all transform hover:scale-105"
              >
                + Adicionar novo ativo
              </button>

              <div className="text-right pt-8 border-t-4 border-emerald-200">
                <span className="text-5xl font-black text-emerald-600">
                  Total: R$ {total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </span>
              </div>
            </>
          )}
        </div>

        <div className="p-10 bg-gray-50 border-t-4 border-gray-200 flex justify-between items-center">
          <button onClick={() => { setLinhas([]); salvar(); }} className="text-red-600 hover:text-red-800 font-black text-2xl">
            Zerar Tudo
          </button>
          <div className="flex gap-8">
            <button onClick={onClose} className="px-12 py-5 border-4 border-gray-400 rounded-2xl hover:bg-gray-200 font-black text-xl transition">
              Cancelar
            </button>
            <button onClick={salvar} className="px-16 py-6 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-2xl shadow-2xl transition-all transform hover:scale-105">
              Salvar Alterações
            </button>
          </div>
        </div>

        {erro && <div className="p-6 bg-red-100 text-red-800 text-center font-black text-xl">{erro}</div>}
      </div>
    </div>
  );
}