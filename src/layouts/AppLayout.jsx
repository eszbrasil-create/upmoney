// src/layouts/AppLayout.jsx
import React, { useState } from "react";
import Sidebar from "../modules/Sidebar";
import EditAtivosModal from "../components/modals/EditAtivosModal";

export default function AppLayout({ children, onNavigate, currentView, refreshData }) {
  const [openEdit, setOpenEdit] = useState(false);

  const abrirModal = () => setOpenEdit(true);

  const handleSave = () => {
    refreshData();           // ← atualiza o CardRegistro automaticamente
    setOpenEdit(false);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <Sidebar
        onEditAtivos={abrirModal}
        onNavigate={onNavigate}
        currentView={currentView}
      />

      <main className="ml-50 pr-0 pt-0 min-h-screen overflow-x-hidden">
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