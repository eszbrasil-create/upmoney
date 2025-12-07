// src/pages/Login.jsx
import { useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function Login({ onNavigate }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setErro("");
    setMensagem("");
    setLoading(true);

    try {
      if (mode === "login") {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password: senha,
        });

        if (error) throw error;
        if (onNavigate) onNavigate("dashboard");
      } else {
        const { error } = await supabase.auth.signUp({ email, password: senha });
        if (error) throw error;

        alert("Conta criada! Verifique seu e-mail se houver confirmação.");
        setMode("login");
      }
    } catch (err) {
      setErro(err.message || "Erro ao processar solicitação.");
    } finally {
      setLoading(false);
    }
  }

  async function handleResetPassword() {
    setErro("");
    setMensagem("");

    if (!email) {
      setErro("Informe seu e-mail antes de solicitar recuperação.");
      return;
    }

    try {
      setLoading(true);

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/#reset-password`,
      });

      setLoading(false);

      if (error) throw error;

      setMensagem(
        "Enviamos um link no seu e-mail para redefinir a senha. Verifique caixa de entrada e spam."
      );
    } catch (err) {
      console.error(err);
      setErro("Não foi possível enviar o e-mail de redefinição.");
      setLoading(false);
    }
  }

  const titulo =
    mode === "login" ? "Entrar no upControl" : "Criar minha conta no upControl";

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-emerald-500/50 mb-3">
            <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.7)]" />
            <span className="text-[11px] font-medium text-emerald-200 tracking-wide">
              upControl • Meu Patrimônio
            </span>
          </div>

          <h1 className="text-2xl font-bold text-slate-50">{titulo}</h1>
          <p className="mt-1 text-sm text-slate-400">
            {mode === "login"
              ? "Acesse seu painel para acompanhar patrimônio, despesas e proventos."
              : "Crie uma conta segura para salvar seus dados."}
          </p>
        </div>

        <div className="rounded-2xl bg-slate-900/80 border border-slate-700/80 shadow-2xl shadow-emerald-500/10 p-5">
          <div className="flex items-center mb-4 text-xs bg-slate-800/80 rounded-full p-1">
            <button
              type="button"
              onClick={() => {
                setMode("login");
                setErro("");
                setMensagem("");
              }}
              className={`flex-1 py-1.5 rounded-full transition ${
                mode === "login"
                  ? "bg-emerald-500 text-slate-950 font-semibold"
                  : "text-slate-300 hover:text-white"
              }`}
            >
              Entrar
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("signup");
                setErro("");
                setMensagem("");
              }}
              className={`flex-1 py-1.5 rounded-full transition ${
                mode === "signup"
                  ? "bg-emerald-500 text-slate-950 font-semibold"
                  : "text-slate-300 hover:text-white"
              }`}
            >
              Criar conta
            </button>
          </div>

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
            <div>
              <label className="block text-xs font-medium text-slate-300">
                E-mail
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg bg-slate-950/60 border border-slate-700 px-3 py-2 text-sm text-slate-100 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                placeholder="voce@exemplo.com"
              />
            </div>

            {mode === "login" && (
              <div>
                <label className="block text-xs font-medium text-slate-300">
                  Senha
                </label>
                <input
                  type="password"
                  required
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  className="w-full rounded-lg bg-slate-950/60 border border-slate-700 px-3 py-2 text-sm text-slate-100 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                  placeholder="Sua senha"
                />

                <button
                  type="button"
                  onClick={handleResetPassword}
                  className="mt-1 text-[11px] text-emerald-300 hover:text-emerald-200 underline underline-offset-2"
                >
                  Esqueci minha senha
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:bg-emerald-500/60 py-2.5 text-sm font-semibold text-slate-950 transition"
            >
              {loading
                ? "Processando..."
                : mode === "login"
                ? "Entrar"
                : "Criar minha conta"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
