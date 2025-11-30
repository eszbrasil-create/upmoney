// src/pages/Login.jsx
import { useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function Login() {
  const [mode, setMode] = useState("login"); // "login" | "signup"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      if (mode === "login") {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        console.log("Login ok:", data);
        setMessage("Login realizado com sucesso. Abra o painel para continuar.");
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) throw error;

        setMessage(
          "Conta criada. Confira seu e-mail se a confirmação estiver ativada."
        );
      }
    } catch (err) {
      console.error(err);
      setError(err.message ?? "Erro ao autenticar.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <div className="inline-flex items-center rounded-full border border-slate-700 px-3 py-1 mb-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400 mr-2" />
            <span className="text-[11px] tracking-wide uppercase text-slate-300">
              upControl • acesso seguro
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-50">Entrar no painel</h1>
          <p className="mt-1 text-sm text-slate-400">
            Use seu e-mail e senha para acessar sua carteira, despesas e cursos.
          </p>
        </div>

        <div className="bg-slate-900/80 border border-slate-700/70 rounded-2xl p-5 shadow-xl">
          {/* Alternância Login / Cadastro */}
          <div className="flex mb-4 text-xs font-semibold text-slate-300 bg-slate-800 rounded-xl p-1">
            <button
              type="button"
              onClick={() => {
                setMode("login");
                setError("");
                setMessage("");
              }}
              className={`flex-1 rounded-lg py-1.5 transition ${
                mode === "login"
                  ? "bg-emerald-500 text-slate-950"
                  : "bg-transparent hover:bg-slate-700/70"
              }`}
            >
              Já tenho conta
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("signup");
                setError("");
                setMessage("");
              }}
              className={`flex-1 rounded-lg py-1.5 transition ${
                mode === "signup"
                  ? "bg-sky-500 text-slate-950"
                  : "bg-transparent hover:bg-slate-700/70"
              }`}
            >
              Criar conta
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                E-mail
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-sm text-slate-100 outline-none focus:border-emerald-500"
                placeholder="voce@exemplo.com"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Senha
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-sm text-slate-100 outline-none focus:border-emerald-500"
                placeholder="••••••••"
              />
              <p className="mt-1 text-[11px] text-slate-500">
                Mínimo 6 caracteres. Você poderá alterar depois.
              </p>
            </div>

            {error && (
              <div className="rounded-lg bg-rose-500/10 border border-rose-500/50 px-3 py-2 text-[12px] text-rose-100">
                {error}
              </div>
            )}

            {message && (
              <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/50 px-3 py-2 text-[12px] text-emerald-100">
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:opacity-70 disabled:cursor-wait text-sm font-semibold text-slate-950 py-2.5 mt-1 transition"
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
            educacionais. Nenhum conteúdo constitui recomendação de investimento.
          </p>
        </div>
      </div>
    </div>
  );
}
