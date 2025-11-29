// src/modules/carteiraCash/ModalLancamentos.jsx
import React, { useMemo, useState, useEffect } from "react";
import { supabase } from "../../lib/supabaseClient";

// Helpers
function toNum(x) {
  if (x === "" || x === null || x === undefined) return 0;
  const n = Number(String(x).replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

function formatDateBR(iso) {
  if (!iso) return "—";
  const parts = iso.split("-");
  if (parts.length !== 3) return iso;
  const [y, m, d] = parts;
  return `${d}/${m}/${y}`;
}

export default function ModalLancamentos({ isOpen, onClose }) {
  if (!isOpen) return null;

  // Estado do formulário
  const [novo, setNovo] = useState({
    ticker: "",
    tipo: "",
    dataEntrada: "",
    qtd: "",
    price: "",
  });

  // Lista REAL dos lançamentos do Supabase
  const [lancamentos, setLancamentos] = useState([]);

  // Usuário logado
  const [user, setUser] = useState(null);

  // ================================
  // 1) Obter usuário logado
  // ================================
  useEffect(() => {
    async function loadUser() {
      const { data } = await supabase.auth.getUser();
      setUser(data?.user || null);
    }
    loadUser();
  }, []);

  // ================================
  // 2) Carregar lançamentos do Supabase
  // ================================
  useEffect(() => {
    if (!user) return;

    async function loadLanc() {
      const { data, error } = await supabase
        .from("wallet_items")
        .select("*")
        .eq("user_id", user.id)
        .order("data_entrada", { ascending: false });

      if (error) {
        console.error("Erro ao carregar lançamentos:", error);
        return;
      }

      setLancamentos(data || []);
    }

    loadLanc();
  }, [user]);

  // ================================
  // 3) Alterar campos
  // ================================
  function handleChange(e) {
    const { name, value } = e.target;
    setNovo((old) => ({ ...old, [name]: value }));
  }

  // ================================
  // 4) Salvar no Supabase (ALINHADO COM A TABELA)
  // ================================
  async function handleSalvar(e) {
    e.preventDefault();
    if (!user) return alert("Usuário não identificado.");

    const tickerUpper = (novo.ticker || "").toUpperCase();
    const tipo = novo.tipo || "ACOES";
    const quantidade = toNum(novo.qtd);
    const precoUnit = toNum(novo.price);

    // Se não tiver data informada, usa hoje (para não quebrar NOT NULL)
    const hojeISO = new Date().toISOString().slice(0, 10);
    const dataEntradaISO = novo.dataEntrada || hojeISO;

    const valorTotal = quantidade * precoUnit;

    const payload = {
      user_id: user.id,

      // Campos "novos"
      qtd: quantidade,
      price: precoUnit,
      asset_name: tickerUpper,
      category: tipo,
      purchase_date: dataEntradaISO,

      // Campos legados que existem na tabela e são NOT NULL
      ticker: tickerUpper,
      tipo: tipo,
      nome: tickerUpper,
      data_entrada: dataEntradaISO,
      valor: valorTotal,
    };

    const { error } = await supabase.from("wallet_items").insert(payload);

    if (error) {
      console.error("Erro ao salvar ativo:", error);
      alert("Erro ao salvar ativo. Veja o console para detalhes.");
      return;
    }

    // reload
    const { data, error: errorReload } = await supabase
      .from("wallet_items")
      .select("*")
      .eq("user_id", user.id)
      .order("data_entrada", { ascending: false });

    if (errorReload) {
      console.error("Erro ao recarregar lançamentos:", errorReload);
    } else {
      setLancamentos(data || []);
    }

    // Reset
    setNovo({
      ticker: "",
      tipo: "",
      dataEntrada: "",
      qtd: "",
      price: "",
    });
  }

  // ================================
  // 5) Excluir lançamento
  // ================================
  async function handleDelete(id) {
    const { error } = await supabase
      .from("wallet_items")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      console.error(error);
      alert("Erro ao excluir.");
      return;
    }

    setLancamentos((old) => old.filter((l) => l.id !== id));
  }

  // ================================
  // 6) Ordenação local (por data_entrada)
  // ================================
  const lancOrdenados = useMemo(() => {
    const arr = [...(lancamentos || [])];
    return arr.sort((a, b) => {
      const da = a.data_entrada || a.purchase_date || "";
      const db = b.data_entrada || b.purchase_date || "";
      if (da && db) return db.localeCompare(da);
      if (da) return -1;
      if (db) return 1;
      return (b.id || 0) - (a.id || 0);
    });
  }, [lancamentos]);

  return (
    <div className="fixed inset-0 z-40 bg-black/60 flex items-center justify-center p-4">
      <div className="w-[70vw] h-[90vh] rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-6 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-slate-100 font-semibold text-lg">
            Adicionar ativo à base
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-100 text-xl"
          >
            ×
          </button>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSalvar} className="flex flex-col gap-4">
          <div className="flex gap-3 overflow-x-auto pb-2">
            <div className="flex flex-col flex-[0_0_130px]">
              <label className="text-[11px] text-slate-300 mb-1">
                Ativo (ticker)
              </label>
              <input
                name="ticker"
                value={novo.ticker}
                onChange={handleChange}
                placeholder="VALE3"
                className="rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-sm text-slate-100"
              />
            </div>

            <div className="flex flex-col flex-[0_0_130px]">
              <label className="text-[11px] text-slate-300 mb-1">Tipo</label>
              <select
                name="tipo"
                value={novo.tipo}
                onChange={handleChange}
                className="rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-xs text-slate-100"
              >
                <option value="">Selecione...</option>
                <option value="ACOES">Ações</option>
                <option value="FII">FII</option>
                <option value="RF">Renda Fixa</option>
                <option value="CAIXA">Caixa</option>
                <option value="OUTROS">Outros</option>
              </select>
            </div>

            <div className="flex flex-col flex-[0_0_150px]">
              <label className="text-[11px] text-slate-300 mb-1">
                Data de entrada
              </label>
              <input
                type="date"
                name="dataEntrada"
                value={novo.dataEntrada}
                onChange={handleChange}
                className="rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-xs text-slate-100"
              />
            </div>

            <div className="flex flex-col flex-[0_0_120px]">
              <label className="text-[11px] text-slate-300 mb-1">
                Quantidade
              </label>
              <input
                name="qtd"
                value={novo.qtd}
                onChange={handleChange}
                inputMode="decimal"
                className="rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-sm text-slate-100"
              />
            </div>

            <div className="flex flex-col flex-[0_0_160px]">
              <label className="text-[11px] text-slate-300 mb-1">
                Preço de compra (R$)
              </label>
              <input
                name="price"
                value={novo.price}
                onChange={handleChange}
                inputMode="decimal"
                className="rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-sm text-slate-100"
              />
            </div>

            <div className="flex flex-col flex-[0_0_auto]">
              <label className="text-[11px] text-transparent mb-1">
                &nbsp;
              </label>
              <button
                type="submit"
                className="px-2 py-2 flex-shrink-0 rounded-xl bg-emerald-500 text-sm font-semibold text-slate-950 hover:bg-emerald-400"
              >
                Salvar lançamento
              </button>
            </div>
          </div>
        </form>

        {/* Lista */}
        <div className="mt-6 border-t border-slate-700 pt-4 flex-1 min-h-0 flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-slate-100 text-sm font-semibold">
              Lançamentos cadastrados
            </h3>
            <span className="text-[11px] text-slate-400">
              Total: {lancOrdenados.length}
            </span>
          </div>

          <div className="rounded-xl border border-slate-700 bg-slate-950/60 flex-1 overflow-y-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-800/80 text-slate-300">
                <tr>
                  <th className="px-3 py-2 text-left">#</th>
                  <th className="px-3 py-2 text-left">Data</th>
                  <th className="px-1 py-2 text-center"></th>
                  <th className="px-3 py-2 text-left">Ticker</th>
                  <th className="px-3 py-2 text-left">Tipo</th>
                  <th className="px-3 py-2 text-right">Quantidade</th>
                  <th className="px-3 py-2 text-right">Preço</th>
                  <th className="px-3 py-2 text-right">Valor</th>
                </tr>
              </thead>

              <tbody>
                {lancOrdenados.map((l, idx) => {
                  const qtd = toNum(l.qtd);
                  const preco = toNum(l.price ?? l.preco);
                  const valor = l.valor != null ? toNum(l.valor) : qtd * preco;

                  return (
                    <tr
                      key={l.id}
                      className="border-t border-slate-800 hover:bg-slate-800/40"
                    >
                      <td className="px-3 py-1.5 text-slate-400">
                        {idx + 1}
                      </td>

                      <td className="px-3 py-1.5 text-slate-100">
                        {formatDateBR(l.data_entrada || l.purchase_date)}
                      </td>

                      <td className="px-1 py-1.5 text-center">
                        <button
                          onClick={() => handleDelete(l.id)}
                          className="h-6 w-6 rounded-full text-slate-400 hover:text-rose-100 hover:bg-rose-500/70"
                        >
                          🗑️
                        </button>
                      </td>

                      <td className="px-3 py-1.5 text-slate-100">
                        {l.ticker || l.asset_name}
                      </td>

                      <td className="px-3 py-1.5 text-slate-200">
                        {l.tipo || l.category}
                      </td>

                      <td className="px-3 py-1.5 text-right text-slate-100">
                        {qtd}
                      </td>

                      <td className="px-3 py-1.5 text-right text-slate-100">
                        {preco.toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        })}
                      </td>

                      <td className="px-3 py-1.5 text-right text-slate-100">
                        {valor.toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
