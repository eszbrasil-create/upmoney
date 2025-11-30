// src/pages/Login.jsx
import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";

export default function Login() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [msgErro, setMsgErro] = useState("");
  const [msgInfo, setMsgInfo] = useState("");

  // Se já estiver logado, manda direto para "/"
  useEffect(() => {
    let isMounted = true;

    async function checkSession() {
      const { data } = await supabase.auth.getUser();
      if (!isMounted) return;
      if (data?.user) {
        // Já logado → volta para o app principal
        window.location.href = "/";
      }
    }

    checkSession();
    return () => {
      isMounted = false;
    };
  }, []);

  async function handleLogin(e) {
    e.preventDefault();
    setMsgErro("");
    setMsgInfo("");

    if (!email || !senha) {
      setMsgErro("Preencha email e senha para entrar.");
      return;
    }

    try {
      setLoading(true);

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: senha,
      });

      if (error) {
        console.error("Erro no login:", error);
        // Mensagens mais amigáveis para alguns casos comuns
        if (error.message.toLowerCase().includes("invalid login")) {
          setMsgErro("Email ou senha inválidos. Tente novamente.");
        } else if (error.message.toLowerCase().includes("email not confirmed")) {
          setMsgErro(
            "Seu email ainda não foi confirmado. Verifique sua caixa de entrada."
          );
        } else {
          setMsgErro("Não foi possível entrar. Tente novamente em instantes.");
        }
        return;
      }

      if (data?.user) {
        // Login OK → recarrega app principal
        window.location.href = "/";
      } else {
        setMsgErro("Não foi possível entrar. Tente novamente.");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleResetPassword() {
    setMsgErro("");
    setMsgInfo("");

    if (!email) {
      setMsgErro("Informe o email para enviar o link de redefinição.");
      return;
    }

    try {
      setLoading(true);

      const redirectTo = `${window.location.origin}/login`;

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo,
      });

      if (error) {
        console.error("Erro ao enviar email de redefinição:", error);
        setMsgErro(
          "Não foi possível enviar o link de redefinição. Tente novamente."
        );
        return;
      }

      setMsgInfo(
        "Enviamos um email com o link para redefinir sua senha. Confira sua caixa de entrada (e o spam)."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Card principal */}
        <div className="mb-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900 border border-emerald-500/40 shadow-lg shadow-emerald-500/15">
            <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
            <span className="text-xs tracking-wide text-emerald-200">
              upControl • Meu Patrimônio
            </span>
          </div>

          <h1 className="mt-4 text-2xl font-semibold tracking-tight">
            Entrar na sua conta
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Acompanhe seu patrimônio, proventos e evolução em um só lugar.
          </p>
        </div>

        <div className="rounded-2xl bg-slate-900/80 border border-slate-800 shadow-2xl shadow-black/60 p-6 backdrop-blur">
          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-200">
                Email
              </label>
              <input
                type="email"
                className="w-full rounded-lg bg-slate-950/80 border border-slate-700 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/70 placeholder:text-slate-500"
                placeholder="voce@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>

            {/* Senha */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-200">
                Senha
              </label>
              <input
                type="password"
                className="w-full rounded-lg bg-slate-950/80 border border-slate-700 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/70 placeholder:text-slate-500"
                placeholder="••••••••"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                autoComplete="current-password"
              />
            </div>

            {/* Mensagens */}
            {msgErro && (
              <div className="rounded-lg border border-rose-500/60 bg-rose-500/10 px-3 py-2 text-xs text-rose-100">
                {msgErro}
              </div>
            )}
            {msgInfo && (
              <div className="rounded-lg border border-emerald-500/60 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-100">
                {msgInfo}
              </div>
            )}

            {/* Botão Entrar */}
            <button
              type="submit"
              disabled={loading}
              className="
                w-full inline-flex items-center justify-center gap-2
                rounded-lg bg-emerald-500 px-4 py-2.5
                text-sm font-semibold text-slate-950
                hover:bg-emerald-400 disabled:opacity-60 disabled:cursor-not-allowed
                transition
              "
            >
              {loading ? (
                <>
                  <span className="h-3 w-3 rounded-full border-2 border-slate-900 border-t-transparent animate-spin" />
                  <span>Entrando...</span>
                </>
              ) : (
                <span>Entrar</span>
              )}
            </button>
          </form>

          {/* Links extras */}
          <div className="mt-4 flex flex-col gap-2 text-xs text-slate-400">
            <button
              type="button"
              onClick={handleResetPassword}
              className="text-left text-emerald-300 hover:text-emerald-200 underline underline-offset-2 decoration-emerald-500/60"
              disabled={loading}
            >
              Esqueci minha senha
            </button>

            <p className="text-[11px] text-slate-500">
              Ainda não tem acesso? Neste momento o cadastro é liberado apenas
              para usuários convidados. Entre em contato para solicitar uma
              conta.
            </p>
          </div>
        </div>

        {/* Rodapé pequeno */}
        <div className="mt-4 text-center">
          <p className="text-[11px] text-slate-600">
            Este sistema tem caráter educacional e não constitui recomendação de
            investimento.
          </p>
        </div>
      </div>
    </div>
  );
}
