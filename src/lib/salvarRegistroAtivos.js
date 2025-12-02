// salvarRegistroAtivos.js
import { supabase } from "../lib/supabaseClient"; // ajuste o caminho se for diferente

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

  // 3. se não existir, cria; se existir, atualiza total
  if (!registroId) {
    const { data, error: insertError } = await supabase
      .from("registros_ativos")
      .insert({
        user_id: userId,
        mes_ano: mesAno,
        total,
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
        atualizado_em: new Date().toISOString(),
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

  // 5. inserir os novos itens (se houver)
  if (itens.length > 0) {
    const payload = itens.map((item) => ({
      registro_id: registroId,
      nome_ativo: item.nome,
      valor: item.valor, // já vem como número do modal
    }));

    const { error: insertItensError } = await supabase
      .from("registros_ativos_itens")
      .insert(payload);

    if (insertItensError) {
      console.error(insertItensError);
      throw new Error("Erro ao salvar itens de ativos.");
    }
  }

  return registroId;
}
