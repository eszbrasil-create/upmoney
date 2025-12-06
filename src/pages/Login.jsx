// src/pages/Login.jsx
import { useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function Login({ onNavigate }) {
  const [mode, setMode] = useState("login"); // "login" | "signup"
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState(""); // ✅ mensagens de info/sucesso

  async function handleSubmit(e) {
    e.preventDefault();
    setErro("");
    setMensagem("");
    setLoading(true);

    try {
      if (mode === "login") {
        // 🔐 LOGIN NO SUPABASE
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password: senha,
        });

        if (error) throw error;

        console.log("Login OK:", data);

        // ✅ DEPOIS DO LOGIN, VAI DIRETO PRO DASHBOARD
        if (onNavigate) onNavigate("dashboard");
      } else {
        // 🆕 CRIAR CONTA NO SUPABASE
        const { data, error } = await supabase.auth.signUp({
          email,
          password: senha,
        });

        if (error) throw error;

        console.log("Cadastro OK:", data);
        alert(
          "Conta criada! Se houver confirmação de e-mail configurada no Supabase, verifique sua caixa de entrada. Depois faça login."
        );
        setMode("login");
      }
    } catch (err) {
      console.error(err);
      setErro(err.message || "Ocorreu um erro, tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  // ✅ Recuperar senha via e-mail
  async function handleResetPassword() {
    setErro("");
    setMensagem("");

    if (!email) {
      setErro("Informe seu e-mail para recuperar a senha.");
      return;
    }

    try {
      setLoading(true);

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      setLoading(false);

      if (error) {
        console.error(error);
        setErro(
          error.message ||
            "Não foi possível enviar o e-mail de recuperação. Tente novamente."
        );
        return;
      }

      setMensagem(
        "Enviamos um e-mail com o link para redefinir sua senha. Verifique sua caixa de entrada (e também o spam)."
      );
    } catch (err) {
      console.error(err);
      setLoading(false);
      setErro("Erro inesperado ao solicitar recuperação de senha.");
    }
  }

  const titulo =
    mode === "login" ? "Entrar no upControl" : "Criar minha conta no upControl";
  const subTitulo =
    mode === "login"
      ? "Acesse seu painel para acompanhar patrimônio, despesas e proventos."
      : "Crie uma conta para salvar seus dados com segurança na nuvem.";

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* LOGO / TÍTULO */}
        <div className="mb-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-emerald-500/50 mb-3">
            <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.7)]" />
            <span className="text-[11px] font-medium text-emerald-200 tracking-wide">
              upControl • Meu Patrimônio
            </span>
          </div>

          <h1 className="text-2xl font-bold text-slate-50">{titulo}</h1>
          <p className="mt-1 text-sm text-slate-400">{subTitulo}</p>
        </div>

        {/* CARD */}
        <div className="rounded-2xl bg-slate-900/80 border border-slate-700/80 shadow-2xl shadow-emerald-500/10 p-5">
          {/* Alternância login/cadastro */}
          <div className="flex items-center mb-4 text-xs bg-slate-800/80 rounded-full p-1">
            <button
              type="button"
              onClick={() => {
                setMode("login");
                setErro("");
                setMensagem("");
              }}
              className={`flex-1 py-1.5 rounded-full transition text-center ${
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
              className={`flex-1 py-1.5 rounded-full transition text-center ${
                mode === "signup"
                  ? "bg-emerald-500 text-slate-950 font-semibold"
                  : "text-slate-300 hover:text-white"
              }`}
            >
              Criar conta
            </button>
          </div>

          {/* Erro */}
          {erro && (
            <div className="mb-3 rounded-lg border border-rose-500/60 bg-rose-500/10 px-3 py-2 text-xs text-rose-100">
              {erro}
            </div>
          )}

          {/* Mensagem de info/sucesso */}
          {mensagem && (
            <div className="mb-3 rounded-lg border border-emerald-500/60 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-100">
              {mensagem}
            </div>
          )}

          {/* FORM */}
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-1">
              <label className="block text-xs font-medium text-slate-300">
                E-mail
              </label>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                placeholder="voce@exemplo.com"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-medium text-slate-300">
                Senha
              </label>
              <input
                type="password"
                required
                autoComplete={
                  mode === "login" ? "current-password" : "new-password"
                }
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                placeholder="Mínimo 6 caracteres"
              />

              {/* 🔑 Esqueci minha senha (só no modo login) */}
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
              className="w-full rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:bg-emerald-500/60 disabled:cursor-not-allowed text-sm font-semibold text-slate-950 mt-3 py-2.5 transition"
            >
              {loading
                ? "Processando..."
                : mode === "login"
                ? "Entrar"
                : "Criar minha conta"}
            </button>
          </form>

          <p className="mt-3 text-[10px] text-slate-500 text-center">
            Ao continuar, você concorda em usar o upControl apenas para fins
            educacionais. Nenhum conteúdo constitui recomendação de
            investimento.
          </p>

          {onNavigate && (
            <button
              type="button"
              onClick={() => onNavigate("landing")}
              className="mt-4 w-full text-[11px] text-slate-400 hover:text-slate-200 underline underline-offset-4"
            >
              Voltar para página inicial
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
