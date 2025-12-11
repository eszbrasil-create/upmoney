// src/components/modals/EditAtivosModal.jsx — LAYOUT PLANILHA SUPER COMPACTO
import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Trash2, Plus, X } from "lucide-react";
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
        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-lg shadow transition min-w-[130px]"
      >
        {value || "Selecione o mês"}
      </button>

      {open &&
        createPortal(
          <div
            className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/70"
            onClick={() => setOpen(false)}
          >
            <div
              className="bg-white rounded-3xl shadow-3xl p-8 max-w-md w-full border-8 border-gray-100"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Ano + setas */}
              <div className="flex items-center justify-between mb-8">
                <button
                  onClick={() => setAno((a) => a - 1)}
                  className="w-10 h-10 hover:bg-gray-100 rounded-full text-2xl font-bold text-emerald-700"
                >
                  ←
                </button>
                <span className="text-2xl font-black text-emerald-600">{ano}</span>
                <button
                  onClick={() => setAno((a) => a + 1)}
                  className="w-10 h-10 hover:bg-gray-100 rounded-full text-2xl font-bold text-emerald-700"
                >
                  →
                </button>
              </div>

              {/* Meses */}
              <div className="grid grid-cols-3 gap-3">
                {meses.map((m) => {
                  const selecionado = value?.startsWith(m);
                  return (
                    <button
                      key={m}
                      onClick={() => {
                        onChange(`${m}/${ano}`);
                        setOpen(false);
                      }}
                      className={
                        selecionado
                          ? "py-3 rounded-2xl font-semibold text-base transition-all bg-emerald-600 text-white shadow-xl scale-105"
                          : "py-3 rounded-2xl font-semibold text-base transition-all bg-white text-emerald-700 border border-emerald-50 hover:bg-emerald-50 hover:border-emerald-200"
                      }
                    >
                      {m}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>,
          document.body
        )}
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
    "Ações",
    "Renda Fixa",
    "Cripto",
    "FIIs",
    "Caixa",
    "Banco",
    "Viagem",
    "Cofre",
    "Poupança",
    "Previdência",
  ],
}) {
  const mesesAbrev = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

  const [mesAno, setMesAno] = useState(mesAnoInicial);
  const [linhas, setLinhas] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [erro, setErro] = useState("");

  const total = linhas.reduce(
    (acc, l) => acc + (Number(l.valor.replace(/\./g, "").replace(",", ".")) || 0),
    0
  );

  // Ao abrir modal: define mês atual (se não tiver) e cria UMA linha virgem
  useEffect(() => {
    if (!open) return;
    const hoje = new Date();
    if (!mesAno) setMesAno(`${mesesAbrev[hoje.getMonth()]}/${hoje.getFullYear()}`);
    setLinhas([{ id: crypto.randomUUID(), nome: "", valor: "" }]);
    setErro("");
  }, [open]);

  // Ao trocar o mês manualmente: sempre reseta para UMA linha virgem
  useEffect(() => {
    if (!open || !mesAno) return;
    setLinhas([{ id: crypto.randomUUID(), nome: "", valor: "" }]);
    setErro("");
  }, [mesAno, open]);

  const adicionarLinha = () =>
    setLinhas((prev) => [...prev, { id: crypto.randomUUID(), nome: "", valor: "" }]);

  const atualizarLinha = (id, campo, valor) =>
    setLinhas((prev) => prev.map((l) => (l.id === id ? { ...l, [campo]: valor } : l)));

  const removerLinha = (id) =>
    setLinhas((prev) => prev.filter((l) => l.id !== id));

  // helper para converter "Jan/2025" -> chave numérica
  const parseMesAnoKey = (mesAnoStr) => {
    if (!mesAnoStr) return null;
    const [mStr, anoStr] = mesAnoStr.split("/");
    const idx = mesesAbrev.indexOf(mStr);
    if (idx === -1) return null;
    const anoNum = Number(anoStr);
    if (Number.isNaN(anoNum)) return null;
    return anoNum * 12 + idx; // ano * 12 + indiceMes
  };

  // Copiar "mês anterior"
  const copiarMesAnterior = async () => {
    if (!mesAno) {
      setErro("Selecione um mês para copiar.");
      return;
    }

    try {
      setIsLoading(true);
      setErro("");

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setIsLoading(false);
        setErro("Usuário não autenticado.");
        return;
      }

      const { data: regs, error } = await supabase
        .from("registros_ativos")
        .select("id, mes_ano")
        .eq("user_id", user.id);

      if (error) throw error;

      if (!regs || regs.length === 0) {
        setIsLoading(false);
        setErro("Você ainda não possui nenhum mês salvo para copiar.");
        return;
      }

      const keyAtual = parseMesAnoKey(mesAno);

      let candidatos = regs
        .map((r) => ({
          ...r,
          key: parseMesAnoKey(r.mes_ano),
        }))
        .filter((r) => r.key !== null);

      if (candidatos.length === 0) {
        setIsLoading(false);
        setErro("Não foi possível interpretar as datas salvas para copiar.");
        return;
      }

      if (keyAtual !== null) {
        const anteriores = candidatos.filter((r) => r.key < keyAtual);
        if (anteriores.length > 0) {
          candidatos = anteriores;
        }
      }

      candidatos.sort((a, b) => b.key - a.key);
      const regEscolhido = candidatos[0];

      const { data: itens, error: itensError } = await supabase
        .from("registros_ativos_itens")
        .select("nome_ativo, valor")
        .eq("registro_id", regEscolhido.id);

      if (itensError) throw itensError;

      if (!itens || itens.length === 0) {
        setIsLoading(false);
        setErro(`Nenhum item encontrado em ${regEscolhido.mes_ano} para copiar.`);
        return;
      }

      setLinhas(
        itens.map((i) => ({
          id: crypto.randomUUID(),
          nome: i.nome_ativo,
          valor: Number(i.valor).toLocaleString("pt-BR", {
            minimumFractionDigits: 2,
          }),
        }))
      );

      setIsLoading(false);
    } catch (err) {
      setIsLoading(false);
      setErro("Erro ao copiar mês anterior: " + err.message);
    }
  };

  // 🔧 AQUI É ONDE ESTAVA O PROBLEMA: SALVAR SOBRESCREVIA TUDO
  const salvar = async () => {
    if (!mesAno) return setErro("Selecione um mês.");
    setErro("");

    const linhasParciais = linhas.filter((l) => {
      const nomeOk = l.nome.trim() !== "";
      const valorOk = l.valor.trim() !== "";
      return (nomeOk && !valorOk) || (!nomeOk && valorOk);
    });

    if (linhasParciais.length > 0) {
      setErro(
        "Preencha NOME DO ATIVO e VALOR em todas as linhas usadas ou apague as linhas incompletas."
      );
      return;
    }

    const itensValidos = linhas.filter((l) => l.nome.trim() && l.valor.trim());

    if (itensValidos.length === 0) {
      setErro("Adicione pelo menos um ativo com nome e valor para salvar o registro.");
      return;
    }

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      // 1) Busca (ou cria) o registro do mês
      const { data: regExistente } = await supabase
        .from("registros_ativos")
        .select("id")
        .eq("user_id", user.id)
        .eq("mes_ano", mesAno)
        .maybeSingle();

      let registroId = regExistente?.id;
      if (!registroId) {
        // cria registro "casca" com total 0 por enquanto
        const { data } = await supabase
          .from("registros_ativos")
          .insert({ user_id: user.id, mes_ano: mesAno, total: 0 })
          .select("id")
          .single();
        registroId = data.id;
      }

      // 2) Carrega itens antigos do mês (se houver)
      const { data: itensAntigos } = await supabase
        .from("registros_ativos_itens")
        .select("nome_ativo, valor")
        .eq("registro_id", registroId);

      // 3) Monta um mapa nome_ativo -> valor a partir do que já existia
      const mapa = new Map();

      if (Array.isArray(itensAntigos)) {
        for (const it of itensAntigos) {
          const nome = String(it.nome_ativo || "").trim();
          if (!nome) continue;
          const valNum = Number(it.valor) || 0;
          mapa.set(nome, valNum);
        }
      }

      // 4) Aplica os itens novos/atuais: substitui se já existe, adiciona se for novo
      for (const l of itensValidos) {
        const nome = l.nome.trim();
        const valNum =
          Number(l.valor.replace(/\./g, "").replace(",", ".")) || 0;
        if (!nome) continue;
        mapa.set(nome, valNum); // sobrescreve o valor anterior deste ativo
      }

      // 5) Constrói lista final de itens a salvar
      const itensFinais = Array.from(mapa.entries()).map(([nome_ativo, valor]) => ({
        registro_id: registroId,
        user_id: user.id,
        nome_ativo,
        valor,
      }));

      // 6) Recalcula o total com base em TODOS os ativos (antigos + novos mesclados)
      const totalCalc = itensFinais.reduce((acc, it) => acc + (Number(it.valor) || 0), 0);

      // 7) Atualiza total no registro principal
      await supabase
        .from("registros_ativos")
        .update({ total: totalCalc })
        .eq("id", registroId);

      // 8) Sobrescreve itens do mês com a lista mesclada
      await supabase
        .from("registros_ativos_itens")
        .delete()
        .eq("registro_id", registroId);

      await supabase.from("registros_ativos_itens").insert(itensFinais);

      onSave?.({ mesAno, total: totalCalc, deleted: false });
      onClose();
    } catch (err) {
      setErro("Erro ao salvar: " + err.message);
    }
  };

  const zerarMes = async () => {
    if (!mesAno) {
      setErro("Selecione um mês para zerar.");
      return;
    }
    const confirmar = window.confirm("Zerar todos os ativos deste mês?");
    if (!confirmar) return;

    try {
      setErro("");
      await deleteRegistroAtivosPorMesAno(mesAno);
      setLinhas([{ id: crypto.randomUUID(), nome: "", valor: "" }]);
      onSave?.({ mesAno, total: 0, deleted: true });
      onClose();
    } catch (err) {
      setErro("Erro ao zerar mês: " + err.message);
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-md z-[9999] flex items-center justifycenter p-6"
      onClick={onClose}
    >
      <div
        className="bg-transparent w-full max-w-5xl max-h-[90vh] flex flex-col mx-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-white rounded-3xl shadow-3xl border border-gray-300 overflow-hidden flex flex-col relative">
          {/* Botão fechar */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-gray-100 text-gray-500"
          >
            <X size={20} />
          </button>

          {/* Linha 1 - Título */}
          <div className="bg-gray-200 px-8 py-2 border-b border-gray-300">
            <h2 className="text-lg font-bold text-gray-800 text-center">Editar Ativos</h2>
          </div>

          {/* Linha 2 - Mês/Ano + Copiar + Adicionar */}
          <div className="px-8 py-1 bg-white border-b border-gray-300">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-gray-700 whitespace-nowrap text-sm">
                  Mês-Ano:
                </span>
                <MesAnoPickerTopo value={mesAno} onChange={setMesAno} />
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={copiarMesAnterior}
                  className="px-4 py-2 border border-emerald-600 text-emerald-700 hover:bg-emerald-50 font-semibold text-xs rounded-lg transition"
                >
                  Copiar mês anterior
                </button>
                <button
                  onClick={adicionarLinha}
                  className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-lg shadow transition"
                >
                  <Plus size={16} /> Adicionar ativo
                </button>
              </div>
            </div>
          </div>

          {/* Linha 3 - Tabela */}
          <div className="px-8 py-2 bg-white flex-1 max-h-[50vh] overflow-y-auto">
            <div className="border border-gray-300 rounded-2xl overflow-hidden">
              <table className="w-full border-collapse">
                <thead className="bg-gray-100 text-gray-700 font-semibold text-xs border-b border-gray-300">
                  <tr>
                    <th className="px-3 py-2 text-left">Nome do Ativo</th>
                    <th className="px-3 py-2 text-right">Valor (R$)</th>
                    <th className="px-3 py-2 w-12 text-center">Lixeira</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {isLoading ? (
                    <tr>
                      <td
                        colSpan={3}
                        className="text-center py-8 text-gray-500 text-xs font-medium"
                      >
                        Carregando dados...
                      </td>
                    </tr>
                  ) : linhas.length === 0 ? (
                    <tr>
                      <td
                        colSpan={3}
                        className="text-center py-8 text-gray-400 text-xs font-medium"
                      >
                        Nenhum ativo adicionado
                      </td>
                    </tr>
                  ) : (
                    linhas.map((linha) => (
                      <LinhaAtivoSimples
                        key={linha.id}
                        linha={linha}
                        onUpdate={(c, v) => atualizarLinha(linha.id, c, v)}
                        onRemove={() => removerLinha(linha.id)}
                        ativosExistentes={ativosExistentes}
                      />
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Linha 4 - Zerar + Total */}
          <div className="px-8 py-1 bg-white border-t border-gray-300 flex items-center justify-between flex-wrap gap-2">
            <button
              onClick={zerarMes}
              className="text-red-600 hover:text-red-700 font-semibold text-xs flex items-center gap-1.5"
            >
              <Trash2 size={14} /> Zerar este mês
            </button>
            <div className="text-right">
              <div className="text-[10px] text-gray-600 uppercase tracking-wide">
                Total do mês
              </div>
              <div className="text-xl font-bold text-emerald-700">
                R$ {total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </div>
            </div>
          </div>

          {/* Linha 5 - Salvar Alterações */}
          <div className="px-8 pb-3 pt-1 bg-white border-t border-gray-300">
            <button
              onClick={salvar}
              className="w-full px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-lg shadow transition"
            >
              Salvar Alterações
            </button>
          </div>
        </div>

        {erro && (
          <div className="mt-2 p-3 bg-red-100 text-red-700 text-center font-semibold text-xs rounded-2xl shadow">
            {erro}
          </div>
        )}
      </div>
    </div>
  );
}

/* ============== LINHA DA TABELA ============== */
function LinhaAtivoSimples({ linha, onUpdate, onRemove, ativosExistentes }) {
  const inputRef = useRef(null);
  const [query, setQuery] = useState(linha.nome || "");
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    setQuery(linha.nome || "");
  }, [linha.nome]);

  const sugestoes = useMemo(() => {
    if (!ativosExistentes || ativosExistentes.length === 0) return [];
    if (!query.trim()) {
      return ativosExistentes.slice(0, 8);
    }
    return ativosExistentes
      .filter((a) => a.toLowerCase().includes(query.toLowerCase()))
      .slice(0, 8);
  }, [query, ativosExistentes]);

  return (
    <tr className="hover:bg-gray-50 transition">
      <td className="px-3 py-2">
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={linha.nome}
            onChange={(e) => {
              onUpdate("nome", e.target.value);
              setQuery(e.target.value);
              setShowDropdown(true);
            }}
            onFocus={() => setShowDropdown(true)}
            onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
            placeholder="Ex: Petrobras, Tesouro Selic..."
            className="w-full px-3 py-1.5 text-xs font-medium text-gray-800 bg-white border border-gray-300 rounded-md focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none"
          />
          {showDropdown &&
            sugestoes.length > 0 &&
            createPortal(
              <div
                className="fixed bg-white border-2 border-gray-300 rounded-xl shadow-2xl overflow-hidden z-[9999] text-emerald-700"
                style={{
                  top: inputRef.current?.getBoundingClientRect().bottom + window.scrollY + 8,
                  left: inputRef.current?.getBoundingClientRect().left + window.scrollX,
                  width: inputRef.current?.offsetWidth,
                }}
              >
                {sugestoes.map((s) => (
                  <button
                    key={s}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      onUpdate("nome", s);
                      setQuery(s);
                      setShowDropdown(false);
                    }}
                    className="block w-full text-left px-3 py-1.5 hover:bg-emerald-50 text-xs font-medium text-emerald-700"
                  >
                    {s}
                  </button>
                ))}
              </div>,
              document.body
            )}
        </div>
      </td>
      <td className="px-3 py-2">
        <input
          type="text"
          value={linha.valor}
          onChange={(e) => /^[0-9.,]*$/.test(e.target.value) && onUpdate("valor", e.target.value)}
          onBlur={(e) => {
            const num = Number(e.target.value.replace(/\./g, "").replace(",", "."));
            if (!isNaN(num)) {
              onUpdate(
                "valor",
                num.toLocaleString("pt-BR", { minimumFractionDigits: 2 })
              );
            }
          }}
          placeholder="0,00"
          className="w-full px-3 py-1.5 text-xs font-bold text-right text-emerald-700 bg-white border border-gray-300 rounded-md focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none"
        />
      </td>
      <td className="px-3 py-2 text-center">
        <button
          onClick={onRemove}
          className="p-1.5 text-red-600 hover:bg-red-50 rounded-full transition"
        >
          <Trash2 size={14} />
        </button>
      </td>
    </tr>
  );
}

/* ============== HELPER PARA DELETAR MÊS ============== */
export async function deleteRegistroAtivosPorMesAno(mesAno) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
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
