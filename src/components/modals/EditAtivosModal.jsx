// src/components/modals/EditAtivosModal.jsx
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
        <button onClick={() => removerLinha(linha)} className="text-gray-500 hover:text-red-600">
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}

/* ---------------------------
   MODAL PRINCIPAL – BUG DO MÊS FANTASMA 100% MORTO
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
  const [registroId, setRegistroId] = useState(null);

  const toNum = (v) => Number(String(v).replace(/\./g, "").replace(",", ".")) || 0;
  const formatPtBr = (n) => Number(n).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const total = linhas.reduce((acc, l) => acc + toNum(l.valor), 0);

  const sugestoes = useMemo(() => {
    if (!query.trim()) return ativosExistentes.slice(0, 8);
    return ativosExistentes
      .filter((a) => a.toLowerCase().includes(query.toLowerCase()))
      .slice(0, 8);
  }, [query, ativosExistentes]);

  const criarLinhasVazias = () => ([
    { id: crypto.randomUUID(), nome: "", valor: "" },
    { id: crypto.randomUUID(), nome: "", valor: "" },
    { id: crypto.randomUUID(), nome: "", valor: "" },
    { id: crypto.randomUUID(), nome: "", valor: "" },
  ]);

  // CARREGA DADOS AO ABRIR E QUANDO MÊS MUDA
  useEffect(() => {
    if (!visible) return;

    const carregarDados = async () => {
      // Garante usuário
      let currentUser = user;
      if (!currentUser) {
        const { data } = await supabase.auth.getUser();
        currentUser = data?.user || null;
        setUser(currentUser);
      }

      const hoje = new Date();
      const meses = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
      const mesAnoPadrao =
        mesAnoInicial || `${meses[hoje.getMonth()]}/${hoje.getFullYear()}`;

      // Se ainda não temos mesAno, define o padrão
      const mesRef = mesAno || mesAnoPadrao;
      if (!mesAno) setMesAno(mesRef);

      if (!currentUser) {
        setRegistroId(null);
        setLinhas(criarLinhasVazias());
        return;
      }

      const { data: cabecalho } = await supabase
        .from("registros_ativos")
        .select("id")
        .eq("user_id", currentUser.id)
        .eq("mes_ano", mesRef)
        .maybeSingle();

      if (cabecalho) {
        setRegistroId(cabecalho.id);

        const { data: itens } = await supabase
          .from("registros_ativos_itens")
          .select("nome_ativo, valor")
          .eq("registro_id", cabecalho.id);

        if (itens?.length > 0) {
          setLinhas(
            itens.map((i) => ({
              id: crypto.randomUUID(),
              nome: i.nome_ativo,
              valor: formatPtBr(i.valor),
            }))
          );
          return;
        }

        // Cabeçalho existe mas sem itens → limpa linhas
        setLinhas(criarLinhasVazias());
        return;
      }

      // Não há cabeçalho para esse mês
      setRegistroId(null);
      setLinhas(criarLinhasVazias());
    };

    carregarDados();
    // não dependemos de user para evitar loop extra
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, mesAnoInicial, mesAno]);

  const adicionarLinha = () =>
    setLinhas((prev) => [{ id: crypto.randomUUID(), nome: "", valor: "" }, ...prev]);

  // REMOVER LINHA (ATUALIZA ESTADO + SUPABASE)
  const removerLinha = async (linha) => {
    // Atualiza estado local imediatamente
    setLinhas((prev) => {
      const novo = prev.filter((l) => l.id !== linha.id);
      return novo.length === 0 ? criarLinhasVazias() : novo;
    });

    // Se não tiver user ou registroId, não mexe no banco (por segurança)
    if (!user || !registroId) return;

    const nomeLimpo = linha.nome?.trim();
    if (!nomeLimpo) return;

    try {
      // Remove item correspondente na tabela de itens
      await supabase
        .from("registros_ativos_itens")
        .delete()
        .eq("registro_id", registroId)
        .eq("nome_ativo", nomeLimpo);

      // Verifica se ainda restam itens para esse registro
      const { data: restantes, error: restantesError } = await supabase
        .from("registros_ativos_itens")
        .select("id")
        .eq("registro_id", registroId);

      if (restantesError) throw restantesError;

      // Se não houver mais itens, apaga também o cabeçalho (registro_ativos)
      if (!restantes || restantes.length === 0) {
        await supabase
          .from("registros_ativos")
          .delete()
          .eq("id", registroId);

        setRegistroId(null);
      }
    } catch (err) {
      console.error("Erro ao remover linha no banco:", err);
      // opcional: setErroGlobal("Erro ao remover ativo. Tente novamente.");
    }
  };

  const atualizarCampo = (id, campo, valor) =>
    setLinhas((prev) =>
      prev.map((l) => (l.id === id ? { ...l, [campo]: valor } : l))
    );

  const selecionarSugestao = (id, nome) => {
    atualizarCampo(id, "nome", nome);
    setQuery("");
    setFocoId(null);
  };

  // SALVAR – VERSÃO FINAL (LINHAS EM BRANCO NÃO CONTAM)
  const salvar = async () => {
    if (isSaving || !user) return;
    setIsSaving(true);
    setErroGlobal("");

    // ignora linhas completamente vazias (nome e valor em branco)
    const itensValidos = linhas.filter(
      (l) => l.nome?.trim() !== "" && l.valor?.trim() !== ""
    );

    const totalCalculado = itensValidos.reduce(
      (acc, l) => acc + toNum(l.valor),
      0
    );

    try {
      const userId = user.id;
      const agora = new Date().toISOString();

      // Busca registro existente
      const { data: cabecalhos } = await supabase
        .from("registros_ativos")
        .select("id")
        .eq("user_id", userId)
        .eq("mes_ano", mesAno)
        .limit(1);

      const registroExistente = cabecalhos?.[0];

      // SE NÃO TEM NENHUMA LINHA PREENCHIDA → APAGA O MÊS INTEIRO
      if (itensValidos.length === 0) {
        if (registroExistente) {
          await supabase
            .from("registros_ativos_itens")
            .delete()
            .eq("registro_id", registroExistente.id);
          await supabase
            .from("registros_ativos")
            .delete()
            .eq("id", registroExistente.id);
        }
        setRegistroId(null);
        onSave?.({ mesAno, itens: [], total: 0, deleted: true });
        onClose?.();
        setIsSaving(false);
        return;
      }

      // Tem linhas válidas → salva normalmente
      let registroIdLocal = registroExistente?.id;

      if (!registroIdLocal) {
        const { data: novo } = await supabase
          .from("registros_ativos")
          .insert({
            user_id: userId,
            mes_ano: mesAno,
            total: totalCalculado,
            created_at: agora,
            atualizado_em: agora,
          })
          .select()
          .single();

        registroIdLocal = novo.id;
        setRegistroId(registroIdLocal);
      }

      // Limpa itens antigos
      await supabase
        .from("registros_ativos_itens")
        .delete()
        .eq("registro_id", registroIdLocal);

      // Insere novos
      const payload = itensValidos.map((l) => ({
        registro_id: registroIdLocal,
        user_id: userId,
        nome_ativo: l.nome.trim(),
        valor: toNum(l.valor),
        created_at: agora,
        atualizado_em: agora,
      }));

      await supabase.from("registros_ativos_itens").insert(payload);

      // Atualiza total
      await supabase
        .from("registros_ativos")
        .update({ total: totalCalculado, atualizado_em: agora })
        .eq("id", registroIdLocal);

      onSave?.({
        mesAno,
        itens: itensValidos.map((l) => ({
          nome: l.nome.trim(),
          valor: toNum(l.valor),
        })),
        total: totalCalculado,
        deleted: false,
      });
      onClose?.();
    } catch (err) {
      console.error(err);
      setErroGlobal("Erro ao salvar: " + (err.message || "Tente novamente"));
    } finally {
      setIsSaving(false);
    }
  };

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="w-[900px] max-w-[96vw] bg-white rounded-xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b bg-gray-50 rounded-t-xl flex justify-between items-center">
          <h2 className="text-xl font-semibold">Editar Ativos</h2>
          <button
            onClick={onClose}
            className="text-3xl text-gray-500 hover:text-gray-800"
          >
            ×
          </button>
        </div>

        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <MesAnoPicker value={mesAno} onChange={setMesAno} />
            <button
              onClick={adicionarLinha}
              className="text-emerald-600 hover:text-emerald-700 text-sm font-medium"
            >
              + Adicionar linha
            </button>
          </div>

          <div className="grid grid-cols-[2fr_1fr_60px] text-xs font-bold text-gray-600 uppercase mb-2">
            <div>Nome do Ativo</div>
            <div className="text-right">Valor</div>
            <div></div>
          </div>

          <div className="max-h-96 overflow-y-auto -mx-6 px-6">
            {linhas.map((l) => (
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
              />
            ))}
          </div>

          <div className="mt-6 pt-4 border-t flex justify-end text-lg font-bold text-emerald-600">
            Total: R$ {total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </div>

          {erroGlobal && (
            <div className="text-red-600 text-sm mt-2">{erroGlobal}</div>
          )}
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t bg-gray-50 rounded-b-xl">
          <button
            onClick={onClose}
            disabled={isSaving}
            className="px-5 py-2 rounded-lg border border-gray-300 hover:bg-gray-100 disabled:opacity-50"
          >
            Fechar
          </button>
          <button
            onClick={salvar}
            disabled={isSaving}
            className="px-6 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60"
          >
            {isSaving ? "Salvando…" : "Salvar"}
          </button>
        </div>
      </div>
    </div>
  );
}
