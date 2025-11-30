// src/pages/Login.jsx
import { useState } from "react";
import { supabase } from "../supabaseClient";

export default function Login({ onNavigate }) {
  const [mode, setMode] = useState("login"); // "login" ou "register"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;

        onNavigate("dashboard");
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;

        alert("Conta criada! Verifique seu e-mail.");
        setMode("login");
      }
    } catch (err) {
      setErrorMsg(err.message || "Erro ao autenticar.");
    }

    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
        {/* LOGO / NOME DO SISTEMA */}
        <h1 className="text-3xl font-bold text-center text-[#1f3548] mb-6">
          upmoney
        </h1>

        <h2 className="text-xl font-semibold text-center text-[#1f3548] mb-1">
          {mode === "login" ? "Acessar conta" : "Criar conta"}
        </h2>

        <p className="text-center text-[#1f3548]/60 mb-6">
          {mode === "login"
            ? "Entre para acessar seu painel financeiro"
            : "Crie sua conta para começar"}
        </p>

        {/* FORM */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {errorMsg && (
            <div className="text-red-600 text-sm text-center">{errorMsg}</div>
          )}

          <div>
            <label className="block text-[#1f3548] mb-1">E-mail</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
              placeholder="seu@email.com"
            />
          </div>

          <div>
            <label className="block text-[#1f3548] mb-1">Senha</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white p-3 font-semibold transition disabled:opacity-60"
          >
            {loading
              ? "Processando..."
              : mode === "login"
              ? "Entrar"
              : "Criar conta"}
          </button>
        </form>

        {/* LINK ALTERAR MODO */}
        <div className="text-center mt-4">
          {mode === "login" ? (
            <p className="text-sm text-[#1f3548]">
              Ainda não tem conta?{" "}
              <button
                onClick={() => setMode("register")}
                className="underline text-emerald-600"
              >
                Criar agora
              </button>
            </p>
          ) : (
            <p className="text-sm text-[#1f3548]">
              Já tem conta?{" "}
              <button
                onClick={() => setMode("login")}
                className="underline text-emerald-600"
              >
                Fazer login
              </button>
            </p>
          )}
        </div>

        {/* LINK VOLTAR */}
        <button
          onClick={() => onNavigate("landing")}
          className="mt-6 w-full text-sm text-center text-[#1f3548]/70 underline"
        >
          Voltar ao início
        </button>

        <p className="mt-4 text-[11px] text-[#1f3548]/50 text-center leading-tight">
          Ao continuar, você concorda em utilizar o upmoney apenas para fins
          educacionais. Nenhuma informação constitui recomendação de
          investimento.
        </p>
      </div>
    </div>
  );
}
