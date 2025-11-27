// src/layouts/AppLayout.jsx
import React, { useEffect, useMemo, useState } from "react";
import Sidebar from "../modules/Sidebar";
import EditAtivosModal from "../components/modals/EditAtivosModal";

// Chave principal (nova)
const PRIMARY_LS_KEY = "cc_registros_v1";
// Chaves antigas para migração/limpeza
const FALLBACK_KEYS = [
  "cc_registros_v1",
  "registrosPorMes_v1",
  "cc.registrosPorMes",
  "cashcontrol-registros",
];

export default function AppLayout({ children, onNavigate, currentView }) {
  const [openEdit, setOpenEdit] = useState(false);
  const [registrosPorMes, setRegistrosPorMes] = useState({});

  // Carregar do localStorage (com migração)
  useEffect(() => {
    try {
      let loaded = {};
      for (const key of FALLBACK_KEYS) {
        const raw = localStorage.getItem(key);
        if (!raw) continue;
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object" && Object.keys(parsed).length) {
          loaded = parsed;
          break;
        }
      }
      if (loaded && Object.keys(loaded).length) {
        setRegistrosPorMes(loaded);
        localStorage.setItem(PRIMARY_LS_KEY, JSON.stringify(loaded));
      }
    } catch {
      // silencioso
    }
  }, []);

  // Persistir sempre que mudar
  useEffect(() => {
    try {
      localStorage.setItem(PRIMARY_LS_KEY, JSON.stringify(registrosPorMes));
    } catch {
      // silencioso
    }
  }, [registrosPorMes]);

  // Reset geral (botão "Zerar Tudo")
  const handleResetAll = () => {
    try {
      for (const key of FALLBACK_KEYS) localStorage.removeItem(key);
      localStorage.setItem(PRIMARY_LS_KEY, JSON.stringify({}));
    } catch {
      // silencioso
    }
    setRegistrosPorMes({});
  };

  // Ativos existentes (para autocomplete do modal)
  const ativosExistentes = useMemo(() => {
    const s = new Set();
    Object.values(registrosPorMes).forEach((lista) =>
      (lista || []).forEach((i) => s.add(i.nome))
    );
    return Array.from(s);
  }, [registrosPorMes]);

  // Salvar do modal
  const handleSave = ({ mesAno, itens }) => {
    setRegistrosPorMes((prev) => ({ ...prev, [mesAno]: itens }));
    setOpenEdit(false);
  };

  // Excluir mês (usado no CardRegistro)
  const handleDeleteMonth = (mes) => {
    setRegistrosPorMes((prev) => {
      const clone = { ...prev };
      delete clone[mes];
      return clone;
    });
  };

  // Prefill do modal (último mês)
  const mesAnoInicial = useMemo(() => {
    const chaves = Object.keys(registrosPorMes);
    if (!chaves.length) return undefined;
    return chaves[chaves.length - 1];
  }, [registrosPorMes]);

  const linhasIniciais = useMemo(() => {
    if (!mesAnoInicial) return [];
    return registrosPorMes[mesAnoInicial] || [];
  }, [mesAnoInicial, registrosPorMes]);

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Sidebar fixa à esquerda */}
      <Sidebar
        onEditAtivos={() => setOpenEdit(true)}
        onResetAll={handleResetAll}
        onNavigate={onNavigate}
        currentView={currentView}
      />

      {/* Conteúdo ajustado: mais perto do sidebar e mais para cima */}
      <main className="ml-50   pr-0 pt-0 min-h-screen overflow-x-hidden">
        {React.isValidElement(children)
          ? React.cloneElement(children, {
              registrosPorMes,
              onDeleteMonth: handleDeleteMonth,
            })
          : children}
      </main>

      {/* Modal de edição dos ativos */}
      <EditAtivosModal
        open={openEdit}
        onClose={() => setOpenEdit(false)}
        onSave={handleSave}
        mesAnoInicial={mesAnoInicial}
        linhasIniciais={linhasIniciais}
        ativosExistentes={
          ativosExistentes.length
            ? ativosExistentes
            : ["Ações", "Renda Fixa", "Cripto", "FIIs", "Caixa"]
        }
      />
    </div>
  );
}
