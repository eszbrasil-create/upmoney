import { useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function ResetPassword({ onNavigate }) {
  const [senha, setSenha] = useState("");
  const [senha2, setSenha2] = useState("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setErro("");
    setMensagem("");

    if (!senha || !senha2) {
      setErro("Preencha os dois campos de senha.");
      return;
    }
    if (senha !== senha2) {
      setErro("As senhas não conferem.");
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase.auth.updateUser({ password: senha });
      setLoading(false);

      if (error) {
        setErro(error.message || "Não foi possível atualizar a senha.");
        return;
      }

      setMensagem("Senha atualizada com sucesso! Você já pode entrar novamente.");
    } catch (err) {
      console.error(err);
      setLoading(false);
      setErro("Erro inesperado ao atualizar a senha.");
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-slate-50">Redefinir senha</h1>
          <p className="mt-1 text-sm text-slate-400">
            Defina uma nova senha para acessar o upControl.
          </p>
        </div>

        <div className="rounded-2xl bg-slate-900/80 border border-slate-700/80 shadow-2xl shadow-emerald-500/10 p-5">
          {erro && (
            <div className="mb-3 rounded-lg border border-rose-500/60 bg-rose-500/10 px-3 py-2 text-xs text-rose-100">
              {erro}
            </div>
          )}

          {mensagem && (
            <div className="mb-3 rounded-lg border border-emerald-500/60 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-100">
              {mensagem}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-1">
              <label className="block text-xs font-medium text-slate-300">
                Nova senha
              </label>
              <input
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                placeholder="********"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-medium text-slate-300">
                Confirmar nova senha
              </label>
              <input
                type="password"
                value={senha2}
                onChange={(e) => setSenha2(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                placeholder="********"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:bg-emerald-500/60 disabled:cursor-not-allowed text-sm font-semibold text-slate-950 mt-3 py-2.5 transition"
            >
              {loading ? "Atualizando..." : "Salvar nova senha"}
            </button>
          </form>

          {onNavigate && (
            <button
              type="button"
              onClick={() => onNavigate("login")}
              className="mt-4 w-full text-[11px] text-slate-400 hover:text-slate-200 underline underline-offset-4"
            >
              Voltar para login
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
