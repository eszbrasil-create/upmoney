// src/pages/Despesas.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Trash2, Download, Eraser, Save } from "lucide-react";
import { exportRelatorioPDF } from "../utils/exportRelatorioPDF";
import { supabase } from "../lib/supabaseClient";

const MESES = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
const ANOS = [2025, 2026];

const CATEGORIAS = {
  RECEITA: ["Salário", "Pró-labore", "Renda extra", "Dividendos", "Outras receitas"],
  DESPESA: [
    "Moradia","Alimentação","Transporte","Saúde","Educação",
    "Lazer","Impostos/Taxas","Investimentos","Outras despesas",
  ],
};

const uid = () => crypto.randomUUID();

function novaLinha(tipo = "DESPESA") {
  return { id: uid(), tipo, descricao: "", categoria: "", valores: Array(12).fill("") };
}

const lsKeyForAno = (ano) => `cc_despesas_${ano}`;

const initialAno = (() => {
  const atual = new Date().getFullYear();
  return ANOS.includes(atual) ? atual : ANOS[0];
})();

const toInt = (x) => Math.round(Number(String(x).replace(/\D/g, "")) || 0);

export default function DespesasPage() {
  const [anoSelecionado, setAnoSelecionado] = useState(initialAno);
  const [linhas, setLinhas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  /* =======================
     LOAD DO SUPABASE
  ======================= */
  const loadAno = async (ano) => {
    setLoading(true);
    const { data, error } = await supabase
      .from("cc_transacoes")
      .select("*")
      .eq("ano", ano);

    if (error) {
      console.error(error);
      setLoading(false);
      return;
    }

    const map = {};
    data.forEach((r) => {
      const key = `${r.tipo}|${r.categoria}|${r.descricao}`;
      if (!map[key]) {
        map[key] = {
          id: uid(),
          tipo: r.tipo,
          categoria: r.categoria,
          descricao: r.descricao,
          valores: Array(12).fill(""),
        };
      }
      map[key].valores[r.mes] = String(r.valor);
    });

    const linhasCarregadas = Object.values(map);
    setLinhas(linhasCarregadas);
    localStorage.setItem(lsKeyForAno(ano), JSON.stringify(linhasCarregadas));
    setLoading(false);
  };

  useEffect(() => {
    const cached = localStorage.getItem(lsKeyForAno(anoSelecionado));
    if (cached) setLinhas(JSON.parse(cached));
    loadAno(anoSelecionado);
  }, [anoSelecionado]);

  /* =======================
     SAVE (SYNC COMPLETO)
  ======================= */
  const salvarTudo = async () => {
    setSaving(true);

    const registros = [];
    linhas.forEach((l) => {
      l.valores.forEach((v, mes) => {
        const valor = toInt(v);
        if (valor > 0) {
          registros.push({
            ano: anoSelecionado,
            mes,
            tipo: l.tipo,
            categoria: l.categoria || "Sem categoria",
            descricao: l.descricao || "",
            valor,
          });
        }
      });
    });

    await supabase.from("cc_transacoes").delete().eq("ano", anoSelecionado);
    if (registros.length > 0) {
      const { error } = await supabase.from("cc_transacoes").insert(registros);
      if (error) console.error(error);
    }

    localStorage.setItem(lsKeyForAno(anoSelecionado), JSON.stringify(linhas));
    setSaving(false);
    alert("Despesas salvas com sucesso");
  };

  /* =======================
     DELETE LINHA
  ======================= */
  const handleDeleteLinha = async (linha) => {
    await supabase
      .from("cc_transacoes")
      .delete()
      .eq("ano", anoSelecionado)
      .eq("tipo", linha.tipo)
      .eq("categoria", linha.categoria || "Sem categoria")
      .eq("descricao", linha.descricao || "");

    setLinhas((prev) => prev.filter((l) => l.id !== linha.id));
  };

  /* =======================
     LIMPAR ANO
  ======================= */
  const clearAll = async () => {
    if (!confirm(`Apagar todas as linhas de ${anoSelecionado}?`)) return;

    await supabase.from("cc_transacoes").delete().eq("ano", anoSelecionado);
    setLinhas([]);
    localStorage.removeItem(lsKeyForAno(anoSelecionado));
  };

  /* =======================
     UI HELPERS
  ======================= */
  const receitas = linhas.filter((l) => l.tipo === "RECEITA");
  const despesas = linhas.filter((l) => l.tipo === "DESPESA");

  const addReceita = () => setLinhas((p) => [...p, novaLinha("RECEITA")]);
  const addDespesa = () => setLinhas((p) => [...p, novaLinha("DESPESA")]);

  return (
    <div className="h-screen flex flex-col p-4">
      <div className="flex justify-between items-center mb-3">
        <h1 className="text-2xl font-semibold">Despesas</h1>

        <div className="flex gap-2">
          <button onClick={addReceita} className="btn bg-emerald-600">+ Receita</button>
          <button onClick={addDespesa} className="btn bg-rose-600">+ Despesa</button>

          <button onClick={salvarTudo} className="btn bg-blue-600" disabled={saving}>
            <Save size={16} /> {saving ? "Salvando..." : "Salvar"}
          </button>

          <button onClick={clearAll} className="btn bg-slate-700">
            <Eraser size={16} /> Limpar
          </button>
        </div>
      </div>

      {loading && <div className="text-sm text-slate-400">Carregando dados...</div>}

      {/* A TABELA ORIGINAL CONTINUA IGUAL A SUA */}
      {/* (removi aqui só por tamanho, mas você pode manter exatamente igual) */}
    </div>
  );
}
