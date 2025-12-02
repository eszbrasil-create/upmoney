// src/utils/salvarRegistroAtivos.js
import { supabase } from "../lib/supabaseClient";

export async function salvarRegistroAtivos({ mesAno, itens, total }) {
  // 1. pegar usuário logado
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("Usuário não autenticado.");
  }

  const userId = user.id;

  // 2. ver se já existe registro desse mês para esse usuário
  const { data: existente, error: selectError } = await supabase
    .from("registros_ativos")
    .select("id")
    .eq("user_id", userId)
    .eq("mes_ano", mesAno)
    .maybeSingle();

  if (selectError && selectError.code !== "PGRST116") {
    // PGRST116 = no rows
    console.error(selectError);
    throw new Error("Erro ao buscar registro existente.");
  }

  let registroId = existente?.id;

  /* ================================
     CASO 1: NENHUM ITEM -> APAGAR TUDO
     (apaga itens + cabeçalho apenas desse mês/usuário)
     ================================ */
  if (!itens || itens.length === 0) {
    if (!registroId) {
      // não tem nada pra apagar
      return null;
    }

    // Apaga itens desse registro
    const { error: deleteItensError } = await supabase
      .from("registros_ativos_itens")
      .delete()
      .eq("registro_id", registroId);

    if (deleteItensError) {
      console.error(deleteItensError);
      throw new Error("Erro ao limpar itens anteriores.");
    }

    // Apaga o cabeçalho em registros_ativos
    const { error: deleteHeaderError } = await supabase
      .from("registros_ativos")
      .delete()
      .eq("id", registroId);

    if (deleteHeaderError) {
      console.error(deleteHeaderError);
      throw new Error("Erro ao apagar registro de ativos.");
    }

    return null;
  }

  /* ================================
     CASO 2: TEM ITENS -> CRIAR/ATUALIZAR
     ================================ */
  const agora = new Date().toISOString();

  // 3. se não existir, cria; se existir, atualiza total
  if (!registroId) {
    const { data, error: insertError } = await supabase
      .from("registros_ativos")
      .insert({
        user_id: userId,
        mes_ano: mesAno,
        total,
        created_at: agora,
        atualizado_em: agora,
      })
      .select("id")
      .single();

    if (insertError) {
      console.error(insertError);
      throw new Error("Erro ao criar registro de ativos.");
    }

    registroId = data.id;
  } else {
    const { error: updateError } = await supabase
      .from("registros_ativos")
      .update({
        total,
        atualizado_em: agora,
      })
      .eq("id", registroId);

    if (updateError) {
      console.error(updateError);
      throw new Error("Erro ao atualizar registro de ativos.");
    }
  }

  // 4. limpar itens antigos desse registro
  const { error: deleteError } = await supabase
    .from("registros_ativos_itens")
    .delete()
    .eq("registro_id", registroId);

  if (deleteError) {
    console.error(deleteError);
    throw new Error("Erro ao limpar itens anteriores.");
  }

  // 5. inserir os novos itens (agora com certeza length > 0)
  const payload = itens.map((item) => ({
    registro_id: registroId,
    user_id: userId,
    nome_ativo: item.nome,
    valor: item.valor, // já vem como número do modal
    created_at: agora,
    atualizado_em: agora,
  }));

  const { error: insertItensError } = await supabase
    .from("registros_ativos_itens")
    .insert(payload);

  if (insertItensError) {
    console.error(insertItensError);
    throw new Error("Erro ao salvar itens de ativos.");
  }

  return registroId;
}
