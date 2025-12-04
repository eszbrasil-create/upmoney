// src/layouts/AppLayout.jsx
import React, { useState } from "react";
import Sidebar from "../modules/Sidebar";
import EditAtivosModal from "../components/modals/EditAtivosModal";
import { supabase } from "../lib/supabaseClient";

export default function AppLayout({ children, onNavigate, currentView, refreshData }) {
  const [openEdit, setOpenEdit] = useState(false);

  const abrirModal = () => setOpenEdit(true);

  const handleSave = () => {
    refreshData?.();
    setOpenEdit(false);
  };

  // FUNÇÃO ZERAR TUDO — APAGA TUDO DO SUPABASE
  const zerarTodosOsAtivos = async () => {
    if (!confirm("⚠️ TEM CERTEZA?\n\nVocê vai APAGAR TODOS os seus registros de ativos para sempre.\nEssa ação NÃO pode ser desfeita!")) {
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert("Você precisa estar logado.");
      return;
    }

    try {
      const { data: registros } = await supabase
        .from("registros_ativos")
        .select("id")
        .eq("user_id", user.id);

      if (!registros || registros.length === 0) {
        alert("Nada para apagar. Já está zerado!");
        return;
      }

      const ids = registros.map(r => r.id);

      // Apaga os itens primeiro
      await supabase.from("registros_ativos_itens").delete().in("registro_id", ids);
      // Depois apaga os registros principais
      await supabase.from("registros_ativos").delete().in("id", ids);

      alert("Tudo foi apagado com sucesso!");
      refreshData?.(); // Atualiza a tela na hora
    } catch (err) {
      console.error(err);
      alert("Erro ao zerar tudo: " + err.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <Sidebar
        onEditAtivos={abrirModal}
        onZerarTudo={zerarTodosOsAtivos}   // ← AQUI ESTÁ O NOVO BOTÃO FUNCIONANDO!
        onNavigate={onNavigate}
        currentView={currentView}
      />

      <main className="ml-48 pr-0 pt-0 min-h-screen overflow-x-hidden">
        {children}
      </main>

      <EditAtivosModal
        open={openEdit}
        onClose={() => setOpenEdit(false)}
        onSave={handleSave}
      />
    </div>
  );
}