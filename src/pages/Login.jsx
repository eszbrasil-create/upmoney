// src/pages/Login.jsx
import { useMemo, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function Login({ onNavigate }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [showSenha, setShowSenha] = useState(false); // ✅ olho da senha
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");

  const titulo = useMemo(
    () =>
      mode === "login"
        ? "Entrar no UpControl"
        : "Criar minha conta no UpControl",
    [mode]
  );

  async function handleSubmit(e) {
    e.preventDefault();
    setErro("");
    setMensagem("");
    setLoading(true);

    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password: senha,
        });

        if (error) throw error;
        onNavigate?.("dashboard");
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password: senha,
        });

        if (error) throw error;

        setMensagem("Conta criada! Verifique seu e-mail se houver confirmação.");
        setMode("login");
        setShowSenha(false);
      }
    } catch (err) {
      setErro(err?.message || "Erro ao processar solicitação.");
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

      if (error) throw error;

      setMensagem(
        "Enviamos um link no seu e-mail para redefinir a senha. Verifique caixa de entrada e spam."
      );
    } catch (err) {
      console.error(err);
      setErro("Não foi possível enviar o e-mail de redefinição.");
    } finally {
      setLoading(false);
    }
  }

  const TopBackButton = () => (
    <button
      type="button"
      onClick={() => onNavigate?.("landing")}
      className="inline-flex items-center gap-2 text-sm text-slate-300 hover:text-white transition"
      title="Voltar para a página inicial"
    >
      <span className="text-lg leading-none">←</span>
      Voltar para a página inicial
    </button>
  );

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-5xl">
        {/* topo: voltar */}
        <div className="mb-6 flex items-center justify-between">
          <TopBackButton />

          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400">
            <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.55)]" />
          </div>
        </div>

        {/* NOVO LAYOUT: somente o formulário, centralizado */}
        <div className="flex justify-center">
          {/* LADO DIREITO (formulário) */}
          <div className="w-full max-w-md mx-auto">
            <div className="mb-6 text-center lg:text-left">
              <div className="lg:hidden mb-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-emerald-500/50">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.7)]" />
                  <span className="text-[11px] font-medium text-emerald-200 tracking-wide">
                    UpControl • Meu Patrimônio
                  </span>
                </div>
              </div>

              <h1 className="text-2xl font-bold text-slate-50">{titulo}</h1>
              <p className="mt-1 text-sm text-slate-400">
                {mode === "login"
                  ? "Acesse seu painel para acompanhar patrimônio, despesas e proventos."
                  : "Crie uma conta segura para salvar seus dados."}
              </p>
            </div>

            <div className="rounded-2xl bg-slate-900/80 border border-slate-700/80 shadow-2xl shadow-emerald-500/10 p-5">
              {/* toggle */}
              <div className="flex items-center mb-4 text-xs bg-slate-800/80 rounded-full p-1">
                <button
                  type="button"
                  onClick={() => {
                    setMode("login");
                    setErro("");
                    setMensagem("");
                    setShowSenha(false);
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
                    setShowSenha(false);
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
                    autoComplete="email"
                  />
                </div>

                {/* ✅ Senha com botão "olho" */}
                <div>
                  <label className="block text-xs font-medium text-slate-300">
                    Senha
                  </label>

                  <div className="relative">
                    <input
                      type={showSenha ? "text" : "password"}
                      required
                      value={senha}
                      onChange={(e) => setSenha(e.target.value)}
                      className="w-full rounded-lg bg-slate-950/60 border border-slate-700 px-3 py-2 pr-10 text-sm text-slate-100 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                      placeholder="Sua senha"
                      autoComplete={
                        mode === "login" ? "current-password" : "new-password"
                      }
                    />

                    <button
                      type="button"
                      onClick={() => setShowSenha((prev) => !prev)}
                      className="absolute inset-y-0 right-2 flex items-center text-slate-400 hover:text-slate-200 transition"
                      title={showSenha ? "Ocultar senha" : "Mostrar senha"}
                      aria-label={showSenha ? "Ocultar senha" : "Mostrar senha"}
                    >
                      {showSenha ? "🙈" : "👁️"}
                    </button>
                  </div>

                  {mode === "login" && (
                    <button
                      type="button"
                      onClick={handleResetPassword}
                      className="mt-1 text-[11px] text-emerald-300 hover:text-emerald-200 underline underline-offset-2"
                    >
                      Esqueci minha senha
                    </button>
                  )}
                </div>

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

                {/* extra: voltar (mobile) */}
                <div className="lg:hidden pt-2">
                  <button
                    type="button"
                    onClick={() => onNavigate?.("landing")}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950/40 py-2.5 text-sm font-semibold text-slate-200 hover:bg-slate-800/40 transition"
                  >
                    ← Voltar para a página inicial
                  </button>
                </div>
              </form>

              <div className="mt-4 text-[11px] text-slate-500 leading-relaxed">
                Ao entrar/criar conta, você concorda com o uso do app para fins
                de organização financeira. Conteúdo educacional — não constitui
                recomendação de investimento.
              </div>
            </div>

            {/* “Seguro…” embaixo (mobile), já que no topo some no xs */}
            <div className="sm:hidden mt-4 flex items-center justify-center gap-2 text-xs text-slate-400">
              <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.55)]" />
              Seguro • Seus dados ficam só com você
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
