// src/pages/ResetPassword.jsx
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";

export default function ResetPassword({ onNavigate }) {
  const [senha, setSenha] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const [statusMsg, setStatusMsg] = useState("");
  const [statusTipo, setStatusTipo] = useState("info"); // "info" | "erro" | "sucesso"
  const [loading, setLoading] = useState(false);
  const [linkValido, setLinkValido] = useState(true);

  // Verifica se o Supabase trouxe um access_token na URL
  useEffect(() => {
    const hash = window.location.hash || "";
    if (!hash.includes("access_token")) {
      setStatusMsg("❌ Link inválido ou expirado. Solicite uma nova recuperação de senha.");
      setStatusTipo("erro");
      setLinkValido(false);
    }
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();

    if (!linkValido) {
      setStatusMsg("❌ Este link de redefinição não é válido. Peça um novo no login.");
      setStatusTipo("erro");
      return;
    }

    if (senha.length < 6) {
      setStatusMsg("⚠️ A senha precisa ter pelo menos 6 caracteres.");
      setStatusTipo("erro");
      return;
    }

    if (senha !== confirmacao) {
      setStatusMsg("⚠️ As senhas não coincidem.");
      setStatusTipo("erro");
      return;
    }

    setLoading(true);
    setStatusMsg("");
    setStatusTipo("info");

    const { error } = await supabase.auth.updateUser({
      password: senha,
    });

    setLoading(false);

    if (error) {
      setStatusMsg("❌ Erro ao redefinir senha: " + error.message);
      setStatusTipo("erro");
      return;
    }

    setStatusMsg("✅ Senha redefinida com sucesso! Você já pode entrar com a nova senha.");
    setStatusTipo("sucesso");

    // Redireciona para o login após 2s
    setTimeout(() => {
      if (onNavigate) onNavigate("login");
    }, 2000);
  }

  const msgClasses =
    statusTipo === "erro"
      ? "text-rose-300"
      : statusTipo === "sucesso"
      ? "text-emerald-300"
      : "text-slate-300";

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
          <div className={`mb-4 text-center text-sm font-medium ${msgClasses}`}>
            {statusMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs text-slate-400">Nova senha</label>
            <input
              type="password"
              className="w-full mt-1 p-2 rounded-lg bg-slate-950 border border-slate-700 text-white outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              disabled={loading || !linkValido}
            />
          </div>

          <div>
            <label className="text-xs text-slate-400">
              Confirmar nova senha
            </label>
            <input
              type="password"
              className="w-full mt-1 p-2 rounded-lg bg-slate-950 border border-slate-700 text-white outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              value={confirmacao}
              onChange={(e) => setConfirmacao(e.target.value)}
              disabled={loading || !linkValido}
            />
          </div>

          <button
            type="submit"
            disabled={loading || !linkValido}
            className="w-full py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 transition font-semibold text-slate-950 disabled:bg-emerald-800 disabled:text-slate-600 disabled:cursor-not-allowed"
          >
            {loading ? "Atualizando..." : "Salvar Nova Senha"}
          </button>
        </form>

        {onNavigate && (
          <button
            type="button"
            onClick={() => onNavigate("login")}
            className="mt-4 w-full text-[11px] text-slate-400 hover:text-slate-200 underline underline-offset-4 text-center"
          >
            Voltar para o login
          </button>
        )}
      </div>
    </div>
  );
}
