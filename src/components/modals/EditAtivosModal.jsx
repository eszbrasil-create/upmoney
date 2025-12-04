// src/components/modals/EditAtivosModal.jsx
import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Trash2 } from "lucide-react";
import { supabase } from "../../lib/supabaseClient";

/* ---------------------------
   Hook para dropdown flutuante (autocomplete e picker)
---------------------------- */
function useFloatingStyle(ref, offset = 4, direction = "down") {
  const [style, setStyle] = useState({});

  useLayoutEffect(() => {
    function update() {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const ESTIMATED_HEIGHT = 240;
      const spaceAbove = rect.top;
      const spaceBelow = window.innerHeight - rect.bottom;
      const openUp = direction === "up" && spaceAbove > spaceBelow && spaceAbove > ESTIMATED_HEIGHT;

      setStyle({
        position: "absolute",
        top: openUp
          ? rect.top + window.scrollY - ESTIMATED_HEIGHT - offset
          : rect.bottom + window.scrollY + offset,
        left: rect.left + window.scrollX,
        width: Math.max(rect.width, 280),
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
  }, [ref, offset, direction]);

  return style;
}

/* ---------------------------
   MesAnoPicker (abre preferencialmente pra cima, mas adapta)
---------------------------- */
function MesAnoPicker({ value, onChange }) {
  const meses = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  const [mesAtual, anoAtualStr] = String(value || "").split("/");
  const anoInicial = Number(anoAtualStr) || new Date().getFullYear();

  const [open, setOpen] = useState(false);
  const [ano, setAno] = useState(anoInicial);
  const btnRef = useRef(null);
  const dropdownStyle = useFloatingStyle(btnRef, 6, "up"); // prefere up

  useEffect(() => {
    const [, a] = String(value || "").split("/");
    if (a) setAno(Number(a));
  }, [value]);

  useEffect(() => {
    const handler = (e) => {
      if (btnRef.current && !btnRef.current.contains(e.target)) setOpen(false);
    };
    if (open) document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [open]);

  return (
    <>
      <div ref={btnRef}>
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="flex items-center justify-between gap-2 rounded-lg bg-white border border-gray-300 px-3 py-2 text-sm text-gray-800 hover:bg-gray-50 w-full"
        >
          <span>{value || "Mês/Ano"}</span>
          <span className="text-xs">▼</span>
        </button>
      </div>

      {open && createPortal(
        <div style={dropdownStyle} className="rounded-xl border border-gray-300 bg-white shadow-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <button onClick={() => setAno(a => a - 1)} className="w-8 h-8 rounded hover:bg-gray-100">←</button>
            <span className="font-semibold text-gray-800">{ano}</span>
            <button onClick={() => setAno(a => a + 1)} className="w-8 h-8 rounded hover:bg-gray-100">→</button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {meses.map(m => (
              <button
                key={m}
                onClick={() => { onChange(`${m}/${ano}`); setOpen(false); }}
                className={`py-2 px-3 rounded text-sm ${m === mesAtual && ano === anoInicial ? "bg-emerald-500 text-white" : "hover:bg-gray-100 text-gray-800"}`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

/* ---------------------------
   LinhaAtivo
---------------------------- */
function LinhaAtivo({ linha, focoId, setFocoId, sugestoes, selecionarSugestao, atualizarCampo, removerLinha, setQuery, formatPtBr, toNum, onKeyDown }) {
  const nomeRef = useRef(null);
  const valorRef = useRef(null);
  const dropdownStyle = useFloatingStyle(nomeRef, 4, "down");

  const hasNome = linha.nome.trim() !== "";
  const hasValor = linha.valor.trim() !== "";
  const erroValorSemNome = hasValor && !hasNome;

  return (
    <div className={`grid grid-cols-[130px_2fr_1fr_60px] items-center border-b border-gray-200 py-2 ${focoId === linha.id ? "relative z-20 bg-white" : ""}`}>
      <div className="pr-3 border-r border-gray-300">
        <MesAnoPicker value={linha.data} onChange={val => atualizarCampo(linha.id, "data", val)} />
      </div>
      <div className="pr-3 border-r border-gray-300 relative">
        <input
          ref={nomeRef}
          className="w-full bg-transparent px-2 py-1 text-sm text-gray-900 outline-none"
          placeholder="Digite um ativo"
          value={linha.nome}
          onChange={e => { atualizarCampo(linha.id, "nome", e.target.value); setFocoId(linha.id); setQuery(e.target.value); }}
          onFocus={() => setFocoId(linha.id)}
          onBlur={() => setTimeout(() => setFocoId(null), 150)}
          onKeyDown={onKeyDown}
        />
        {focoId === linha.id && sugestoes.length > 0 && createPortal(
          <div style={dropdownStyle} className="bg-white/95 border border-gray-300 rounded-lg shadow-xl max-h-60 overflow-y-auto">
            {sugestoes.map(s => (
              <button key={s} onClick={() => selecionarSugestao(linha.id, s)} className="block w-full text-left px-4 py-2 text-sm text-gray-800 hover:bg-gray-100">
                {s}
              </button>
            ))}
          </div>,
          document.body
        )}
      </div>
      <div className="pl-3 pr-3 border-r border-gray-300">
        <input
          ref={valorRef}
          className={`w-full bg-transparent px-2 py-1 text-sm text-gray-900 outline-none ${erroValorSemNome ? "border-red-500" : ""}`}
          inputMode="decimal"
          placeholder="0,00"
          value={linha.valor}
          onChange={e => {
            const raw = e.target.value.replace(/[^0-9.,]/g, "").replace(".", ",");
            atualizarCampo(linha.id, "valor", raw);
          }}
          onBlur={e => atualizarCampo(linha.id, "valor", formatPtBr(toNum(e.target.value)))}
          onKeyDown={onKeyDown}
        />
        {erroValorSemNome && <p className="text-xs text-red-500">Nome obrigatório</p>}
      </div>
      <div className="flex justify-center">
        <button onClick={() => removerLinha(linha)} className="text-gray-500 hover:text-red-600">
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}

/* ---------------------------
   Modal Principal (Reescrito)
---------------------------- */
export default function EditAtivosModal({
  open,
  onClose,
  onSave,
  ativosExistentes = ["Ações", "Renda Fixa", "Cripto", "FIIs", "Caixa", "Banco", "Viagem", "Cofre"],
  mesAnoInicial,
}) {
  const [visible, setVisible] = useState(open);
  const [user, setUser] = useState(null);
  const [mesAno, setMesAno] = useState(mesAnoInicial || "");
  const [linhas, setLinhas] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [erroGlobal, setErroGlobal] = useState("");
  const [focoId, setFocoId] = useState(null);
  const [query, setQuery] = useState("");

  const toNum = v => Number(String(v).replace(/\./g, "").replace(",", ".")) || 0;
  const formatPtBr = n => Number(n).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const total = useMemo(() => linhas.filter(l => l.nome.trim() && l.valor.trim()).reduce((acc, l) => acc + toNum(l.valor), 0), [linhas]);

  const sugestoes = useMemo(() => {
    if (!query.trim()) return ativosExistentes.slice(0, 8);
    return ativosExistentes.filter(a => a.toLowerCase().includes(query.toLowerCase())).slice(0, 8);
  }, [query, ativosExistentes]);

  // Carrega dados ao abrir
  useEffect(() => {
    if (!visible) return;

    const loadData = async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      setUser(currentUser);

      const hoje = new Date();
      const meses = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
      const defaultMesAno = mesAnoInicial || `${meses[hoje.getMonth()]}/${hoje.getFullYear()}`;
      setMesAno(defaultMesAno);

      if (!currentUser) {
        setLinhas(Array.from({ length: 4 }, () => ({ id: crypto.randomUUID(), data: "", nome: "", valor: "" })));
        return;
      }

      const { data: cabecalho } = await supabase.from("registros_ativos").select("id").eq("user_id", currentUser.id).eq("mes_ano", defaultMesAno).maybeSingle();

      if (cabecalho) {
        const { data: itens } = await supabase.from("registros_ativos_itens").select("nome_ativo, valor").eq("registro_id", cabecalho.id);
        if (itens?.length) {
          setLinhas(itens.map(i => ({ id: crypto.randomUUID(), data: defaultMesAno, nome: i.nome_ativo, valor: formatPtBr(i.valor) })));
          return;
        }
      }

      setLinhas(Array.from({ length: 4 }, () => ({ id: crypto.randomUUID(), data: "", nome: "", valor: "" })));
    };

    loadData();
  }, [visible, mesAnoInicial]);

  // Foco automático na primeira linha vazia
  useEffect(() => {
    if (visible) {
      const firstEmpty = linhas.find(l => !l.nome.trim());
      if (firstEmpty) setFocoId(firstEmpty.id);
    }
  }, [visible, linhas]);

  // Esc fecha modal
  useEffect(() => {
    const handleEsc = e => { if (e.key === "Escape") onClose(); };
    if (visible) document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [visible, onClose]);

  const adicionarLinha = () => setLinhas(prev => [...prev, { id: crypto.randomUUID(), data: mesAno, nome: "", valor: "" }]);

  const removerLinha = linha => {
    setLinhas(prev => {
      const novas = prev.map(l => l.id === linha.id ? { ...l, data: "", nome: "", valor: "" } : l);
      const temConteudo = novas.some(l => l.nome.trim() || l.valor.trim());
      if (!temConteudo) setMesAno("");
      return novas;
    });
  };

  const atualizarCampo = (id, campo, valor) => setLinhas(prev => prev.map(l => l.id === id ? { ...l, [campo]: valor } : l));

  const selecionarSugestao = (id, nome) => {
    atualizarCampo(id, "nome", nome);
    setQuery("");
    setFocoId(null);
  };

  const zerarTudo = () => {
    setLinhas(Array.from({ length: 4 }, () => ({ id: crypto.randomUUID(), data: "", nome: "", valor: "" })));
    setMesAno("");
  };

  const salvar = async () => {
    setIsSaving(true);
    setErroGlobal("");

    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) throw new Error("Usuário não autenticado.");

      const mesAnoAntigo = mesAno || linhas.find(l => l.data.trim())?.data || ""; // Captura mês antigo para deleção
      const itensValidos = linhas.filter(l => l.data.trim() && l.nome.trim() && l.valor.trim());
      const totalCalculado = itensValidos.reduce((acc, l) => acc + toNum(l.valor), 0);
      const novoMesAno = itensValidos[0]?.data || "";

      const { data: existente } = await supabase.from("registros_ativos").select("id").eq("user_id", currentUser.id).eq("mes_ano", mesAnoAntigo).maybeSingle();
      let registroId = existente?.id;

      if (itensValidos.length === 0) {
        if (registroId) {
          await supabase.from("registros_ativos_itens").delete().eq("registro_id", registroId);
          await supabase.from("registros_ativos").delete().eq("id", registroId);
        }
        onSave({ mesAno: mesAnoAntigo, itens: [], total: 0, deleted: true });
        onClose();
        return;
      }

      const agora = new Date().toISOString();

      if (!registroId || mesAnoAntigo !== novoMesAno) {
        const { data: novo } = await supabase.from("registros_ativos").insert({
          user_id: currentUser.id,
          mes_ano: novoMesAno,
          total: totalCalculado,
          created_at: agora,
          atualizado_em: agora,
        }).select("id").single();
        registroId = novo.id;

        if (existente && mesAnoAntigo !== novoMesAno) {
          await supabase.from("registros_ativos_itens").delete().eq("registro_id", existente.id);
          await supabase.from("registros_ativos").delete().eq("id", existente.id);
        }
      } else {
        await supabase.from("registros_ativos").update({ total: totalCalculado, atualizado_em: agora }).eq("id", registroId);
      }

      await supabase.from("registros_ativos_itens").delete().eq("registro_id", registroId);

      const payload = itensValidos.map(l => ({
        registro_id: registroId,
        user_id: currentUser.id,
        nome_ativo: l.nome.trim(),
        valor: toNum(l.valor),
        created_at: agora,
        atualizado_em: agora,
      }));

      await supabase.from("registros_ativos_itens").insert(payload);

      onSave({
        mesAno: novoMesAno,
        itens: itensValidos.map(l => ({ data: l.data, nome: l.nome.trim(), valor: toNum(l.valor) })),
        total: totalCalculado,
        deleted: false,
      });
      onClose();
    } catch (err) {
      setErroGlobal("Erro ao salvar: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyDown = e => {
    if (e.key === "Enter") {
      e.preventDefault();
      adicionarLinha();
    }
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="w-[900px] max-w-full bg-white rounded-xl shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-4 border-b bg-gray-100 rounded-t-xl flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-800">Editar Ativos</h2>
          <button onClick={onClose} className="text-3xl text-gray-500 hover:text-gray-800">×</button>
        </div>
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <span className="text-sm text-gray-500">Organize por mês/ano na primeira coluna.</span>
            <div className="flex gap-4">
              <button onClick={zerarTudo} className="text-red-600 hover:text-red-700 text-sm font-medium">Zerar Tudo</button>
              <button onClick={adicionarLinha} className="text-emerald-600 hover:text-emerald-700 text-sm font-medium">+ Adicionar Linha</button>
            </div>
          </div>
          <div className="grid grid-cols-[130px_2fr_1fr_60px] text-xs font-bold text-gray-600 uppercase mb-2">
            <div>Data (mês/ano)</div>
            <div>Nome do Ativo</div>
            <div className="text-right">Valor</div>
            <div></div>
          </div>
          <div className="max-h-96 overflow-y-auto -mx-6 px-6">
            {linhas.map(l => (
              <LinhaAtivo
                key={l.id}
                linha={l}
                focoId={focoId}
                setFocoId={setFocoId}
                sugestoes={sugestoes}
                selecionarSugestao={selecionarSugestao}
                atualizarCampo={atualizarCampo}
                removerLinha={removerLinha}
                setQuery={setQuery}
                formatPtBr={formatPtBr}
                toNum={toNum}
                onKeyDown={handleKeyDown}
              />
            ))}
          </div>
          <div className="mt-6 pt-4 border-t flex justify-end text-lg font-bold text-emerald-600">
            Total: R$ {total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </div>
          {erroGlobal && <div className="text-red-600 text-sm mt-2">{erroGlobal}</div>}
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t bg-gray-50 rounded-b-xl">
          <button onClick={onClose} disabled={isSaving} className="px-5 py-2 rounded-lg border border-gray-300 hover:bg-gray-100 disabled:opacity-50">Fechar</button>
          <button onClick={salvar} disabled={isSaving} className="px-6 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60">
            {isSaving ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </div>
    </div>
  );
}