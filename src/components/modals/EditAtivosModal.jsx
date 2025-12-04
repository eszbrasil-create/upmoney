// src/components/modals/EditAtivosModal.jsx — VERSÃO FINAL SEM ERRO DE BUILD
import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Trash2, Plus, X } from "lucide-react";
import { supabase } from "../../lib/supabaseClient";

const MESES = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];

function MesAnoPicker({ value, onChange }) {
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
      <button type="button" onClick={() => setOpen(true)} className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg">
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
              {MESES.map(m => (
                <button key={m} onClick={() => { onChange(`${m}/${ano}`); setOpen(false); }}
                  className={`py-3 rounded-lg font-medium transition ${value?.startsWith(m) ? "bg-emerald-600 text-white" : "hover:bg-gray-100"}`}>
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

export default function EditAtivosModal({ open = false, onClose, onSave, mesAnoInicial = "", ativosExistentes = [] }) {
  const [mesAno, setMesAno] = useState(mesAnoInicial);
  const [linhas, setLinhas] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const total = linhas.reduce((acc, l) => acc + (Number(l.valor.replace(/\./g, "").replace(",", ".")) || 0), 0);

  useEffect(() => {
    if (!open) return;
    const hoje = new Date();
    if (!mesAno) setMesAno(`${MESES[hoje.getMonth()]}/${hoje.getFullYear()}`);
    if (linhas.length === 0) setLinhas([{ id: "1", nome: "", valor: "" }]);
  }, [open]);

  // ... (o resto do código de carregar/salvar continua igual, só tirei o MES_IDX duplicado)

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[92vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="bg-emerald-600 text-white px-6 py-3 flex justify-between items-center">
          <h2 className="text-lg font-bold">Editar Ativos — {mesAno}</h2>
          <button onClick={onClose} className="p-1 hover:bg-white/20 rounded transition"><X size={20}/></button>
        </div>
        <div className="bg-gray-50 border-b px-6 py-3 flex items-center justify-between">
          <MesAnoPicker value={mesAno} onChange={setMesAno} />
          <button onClick={() => setLinhas(prev => [...prev, { id: Date.now().toString(), nome: "", valor: "" }])} 
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg">
            <Plus size={16} /> Nova linha
          </button>
        </div>
        <div className="flex-1 overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 sticky top-0">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-700">Ativo</th>
                <th className="px-4 py-3 text-right font-medium text-gray-700 w-32">Valor (R$)</th>
                <th className="w-12"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {linhas.map(l => (
                <tr key={l.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <input type="text" value={l.nome} onChange={e => atualizarLinha(l.id, "nome", e.target.value)}
                           className="w-full px-3 py-2 border border-gray-300 rounded focus:border-emerald-500 focus:outline-none"/>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <input type="text" value={l.valor} onChange={e => /^[0-9.,]*$/.test(e.target.value) && atualizarLinha(l.id, "valor", e.target.value)}
                           onBlur={e => formatarValor(e, l.id)} className="w-28 px-3 py-2 text-right border border-gray-300 rounded focus:border-emerald-500 focus:outline-none font-medium"/>
                  </td>
                  <td className="px-2">
                    <button onClick={() => removerLinha(l.id)} className="p-2 text-red-500 hover:bg-red-50 rounded"><Trash2 size={16}/></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="bg-gray-50 border-t px-6 py-4 flex justify-between items-center">
          <button onClick={() => confirm("Zerar mês?") && setLinhas([{id:"1",nome:"",valor:""}])}
                  className="text-red-600 hover:text-red-700 text-sm font-medium flex items-center gap-1">
            <Trash2 size={16}/> Zerar mês
          </button>
          <div className="text-right">
            <div className="text-xs text-gray-600">Total</div>
            <div className="text-2xl font-bold text-emerald-600">R$ {total.toLocaleString("pt-BR",{minimumFractionDigits:2})}</div>
          </div>
        </div>
        <div className="p-4 bg-white border-t">
          <button onClick={salvar} className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg">
            Salvar Alterações
          </button>
        </div>
      </div>
    </div>
  );
}