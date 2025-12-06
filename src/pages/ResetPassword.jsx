import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";

export default function ResetPassword({ onNavigate }) {
  const [senha, setSenha] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const [statusMsg, setStatusMsg] = useState("");
  const [loading, setLoading] = useState(false);

  // Verifica se o Supabase reconheceu o token da URL
  useEffect(() => {
    const hash = window.location.hash;
    if (!hash.includes("access_token")) {
      setStatusMsg("❌ Link inválido ou expirado. Solicite novamente.");
    }
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();

    if (senha.length < 6) {
      return setStatusMsg("⚠️ A senha precisa ter pelo menos 6 caracteres.");
    }

    if (senha !== confirmacao) {
      return setStatusMsg("⚠️ As senhas não coincidem.");
    }

    setLoading(true);
    setStatusMsg("");

    const { data, error } = await supabase.auth.updateUser({
      password: senha,
    });

    setLoading(false);

    if (error) {
      return setStatusMsg("❌ Erro ao redefinir senha: " + error.message);
    }

    setStatusMsg("✅ Senha redefinida com sucesso! Você pode entrar agora.");

    // Redireciona após 2s
    setTimeout(() => {
      if (onNavigate) onNavigate("login");
    }, 2000);
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl bg-slate-900/80 border border-slate-700/80 shadow-2xl p-6">
        
        <h2 className="text-2xl font-bold text-emerald-400 text-center mb-2">
          Redefinir Senha
        </h2>

        <p className="text-slate-400 text-sm text-center mb-6">
          Digite sua nova senha abaixo.
        </p>

        {statusMsg && (
          <div className="mb-4 text-center text-sm font-medium text-emerald-300">
            {statusMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs text-slate-400">Nova senha</label>
            <input
              type="password"
              className="w-full mt-1 p-2 rounded-lg bg-slate-950 border border-slate-700 text-white"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
            />
          </div>

          <div>
            <label className="text-xs text-slate-400">
              Confirmar nova senha
            </label>
            <input
              type="password"
              className="w-full mt-1 p-2 rounded-lg bg-slate-950 border border-slate-700 text-white"
              value={confirmacao}
              onChange={(e) => setConfirmacao(e.target.value)}
            />
          </div>

          <button
            disabled={loading}
            className="w-full py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 transition font-semibold text-slate-950 disabled:bg-emerald-800 disabled:text-slate-600"
          >
            {loading ? "Atualizando..." : "Salvar Nova Senha"}
          </button>
        </form>
      </div>
    </div>
  );
}
