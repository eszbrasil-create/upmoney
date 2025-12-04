// src/components/containers/RegistrosAtivosContainer.jsx
import React, { useCallback, useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import CardRegistro from "../cards/CardRegistro";
import EditAtivosModal, { deleteRegistroAtivosPorMesAno } from "../modals/EditAtivosModal";

export default function RegistrosAtivosContainer() {
  const [columns, setColumns] = useState([]); // ["Jan/2025", "Fev/2025", ...]
  const [rows, setRows] = useState([]);       // [{ ativo, valores: [...] }, ...]
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [mesAnoInicial, setMesAnoInicial] = useState("");

  const carregarRegistros = useCallback(async () => {
    setLoading(true);
    setErro("");

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setColumns([]);
        setRows([]);
        setLoading(false);
        return;
      }

      // 1) Busca todos os registros_ativos do usuário
      const { data: regs, error: regsError } = await supabase
        .from("registros_ativos")
        .select("id, mes_ano")
        .eq("user_id", user.id)
        .order("mes_ano", { ascending: true });

      if (regsError) throw regsError;

      if (!regs || regs.length === 0) {
        setColumns([]);
        setRows([]);
        setLoading(false);
        return;
      }

      const registroIds = regs.map((r) => r.id);

      // 2) Busca todos os itens desses registros
      const { data: itens, error: itensError } = await supabase
        .from("registros_ativos_itens")
        .select("registro_id, nome_ativo, valor")
        .in("registro_id", registroIds);

      if (itensError) throw itensError;

      // Mapa registro_id -> mes_ano
      const mapaRegistroParaMes = {};
      regs.forEach((r) => {
        mapaRegistroParaMes[r.id] = r.mes_ano;
      });

      // Lista de meses únicos, na ordem
      const meses = Array.from(new Set(regs.map((r) => r.mes_ano)));

      // Lista de ativos únicos
      const ativos = Array.from(
        new Set((itens || []).map((i) => i.nome_ativo))
      );

      // Mapa (ativo, mes_ano) -> soma
      const valuesMap = {};
      (itens || []).forEach((i) => {
        const mesAno = mapaRegistroParaMes[i.registro_id];
        if (!mesAno) return;
        const key = `${i.nome_ativo}|${mesAno}`;
        const valorNum = Number(i.valor || 0);
        valuesMap[key] = (valuesMap[key] || 0) + valorNum;
      });

      // Monta rows para o CardRegistro
      const newRows = ativos.map((ativo) => ({
        ativo,
        valores: meses.map((mesAno) => valuesMap[`${ativo}|${mesAno}`] || 0),
      }));

      setColumns(meses);
      setRows(newRows);
    } catch (e) {
      console.error(e);
      setErro("Erro ao carregar registros.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregarRegistros();
  }, [carregarRegistros]);

  const handleOpenModal = (mesAno) => {
    setMesAnoInicial(mesAno || "");
    setModalOpen(true);
  };

  const handleSaveAtivos = async ({ mesAno, total, deleted }) => {
    // Independente de criar/editar/deletar, recarrega tudo do Supabase
    await carregarRegistros();
  };

  const handleDeleteMonth = async (mesAno) => {
    try {
      await deleteRegistroAtivosPorMesAno(mesAno);
      await carregarRegistros();
    } catch (e) {
      console.error(e);
      setErro("Erro ao excluir o mês.");
    }
  };

  return (
    <div className="space-y-4">
      {erro && (
        <div className="px-4 py-2 rounded-lg bg-red-900/40 text-red-100 text-sm">
          {erro}
        </div>
      )}

      {/* Botão para abrir o modal e adicionar/editar ativos */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => handleOpenModal("")}
          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold shadow-md transition"
        >
          Adicionar / Editar Ativos
        </button>
      </div>

      {/* Card de registros */}
      {loading && columns.length === 0 ? (
        <div className="text-slate-300 text-sm">Carregando registros...</div>
      ) : (
        <CardRegistro
          columns={columns}
          rows={rows}
          onDeleteMonth={handleDeleteMonth}
        />
      )}

      {/* Modal de edição de ativos */}
      <EditAtivosModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSaveAtivos}
        mesAnoInicial={mesAnoInicial}
      />
    </div>
  );
}
