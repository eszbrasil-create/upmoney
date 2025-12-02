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
  const meses = [
    "Jan",
    "Fev",
    "Mar",
    "Abr",
    "Mai",
    "Jun",
    "Jul",
    "Ago",
    "Set",
    "Out",
    "Nov",
    "Dez",
  ];

  const [mesAtual, anoAtualStr] = String(value || "").split("/");
  const anoInicial = Number(anoAtualStr) || new Date().getFullYear();

  const [open, setOpen] = useState(false);
  const [ano, setAno] = useState(anoInicial);

  useEffect(() => {
    const [, a] = String(value || "").split("/");
    if (a) setAno(Number(a));
  }, [value]);

  const ref = useRef(null);
  useEffect(() => {
    function onDocClick(e) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 rounded-lg bg-gray-100 border border-gray-300 px-3 py-2 text-sm text-gray-800 hover:bg-gray-200 transition"
      >
        <span>{value || "Selecione o mês"}</span>
        <span>▾</span>
      </button>

      {open && (
        <div className="absolute left-0 mt-2 w-[240px] rounded-xl border border-gray-300 bg-white shadow-xl p-3 z-50">
          <div className="flex items-center justify-between mb-2">
            <button
              type="button"
              onClick={() => setAno((a) => a - 1)}
              className="h-8 w-8 rounded bg-gray-200 hover:bg-gray-300"
            >
              ←
            </button>

            <div className="font-semibold text-gray-800">{ano}</div>

            <button
              type="button"
              onClick={() => setAno((a) => a + 1)}
              className="h-8 w-8 rounded bg-gray-200 hover:bg-gray-300"
            >
              →
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {meses.map((m) => {
              const selected = m === mesAtual && ano === anoInicial;
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => {
                    onChange?.(`${m}/${ano}`);
                    setOpen(false);
                  }}
                  className={`rounded-lg px-3 py-2 text-sm transition ${
                    selected
                      ? "bg-emerald-500 text-white"
                      : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                  }`}
                >
                  {m}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------------------
   Linha da tabela com autocomplete
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
    <div
      className={`grid grid-cols-[2fr_1fr_60px] gap-0 items-center border-b border-gray-200 py-2 ${
        focoId === linha.id ? "relative z-20 bg-white" : ""
      }`}
    >
      {/* NOME DO ATIVO */}
      <div className="pr-3 border-r border-gray-300 relative">
        <input
          ref={inputRef}
          className="w-full bg-transparent px-2 py-1 text-sm text-gray-900 outline-none"
          placeholder="Digite um ativo"
          value={linha.nome}
          onChange={(e) => {
            atualizarCampo(linha.id, "nome", e.target.value);
            setFocoId(linha.id);
            setQuery(e.target.value);
          }}
          onFocus={(e) => {
            setFocoId(linha.id);
            setQuery(e.target.value || "");
          }}
          onBlur={() => {
            setTimeout(() => {
              setFocoId((prev) => (prev === linha.id ? null : prev));
              setQuery("");
            }, 120);
          }}
        />

        {focoId === linha.id &&
          sugestoes.length > 0 &&
          typeof document !== "undefined" &&
          createPortal(
            <div
              style={dropdownStyle}
              className="rounded-lg border border-gray-300 bg-white shadow-2xl"
            >
              {sugestoes.map((s) => (
                <button
                  key={s}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => selecionarSugestao(linha.id, s)}
                  className="w-full px-3 py-2 text-left text-sm text-gray-900 hover:bg-gray-100"
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
          value={linha.valor}
          onChange={(e) => {
            const raw = e.target.value;
            if (/^[0-9.,]*$/.test(raw)) {
              atualizarCampo(linha.id, "valor", raw);
            }
          }}
          onBlur={(e) =>
            atualizarCampo(
              linha.id,
              "valor",
              formatPtBr(toNum(e.target.value))
            )
          }
        />

        {erroValorSemNome && (
          <p className="mt-1 text-xs text-red-500">
            Informe o nome do ativo antes de registrar um valor.
          </p>
        )}
      </div>

      {/* AÇÃO */}
      <div className="flex justify-center">
        <button
          onClick={() => removerLinha(linha.id)}
          className="text-gray-500 hover:text-red-500"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}

/* ---------------------------
      Modal principal
---------------------------- */
export default function EditAtivosModal({
  open,
  onClose,
  onSave,
  ativosExistentes = [
    "Ações",
    "Renda Fixa",
    "Cripto",
    "FIIs",
    "Caixa",
    "Banco",
    "Viagem",
    "Cofre",
  ],
  mesAnoInicial,
  linhasIniciais = [],
}) {
  const backdropRef = useRef(null);

  const [user, setUser] = useState(null);

  useEffect(() => {
    async function loadUser() {
      const { data } = await supabase.auth.getUser();
      setUser(data?.user || null);
    }
    loadUser();
  }, []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const mesesLista = [
    "Jan",
    "Fev",
    "Mar",
    "Abr",
    "Mai",
    "Jun",
    "Jul",
    "Ago",
    "Set",
    "Out",
    "Nov",
    "Dez",
  ];
  const hoje = new Date();
  const mesBase = hoje.getMonth();
  const anoBase = hoje.getFullYear();
  const padraoMesAno = mesAnoInicial || `${mesesLista[mesBase]}/${anoBase}`;

  const [mesAno, setMesAno] = useState(padraoMesAno);

  const toNum = (x) => {
    if (x === "" || x == null) return 0;
    const n = Number(String(x).replace(/\./g, "").replace(",", "."));
    return Number.isFinite(n) ? n : 0;
  };

  const formatPtBr = (n) =>
    n.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const [linhas, setLinhas] = useState([
    { id: crypto.randomUUID(), nome: "", valor: "" },
  ]);

  const [isSaving, setIsSaving] = useState(false);
  const [erroGlobal, setErroGlobal] = useState("");

  const [focoId, setFocoId] = useState(null);
  const [query, setQuery] = useState("");

  const uniqAtivos = useMemo(() => {
    return Array.from(
      new Map(
        ativosExistentes.map((n) => [String(n).toLowerCase(), String(n)])
      ).values()
    ).sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [ativosExistentes]);

  const sugestoes = useMemo(() => {
    if (!query) return uniqAtivos.slice(0, 8);
    const q = query.toLowerCase();
    return uniqAtivos
      .filter((n) => n.toLowerCase().includes(q))
      .slice(0, 8);
  }, [query, uniqAtivos]);

  useEffect(() => {
    if (!open) return;
    setMesAno(padraoMesAno);
    setErroGlobal("");
    setIsSaving(false);

    if (Array.isArray(linhasIniciais) && linhasIniciais.length > 0) {
      setLinhas(
        linhasIniciais.map((l) => ({
          id: crypto.randomUUID(),
          nome: l.nome || "",
          valor: formatPtBr(toNum(l.valor)),
        }))
      );
    } else {
      setLinhas([
        { id: crypto.randomUUID(), nome: "", valor: "" },
        { id: crypto.randomUUID(), nome: "", valor: "" },
        { id: crypto.randomUUID(), nome: "", valor: "" },
        { id: crypto.randomUUID(), nome: "", valor: "" },
      ]);
    }
  }, [open, padraoMesAno, linhasIniciais]);

  const adicionarLinha = () => {
    setLinhas((prev) => [
      { id: crypto.randomUUID(), nome: "", valor: "" },
      ...prev,
    ]);
  };

  const removerLinha = (id) => {
    setLinhas((prev) => {
      const novo = prev.filter((l) => l.id !== id);
      if (novo.length === 0) {
        return [{ id: crypto.randomUUID(), nome: "", valor: "" }];
      }
      return novo;
    });
  };

  const atualizarCampo = (id, campo, valor) => {
    setLinhas((prev) =>
      prev.map((l) => (l.id === id ? { ...l, [campo]: valor } : l))
    );
  };

  const selecionarSugestao = (id, nome) => {
    atualizarCampo(id, "nome", nome);
    setFocoId(null);
    setQuery("");
  };

  const total = linhas.reduce((acc, l) => acc + toNum(l.valor), 0);

  const salvar = async () => {
    if (isSaving) return;

    const itensLimpos = linhas
      .filter((l) => l.nome.trim() !== "" && toNum(l.valor) > 0)
      .map((l) => ({
        nome: l.nome.trim(),
        valor: toNum(l.valor),
      }));

    if (!mesAno) {
      setErroGlobal("Escolha um mês antes de salvar.");
      return;
    }

    if (itensLimpos.length === 0) {
      setErroGlobal("Adicione pelo menos um ativo com nome e valor.");
      return;
    }

    if (!user) {
      setErroGlobal("Usuário não identificado.");
      return;
    }

    try {
      setIsSaving(true);
      setErroGlobal("");

      // 1) Busca ou cria registro_ativos para esse mês
      const { data: existentes, error: errBusca } = await supabase
        .from("registros_ativos")
        .select("*")
        .eq("user_id", user.id)
        .eq("mes_ano", mesAno)
        .limit(1);

      if (errBusca) throw errBusca;

      let registroId;

      if (existentes && existentes.length > 0) {
        registroId = existentes[0].id;

        const { error: errUpdate } = await supabase
          .from("registros_ativos")
          .update({ total })
          .eq("id", registroId);

        if (errUpdate) throw errUpdate;

        const { error: errDel } = await supabase
          .from("registros_ativos_itens")
          .delete()
          .eq("registro_ativo_id", registroId);

        if (errDel) throw errDel;
      } else {
        const { data: inserted, error: errInsert } = await supabase
          .from("registros_ativos")
          .insert({
            user_id: user.id,
            mes_ano: mesAno,
            total,
          })
          .select()
          .single();

        if (errInsert) throw errInsert;
        registroId = inserted.id;
      }

      // 2) Insere itens
      if (itensLimpos.length > 0) {
        const itensPayload = itensLimpos.map((it) => ({
          registro_ativo_id: registroId,
          user_id: user.id,
          nome: it.nome,
          valor: it.valor,
        }));

        const { error: errItens } = await supabase
          .from("registros_ativos_itens")
          .insert(itensPayload);

        if (errItens) throw errItens;
      }

      // mantém compatibilidade com quem usa onSave no front
      if (onSave) {
        await onSave({ mesAno, itens: itensLimpos, total, registroId });
      }

      onClose?.();
    } catch (err) {
      console.error(err);
      setErroGlobal(
        err?.message || "Não foi possível salvar. Tente novamente."
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div
      ref={backdropRef}
      onMouseDown={(e) =>
        e.target === backdropRef.current && !isSaving && onClose?.()
      }
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
    >
      <div
        className="w-[900px] max-w-[96vw] rounded-xl bg-white shadow-2xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="px-6 py-4 border-b border-gray-300 bg-gray-100 rounded-t-xl flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900">Editar Ativos</h2>

          <button
            onClick={onClose}
            disabled={isSaving}
            className="text-gray-700 hover:text-black text-xl disabled:opacity-50"
          >
            ×
          </button>
        </div>

        {/* TOPO DA TABELA */}
        <div className="px-6 mt-4 flex items-center gap-4">
          <MesAnoPicker value={mesAno} onChange={setMesAno} />

          <button
            onClick={adicionarLinha}
            type="button"
            className="inline-flex items-center gap-2 text-emerald-600 hover:text-emerald-700 text-sm font-medium"
          >
            + Adicionar linha
          </button>
        </div>

        {/* TÍTULOS DAS COLUNAS */}
        <div className="grid grid-cols-[2fr_1fr_60px] gap-0 px-6 mt-6 text-[11px] font-semibold text-gray-600 uppercase">
          <div className="border-b border-gray-300 pb-1">Nome do Ativo</div>
          <div className="border-b border-gray-300 pb-1 text-left">Valor</div>
          <div className="border-b border-gray-300 pb-1 text-center">Ação</div>
        </div>

        {/* LINHAS */}
        <div className="px-6 mt-2 max-h-[380px] overflow-y-auto">
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

        {/* TOTAL */}
        <div className="px-6 py-4 flex justify-between border-t border-gray-300 mt-4">
          <span className="font-semibold text-gray-900">Total:</span>
          <span className="font-semibold text-emerald-600">
            {total.toLocaleString("pt-BR", {
              style: "currency",
              currency: "BRL",
            })}
          </span>
        </div>

        {/* ERRO GLOBAL */}
        {erroGlobal && (
          <div className="px-6 pb-1 text-xs text-red-500">{erroGlobal}</div>
        )}

        {/* RODAPÉ */}
        <div className="px-6 py-4 flex justify-end gap-3 border-t border-gray-200">
          <button
            onClick={onClose}
            disabled={isSaving}
            className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50"
          >
            Fechar
          </button>

          <button
            onClick={salvar}
            disabled={isSaving}
            className="px-5 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 disabled:opacity-60"
          >
            {isSaving ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </div>
    </div>
  );
}
