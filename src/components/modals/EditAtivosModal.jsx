// src/components/modals/EditAtivosModal.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Trash2 } from "lucide-react";
import { supabase } from "../../lib/supabaseClient";

// Picker de mês/ano único no topo
function MesAnoPickerTopo({ value, onChange }) {
  const meses = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  const [open, setOpen] = useState(false);
  const [ano, setAno] = useState(new Date().getFullYear());
  const btnRef = useRef(null);

  const [mesSelecionado] = value.split("/");

  useEffect(() => {
    const match = value.match(/(\w+)\/(\d{4})/);
    if (match) setAno(Number(match[2]));
  }, [value]);

  return (
    <div className="relative" ref={btnRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="px-6 py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition shadow-md"
      >
        {value || "Selecione o mês"}
      </button>

      {open && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={() => setOpen(false)}>
          <div className="bg-white rounded-xl shadow-2xl p-6 border border-gray-200" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <button onClick={() => setAno(a => a - 1)} className="w-10 h-10 hover:bg-gray-100 rounded">←</button>
              <span className="text-xl font-bold">{ano}</span>
              <button onClick={() => setAno(a => a + 1)} className="w-10 h-10 hover:bg-gray-100 rounded">→</button>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {meses.map(m => (
                <button
                  key={m}
                  onClick={() => {
                    onChange(`${m}/${ano}`);
                    setOpen(false);
                  }}
                  className={`py-3 px-4 rounded-lg font-medium transition ${
                    m === mesSelecionado ? "bg-emerald-600 text-white" : "hover:bg-gray-100"
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

// Hook simples para autocomplete
function useFloatingDropdown(ref) {
  const [style, setStyle] = useState({});
  useEffect(() => {
    const update = () => {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      setStyle({
        position: "absolute",
        top: rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX,
        width: rect.width,
        zIndex: 9999,
      });
    };
    update();
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [ref]);
  return style;
}

function LinhaAtivo({ linha, onUpdate, onRemove, sugestoes, ativosExistentes }) {
  const inputRef = useRef(null);
  const dropdownStyle = useFloatingDropdown(inputRef);
  const [query, setQuery] = useState("");

  const sugestoesFiltradas = useMemo(() => {
    if (!query.trim()) return ativosExistentes.slice(0, 8);
    return ativosExistentes
      .filter(a => a.toLowerCase().includes(query.toLowerCase()))
      .slice(0, 8);
  }, [query, ativosExistentes]);

  return (
    <div className="grid grid-cols-[2fr_1fr_60px] gap-4 items-center py-3 border-b border-gray-200">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          placeholder="Nome do ativo"
          value={linha.nome}
          onChange={e => {
            onUpdate("nome", e.target.value);
            setQuery(e.target.value);
          }}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-emerald-500"
        />
        {sugestoesFiltradas.length > 0 && query && (
          createPortal(
            <div style={dropdownStyle} className="bg-white border border-gray-300 rounded-lg shadow-xl max-h-60 overflow-y-auto">
              {sugestoesFiltradas.map(s => (
                <button
                  key={s}
                  onClick={() => {
                    onUpdate("nome", s);
                    setQuery("");
                  }}
                  className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-sm"
                >
                  {s}
                </button>
              ))}
            </div>,
            document.body
          )
        )}
      </div>

      <input
        type="text"
        inputMode="decimal"
        placeholder="0,00"
        value={linha.valor}
        onChange={e => {
          if (/^[0-9.,]*$/.test(e.target.value)) {
            onUpdate("valor", e.target.value);
          }
        }}
        onBlur={e => {
          const num = Number(e.target.value.replace(/\./g, "").replace(",", "."));
          if (!isNaN(num)) onUpdate("valor", num.toLocaleString("pt-BR", { minimumFractionDigits: 2 }));
        }}
        className="px-3 py-2 border border-gray-300 rounded-lg text-right focus:outline-none focus:border-emerald-500"
      />

      <button onClick={onRemove} className="text-red-500 hover:text-red-700">
        <Trash2 size={18} />
      </button>
    </div>
  );
}

export default function EditAtivosModal({
  open = false,
  onClose,
  onSave,
  mesAnoInicial,
  ativosExistentes = ["Ações", "Renda Fixa", "Cripto", "FIIs", "Caixa", "Banco", "Viagem", "Cofre"],
}) {
  const [mesAno, setMesAno] = useState(mesAnoInicial || "");
  const [linhas, setLinhas] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [erro, setErro] = useState("");

  const total = linhas.reduce((acc, l) => acc + (Number(l.valor.replace(/\./g, "").replace(",", ".")) || 0), 0);

  // Carrega dados do mês selecionado
  useEffect(() => {
    if (!open || !mesAno) return;

    const carregar = async () => {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("registros_ativos")
        .select("id")
        .eq("user_id", user.id)
        .eq("mes_ano", mesAno)
        .maybeSingle();

      if (data) {
        const { data: itens } = await supabase
          .from("registros_ativos_itens")
          .select("nome_ativo, valor")
          .eq("registro_id", data.id);

        setLinhas(itens?.map(i => ({
          id: crypto.randomUUID(),
          nome: i.nome_ativo,
          valor: Number(i.valor).toLocaleString("pt-BR", { minimumFractionDigits: 2 })
        })) || []);
      } else {
        setLinhas([{ id: crypto.randomUUID(), nome: "", valor: "" }]);
      }
      setIsLoading(false);
    };

    carregar();
  }, [open, mesAno]);

  const adicionarLinha = () => {
    setLinhas(prev => [...prev, { id: crypto.randomUUID(), nome: "", valor: "" }]);
  };

  const atualizarLinha = (id, campo, valor) => {
    setLinhas(prev => prev.map(l => l.id === id ? { ...l, [campo]: valor } : l));
  };

  const removerLinha = (id) => {
    setLinhas(prev => prev.filter(l => l.id !== id));
  };

  const salvar = async () => {
    if (!mesAno) {
      setErro("Selecione um mês primeiro");
      return;
    }

    const itensValidos = linhas.filter(l => l.nome.trim() && l.valor.trim());

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");

      // Busca registro existente
      const { data: registro } = await supabase
        .from("registros_ativos")
        .select("id")
        .eq("user_id", user.id)
        .eq("mes_ano", mesAno)
        .maybeSingle();

      const totalCalc = itensValidos.reduce((acc, l) => acc + (Number(l.valor.replace(/\./g, "").replace(",", ".")) || 0), 0);

      if (itensValidos.length === 0) {
        // Deleta tudo
        if (registro) {
          await supabase.from("registros_ativos_itens").delete().eq("registro_id", registro.id);
          await supabase.from("registros_ativos").delete().eq("id", registro.id);
        }
        onSave({ mesAno, deleted: true, total: 0 });
        onClose();
        return;
      }

      // Cria ou atualiza
      let registroId = registro?.id;
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

      // Limpa e insere itens
      await supabase.from("registros_ativos_itens").delete().eq("registro_id", registroId);
      await supabase.from("registros_ativos_itens").insert(
        itensValidos.map(l => ({
          registro_id: registroId,
          user_id: user.id,
          nome_ativo: l.nome.trim(),
          valor: Number(l.valor.replace(/\./g, "").replace(",", ".")),
        }))
      );

      onSave({ mesAno, total: totalCalc, deleted: false });
      onClose();
    } catch (err) {
      setErro("Erro ao salvar: " + err.message);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b bg-gray-50">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-800">Editar Ativos</h2>
            <button onClick={onClose} className="text-3xl text-gray-500 hover:text-gray-800">×</button>
          </div>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto max-h-[70vh]">
          <div className="flex justify-center">
            <MesAnoPickerTopo value={mesAno} onChange={setMesAno} />
          </div>

          {!mesAno ? (
            <div className="text-center text-gray-500 py-12">
              <p className="text-lg">Selecione o mês acima para começar</p>
            </div>
          ) : isLoading ? (
            <p>Carregando...</p>
          ) : (
            <>
              {linhas.map(linha => (
                <LinhaAtivo
                  key={linha.id}
                  linha={linha}
                  onUpdate={(campo, valor) => atualizarLinha(linha.id, campo, valor)}
                  onRemove={() => removerLinha(linha.id)}
                  sugestoes={[]}
                  ativosExistentes={ativosExistentes}
                />
              ))}

              <button
                onClick={adicionarLinha}
                className="w-full py-3 border-2 border-dashed border-emerald-500 text-emerald-600 rounded-lg hover:bg-emerald-50 transition"
              >
                + Adicionar ativo
              </button>

              <div className="text-right text-2xl font-bold text-emerald-600">
                Total: R$ {total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </div>
            </>
          )}
        </div>

        <div className="p-6 border-t bg-gray-50 flex justify-between items-center">
          <button
            onClick={() => { setLinhas([]); salvar(); }}
            className="text-red-600 hover:text-red-700 font-medium"
          >
            Zerar Tudo
          </button>

          <div className="flex gap-3">
            <button onClick={onClose} className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-100">
              Cancelar
            </button>
            <button
              onClick={salvar}
              disabled={!mesAno || isLoading}
              className="px-8 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
            >
              Salvar Alterações
            </button>
          </div>
        </div>

        {erro && <div className="p-4 bg-red-100 text-red-700 text-center">{erro}</div>}
      </div>
    </div>
  );
}