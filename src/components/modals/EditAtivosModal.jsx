// src/components/modals/EditAtivosModal.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Trash2 } from "lucide-react";
import { supabase } from "../../lib/supabaseClient";

/* ============== Picker de Mês/Ano no topo ============== */
function MesAnoPickerTopo({ value, onChange }) {
  const meses = [
    "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
    "Jul", "Ago", "Set", "Out", "Nov", "Dez",
  ];
  const [open, setOpen] = useState(false);
  const [ano, setAno] = useState(new Date().getFullYear());

  useEffect(() => {
    const match = value.match(/(\w+)\/(\d{4})/);
    if (match) setAno(Number(match[2]));
  }, [value]);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="px-8 py-4 bg-emerald-600 text-white text-lg font-semibold rounded-xl hover:bg-emerald-700 transition shadow-lg"
      >
        {value || "Selecione o mês"}
      </button>

      {open &&
        createPortal(
          <div
            className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/40"
            onClick={() => setOpen(false)}
          >
            <div
              className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-200"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <button
                  onClick={() => setAno((a) => a - 1)}
                  className="w-12 h-12 rounded-full hover:bg-gray-100 text-2xl"
                >
                  ←
                </button>
                <span className="text-2xl font-bold">{ano}</span>
                <button
                  onClick={() => setAno((a) => a + 1)}
                  className="w-12 h-12 rounded-full hover:bg-gray-100 text-2xl"
                >
                  →
                </button>
              </div>
              <div className="grid grid-cols-3 gap-4">
                {meses.map((m) => (
                  <button
                    key={m}
                    onClick={() => {
                      onChange(`${m}/${ano}`);
                      setOpen(false);
                    }}
                    className={`py-4 px-6 rounded-xl font-medium text-lg transition ${
                      value.startsWith(m)
                        ? "bg-emerald-600 text-white"
                        : "hover:bg-gray-100"
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

/* ============== Linha de Ativo com Autocomplete Visível ============== */
function LinhaAtivo({ linha, onUpdate, onRemove, ativosExistentes }) {
  const inputRef = useRef(null);
  const [query, setQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

  const sugestoes = useMemo(() => {
    if (!query.trim()) return [];
    return ativosExistentes
      .filter((a) => a.toLowerCase().includes(query.toLowerCase()))
      .slice(0, 10);
  }, [query, ativosExistentes]);

  // Posição fixa + z-index altíssimo
  const dropdownStyle = inputRef.current
    ? {
        position: "fixed",
        top:
          inputRef.current.getBoundingClientRect().bottom +
          window.scrollY +
          8,
        left: inputRef.current.getBoundingClientRect().left + window.scrollX,
        width: inputRef.current.offsetWidth,
        zIndex: 999999,
      }
    : {};

  return (
    <div className="grid grid-cols-[2fr_1fr_70px] gap-4 items-center py-3 border-b border-gray-200">
      {/* NOME DO ATIVO */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          placeholder="Nome do ativo"
          value={linha.nome}
          onChange={(e) => {
            onUpdate("nome", e.target.value);
            setQuery(e.target.value);
            setShowDropdown(true);
          }}
          onFocus={() => query && setShowDropdown(true)}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
        />

        {/* Dropdown de sugestões (sempre visível e opaco) */}
        {showDropdown && sugestoes.length > 0 && inputRef.current && createPortal(
          <div
            style={dropdownStyle}
            className="bg-white border-2 border-gray-300 rounded-xl shadow-2xl overflow-hidden"
          >
            {sugestoes.map((s) => (
              <button
                key={s}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onUpdate("nome", s);
                  setQuery("");
                  setShowDropdown(false);
                }}
                className="block w-full text-left px-5 py-3 hover:bg-emerald-50 text-gray-800 font-medium transition"
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
            onUpdate(
              "valor",
              num.toLocaleString("pt-BR", { minimumFractionDigits: 2 })
            );
          }
        }}
        className="px-4 py-3 border border-gray-300 rounded-xl text-right focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
      />

      {/* LIXEIRA */}
      <button
        onClick={onRemove}
        className="text-red-500 hover:text-red-700 transition"
      >
        <Trash2 size={22} />
      </button>
    </div>
  );
}

/* ============== MODAL PRINCIPAL ============== */
export default function EditAtivosModal({
  open = false,
  onClose,
  onSave,
  mesAnoInicial = "",
  ativosExistentes = [
    "Ações", "Renda Fixa", "Cripto", "FIIs", "Caixa", "Banco", "Viagem", "Cofre",
  ],
}) {
  const [mesAno, setMesAno] = useState(mesAnoInicial);
  const [linhas, setLinhas] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [erro, setErro] = useState("");

  // Calcula total
  const total = linhas.reduce((acc, l) => {
    const v = Number(l.valor.replace(/\./g, "").replace(",", ".")) || 0;
    return acc + v;
  }, 0);

  // Carrega dados do mês selecionado
  useEffect(() => {
    if (!open || !mesAno) {
      setLinhas([]);
      return;
    }

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

        setLinhas(
          itens?.length
            ? itens.map((i) => ({
                id: crypto.randomUUID(),
                nome: i.nome_ativo,
                valor: Number(i.valor).toLocaleString("pt-BR", {
                  minimumFractionDigits: 2,
                }),
              }))
            : [{ id: crypto.randomUUID(), nome: "", valor: "" }]
        );
      } else {
        setLinhas([{ id: crypto.randomUUID(), nome: "", valor: "" }]);
      }
      setIsLoading(false);
    };

    carregar();
  }, [open, mesAno]);

  const adicionarLinha = () => {
    setLinhas((prev) => [
      ...prev,
      { id: crypto.randomUUID(), nome: "", valor: "" },
    ]);
  };

  const atualizarLinha = (id, campo, valor) => {
    setLinhas((prev) =>
      prev.map((l) => (l.id === id ? { ...l, [campo]: valor } : l))
    );
  };

  const removerLinha = (id) => {
    setLinhas((prev) => prev.filter((l) => l.id !== id));
  };

  const salvar = async () => {
    if (!mesAno) {
      setErro("Selecione um mês primeiro");
      return;
    }

    const itensValidos = linhas.filter(
      (l) => l.nome.trim() && l.valor.trim()
    );

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const totalCalc = itensValidos.reduce(
        (acc, l) =>
          acc +
          (Number(l.valor.replace(/\./g, "").replace(",", ".")) || 0),
        0
      );

      // Busca registro existente
      const { data: regExistente } = await supabase
        .from("registros_ativos")
        .select("id")
        .eq("user_id", user.id)
        .eq("mes_ano", mesAno)
        .maybeSingle();

      if (itensValidos.length === 0) {
        // DELETA TUDO
        if (regExistente) {
          await supabase
            .from("registros_ativos_itens")
            .delete()
            .eq("registro_id", regExistente.id);
          await supabase
            .from("registros_ativos")
            .delete()
            .eq("id", regExistente.id);
        }
        onSave({ mesAno, deleted: true, total: 0 });
        onClose();
        return;
      }

      let registroId = regExistente?.id;

      // Cria novo se não existir
      if (!registroId) {
        const { data } = await supabase
          .from("registros_ativos")
          .insert({
            user_id: user.id,
            mes_ano: mesAno,
            total: totalCalc,
          })
          .select("id")
          .single();
        registroId = data.id;
      } else {
        await supabase
          .from("registros_ativos")
          .update({ total: totalCalc })
          .eq("id", registroId);
      }

      // Limpa itens antigos e insere novos
      await supabase
        .from("registros_ativos_itens")
        .delete()
        .eq("registro_id", registroId);

      await supabase.from("registros_ativos_itens").insert(
        itensValidos.map((l) => ({
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
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b bg-gray-50 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">Editar Ativos</h2>
          <button
            onClick={onClose}
            className="text-3xl text-gray-500 hover:text-gray-800"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className="p-8 flex-1 overflow-y-auto">
          <div className="flex justify-center mb-8">
            <MesAnoPickerTopo value={mesAno} onChange={setMesAno} />
          </div>

          {!mesAno ? (
            <div className="text-center py-20 text-gray-500">
              <p className="text-xl">Selecione o mês acima para começar</p>
            </div>
          ) : isLoading ? (
            <p className="text-center">Carregando...</p>
          ) : (
            <>
              {linhas.map((linha) => (
                <LinhaAtivo
                  key={linha.id}
                  linha={linha}
                  onUpdate={(campo, valor) =>
                    atualizarLinha(linha.id, campo, valor)
                  }
                  onRemove={() => removerLinha(linha.id)}
                  ativosExistentes={ativosExistentes}
                />
              ))}

              <button
                onClick={adicionarLinha}
                className="w-full mt-6 py-4 border-2 border-dashed border-emerald-500 text-emerald-600 rounded-xl text-lg font-medium hover:bg-emerald-50 transition"
              >
                + Adicionar novo ativo
              </button>

              <div className="mt-8 text-right">
                <span className="text-3xl font-bold text-emerald-600">
                  Total: R${" "}
                  {total.toLocaleString("pt-BR", {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t bg-gray-50 flex justify-between items-center">
          <button
            onClick={() => {
              setLinhas([]);
              salvar();
            }}
            className="text-red-600 hover:text-red-700 font-semibold text-lg"
          >
            Zerar Tudo
          </button>

          <div className="flex gap-4">
            <button
              onClick={onClose}
              className="px-8 py-4 border border-gray-300 rounded-xl hover:bg-gray-100 font-medium"
            >
              Cancelar
            </button>
            <button
              onClick={salvar}
              disabled={!mesAno || isLoading}
              className="px-10 py-4 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:opacity-50 font-semibold text-lg"
            >
              Salvar Alterações
            </button>
          </div>
        </div>

        {erro && (
          <div className="p-4 bg-red-100 text-red-700 text-center font-medium">
            {erro}
          </div>
        )}
      </div>
    </div>
  );
}