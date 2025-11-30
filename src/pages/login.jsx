// src/pages/Login.jsx
import { useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error("Erro ao fazer login:", error);
        setErrorMsg(error.message || "Não foi possível entrar. Tente novamente.");
        return;
      }

      setSuccessMsg("Login realizado com sucesso! Redirecionando...");
      // por enquanto, depois do login mandamos de volta para a home da aplicação
      setTimeout(() => {
        window.location.href = "/";
      }, 800);
    } catch (err) {
      console.error("Erro inesperado no login:", err);
      setErrorMsg("Erro inesperado. Tente novamente em instantes.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center px-4">
      {/* Card principal */}
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900/90 border border-slate-700/60">
            <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(34,197,94,0.8)]" />
            <span className="text-[11px] tracking-wide font-semibold text-slate-200">
              upControl • Acesso ao painel
            </span>
          </div>

          <h1 className="mt-4 text-3xl font-bold text-slate-50 tracking-tight">
            Entrar na plataforma
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Use o e-mail e senha cadastrados para acessar sua área.
          </p>
        </div>

        <div className="rounded-2xl bg-slate-900/90 border border-slate-700/70 shadow-2xl shadow-black/40 p-6">
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                E-mail
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="
                  w-full rounded-lg bg-slate-950/80 border border-slate-700/80 
                  px-3 py-2 text-sm text-slate-100
                  placeholder:text-slate-500
                  outline-none
                  focus:ring-2 focus:ring-emerald-500/70 focus:border-emerald-400
                "
                placeholder="admin@upmoney.local"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Senha
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="
                  w-full rounded-lg bg-slate-950/80 border border-slate-700/80 
                  px-3 py-2 text-sm text-slate-100
                  placeholder:text-slate-500
                  outline-none
                  focus:ring-2 focus:ring-emerald-500/70 focus:border-emerald-400
                "
                placeholder="••••••••"
              />
            </div>

            {errorMsg && (
              <div className="text-xs text-rose-300 bg-rose-950/40 border border-rose-500/40 rounded-lg px-3 py-2">
                {errorMsg}
              </div>
            )}

            {successMsg && (
              <div className="text-xs text-emerald-300 bg-emerald-950/40 border border-emerald-500/40 rounded-lg px-3 py-2">
                {successMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="
                mt-2 w-full inline-flex items-center justify-center gap-2
                rounded-lg bg-emerald-500 px-4 py-2.5
                text-sm font-semibold text-slate-950
                hover:bg-emerald-400
                disabled:opacity-60 disabled:cursor-not-allowed
                transition
              "
            >
              {loading ? "Entrando..." : "Entrar"}
            </button>
          </form>

          <p className="mt-4 text-[11px] text-slate-500 text-center">
            Acesso restrito. Em caso de dúvidas, contate o administrador.
          </p>
        </div>

        <button
          type="button"
          onClick={() => (window.location.href = "/")}
          className="mt-4 text-xs text-slate-400 hover:text-slate-200 transition block mx-auto"
        >
          ← Voltar para a página inicial
        </button>
      </div>
    </div>
  );
}
