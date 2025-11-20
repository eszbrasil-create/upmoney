// src/pages/Relatorios.jsx
// Painel de Relatórios — Visão geral lúdica do patrimônio, despesas e evolução

import React, { useEffect, useMemo, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { AlertTriangle, TrendingUp, TrendingDown, Info } from "lucide-react";

// Mapa para ordenar meses "MMM/AAAA"
const MES_IDX = {
  Jan: 0, Fev: 1, Mar: 2, Abr: 3, Mai: 4, Jun: 5,
  Jul: 6, Ago: 7, Set: 8, Out: 9, Nov: 10, Dez: 11,
};

const MESES_CURTOS = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];

const PIE_COLORS = ["#22c55e", "#0ea5e9", "#eab308", "#f97316", "#a855f7", "#f97373"];

const toNum = (x) => {
  if (x === "" || x === null || x === undefined) return 0;
  const n = Number(String(x).replace(",", "."));
  return Number.isFinite(n) ? n : 0;
};

const fmtBR = (v) =>
  Number(v || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 2,
  });

/**
 * Espera receber via props:
 *  - registrosPorMes: { "Jan/2025": [ {nome, valor}, ... ], ... }
 *   (Assim como o DashboardMain recebe do AppLayout)
 */
export default function Relatorios({ registrosPorMes = {} }) {
  const anoAtual = new Date().getFullYear();

  // ====== 1) Patrimônio por mês (CashControl) ======
  const mesesOrdenados = useMemo(() => {
    return Object.keys(registrosPorMes).sort((a, b) => {
      const [ma, aa] = a.split("/");
      const [mb, ab] = b.split("/");
      const ya = parseInt(aa, 10);
      const yb = parseInt(ab, 10);
      const ia = MES_IDX[ma] ?? 0;
      const ib = MES_IDX[mb] ?? 0;
      if (ya !== yb) return ya - yb;
      return ia - ib;
    });
  }, [registrosPorMes]);

  const patrimonioData = useMemo(() => {
    return mesesOrdenados.map((mesChave) => {
      const lista = registrosPorMes[mesChave] || [];
      const total = lista.reduce((acc, it) => acc + (Number(it.valor) || 0), 0);
      return { mes: mesChave, patrimonio: total };
    });
  }, [mesesOrdenados, registrosPorMes]);

  const patrimonioAtual = patrimonioData.length
    ? patrimonioData[patrimonioData.length - 1].patrimonio
    : 0;
  const patrimonioInicial = patrimonioData.length
    ? patrimonioData[0].patrimonio
    : 0;
  const variacaoPatrimonioPct =
    patrimonioInicial > 0
      ? ((patrimonioAtual - patrimonioInicial) / patrimonioInicial) * 100
      : 0;

  // Distribuição atual da carteira (último mês)
  const distribuicaoAtual = useMemo(() => {
    if (!patrimonioData.length) return [];
    const ultimoMesChave = mesesOrdenados[mesesOrdenados.length - 1];
    const itens = (registrosPorMes[ultimoMesChave] || []).map((i) => ({
      nome: i.nome,
      valor: Number(i.valor) || 0,
    }));
    const filtrados = itens.filter((i) => i.valor > 0);
    const topOrdenados = filtrados.sort((a, b) => b.valor - a.valor);
    const top5 = topOrdenados.slice(0, 5);
    const resto = topOrdenados.slice(5);
    const somaResto = resto.reduce((acc, it) => acc + it.valor, 0);
    if (somaResto > 0) {
      top5.push({ nome: "Outros", valor: somaResto });
    }
    return top5;
  }, [mesesOrdenados, patrimonioData, registrosPorMes]);

  const totalDistribuicao = distribuicaoAtual.reduce(
    (acc, it) => acc + it.valor,
    0
  );

  // ====== 2) Resumo de Despesas (localStorage do módulo Despesas) ======
  const [despResumo, setDespResumo] = useState({
    receitasMes: Array(12).fill(0),
    despesasMes: Array(12).fill(0),
    saldoMes: Array(12).fill(0),
    totalReceitasAno: 0,
    totalDespesasAno: 0,
    saldoAno: 0,
  });

  useEffect(() => {
    try {
      if (typeof window === "undefined") return;
      const raw = localStorage.getItem(`cc_despesas_${anoAtual}`);
      if (!raw) return;

      const linhas = JSON.parse(raw);
      const receitasMes = Array(12).fill(0);
      const despesasMes = Array(12).fill(0);

      for (const l of linhas) {
        for (let i = 0; i < 12; i++) {
          const n = toNum(l.valores?.[i]);
          if (l.tipo === "RECEITA") receitasMes[i] += n;
          else if (l.tipo === "DESPESA") despesasMes[i] += n;
        }
      }

      const saldoMes = receitasMes.map((v, i) => v - despesasMes[i]);
      const sum = (arr) => arr.reduce((a, b) => a + b, 0);

      setDespResumo({
        receitasMes,
        despesasMes,
        saldoMes,
        totalReceitasAno: sum(receitasMes),
        totalDespesasAno: sum(despesasMes),
        saldoAno: sum(receitasMes) - sum(despesasMes),
      });
    } catch (e) {
      console.error("Erro ao ler cc_despesas_", anoAtual, e);
    }
  }, [anoAtual]);

  const barData = MESES_CURTOS.map((m, i) => ({
    mes: m,
    Receitas: despResumo.receitasMes[i],
    Despesas: despResumo.despesasMes[i],
    Saldo: despResumo.saldoMes[i],
  }));

  // ====== 3) Insights automáticos ======
  const insights = useMemo(() => {
    const lista = [];

    // Patrimônio
    if (patrimonioAtual > 0 && patrimonioInicial > 0) {
      const dir = variacaoPatrimonioPct >= 0 ? "cresceu" : "caiu";
      lista.push({
        tipo: variacaoPatrimonioPct >= 0 ? "positivo" : "alerta",
        titulo: "Evolução do patrimônio",
        texto: `Seu patrimônio ${dir} aproximadamente ${variacaoPatrimonioPct.toFixed(
          1
        )}% desde o primeiro registro.`,
      });
    }

    // Concentração
    if (distribuicaoAtual.length && totalDistribuicao > 0) {
      const maior = distribuicaoAtual.reduce(
        (acc, it) => (it.valor > acc.valor ? it : acc),
        distribuicaoAtual[0]
      );
      const pctMaior = (maior.valor / totalDistribuicao) * 100;
      if (pctMaior > 40) {
        lista.push({
          tipo: "alerta",
          titulo: "Concentração de carteira",
          texto: `O ativo "${maior.nome}" representa cerca de ${pctMaior.toFixed(
            1
          )}% da sua carteira no último mês. Avalie se isso faz sentido para o seu nível de risco.`,
        });
      } else {
        lista.push({
          tipo: "positivo",
          titulo: "Boa diversificação",
          texto: `Sua carteira está relativamente distribuída — nenhum ativo passa muito de 40% do total no último mês.`,
        });
      }
    }

    // Despesas x Receitas
    if (despResumo.totalReceitasAno > 0 || despResumo.totalDespesasAno > 0) {
      const { totalReceitasAno, totalDespesasAno, saldoAno } = despResumo;
      const percGasto =
        totalReceitasAno > 0
          ? (totalDespesasAno / totalReceitasAno) * 100
          : 0;

      if (saldoAno >= 0) {
        lista.push({
          tipo: "positivo",
          titulo: "Fluxo de caixa anual",
          texto: `Em ${anoAtual}, suas receitas superam as despesas em ${fmtBR(
            saldoAno
          )}. Você está gastando cerca de ${percGasto.toFixed(
            0
          )}% da renda declarada.`,
        });
      } else {
        lista.push({
          tipo: "alerta",
          titulo: "Atenção ao saldo anual",
          texto: `Em ${anoAtual}, as despesas superam as receitas em ${fmtBR(
            Math.abs(saldoAno)
          )}. Tente revisar categorias de gastos e reduzir o que não é essencial.`,
        });
      }
    }

    if (!lista.length) {
      lista.push({
        tipo: "neutro",
        titulo: "Comece alimentando seus dados",
        texto: "Preencha seus meses no CashControl e registre receitas/despesas para ver seus insights automáticos aqui.",
      });
    }

    return lista;
  }, [
    patrimonioAtual,
    patrimonioInicial,
    variacaoPatrimonioPct,
    distribuicaoAtual,
    totalDistribuicao,
    despResumo,
    anoAtual,
  ]);

  // ====== Layout ======
  return (
    <div className="pt-3 pr-6 pl-0 text-slate-100">
      <h1 className="text-2xl font-semibold mb-3">
        Relatórios — Visão Geral do Patrimônio
      </h1>

      <div className="grid gap-4 xl:grid-cols-[2fr,1.2fr]">
        {/* Coluna principal (gráficos) */}
        <div className="space-y-4">
          {/* Evolução do patrimônio */}
          <section className="rounded-xl bg-slate-900/70 border border-slate-700/80 shadow-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h2 className="text-sm font-semibold text-slate-100">
                  Evolução do Patrimônio
                </h2>
                <p className="text-xs text-slate-400">
                  Linha do tempo do valor total registrado no CashControl.
                </p>
              </div>
              <div className="text-right text-xs">
                <div className="text-slate-400">Patrimônio atual</div>
                <div className="text-lg font-semibold text-emerald-300">
                  {fmtBR(patrimonioAtual)}
                </div>
              </div>
            </div>

            <div className="h-56">
              {patrimonioData.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={patrimonioData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                    <XAxis
                      dataKey="mes"
                      stroke="#9ca3af"
                      fontSize={11}
                      tickMargin={6}
                    />
                    <YAxis
                      stroke="#9ca3af"
                      fontSize={11}
                      tickFormatter={(v) =>
                        v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v
                      }
                    />
                    <Tooltip
                      formatter={(value) => fmtBR(value)}
                      contentStyle={{
                        backgroundColor: "#020617",
                        borderColor: "#1f2937",
                        borderRadius: "0.5rem",
                        fontSize: "0.75rem",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="patrimonio"
                      stroke="#22c55e"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-slate-500">
                  Alimente alguns meses no CashControl para ver a evolução aqui.
                </div>
              )}
            </div>
          </section>

          {/* Receitas x Despesas */}
          <section className="rounded-xl bg-slate-900/70 border border-slate-700/80 shadow-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h2 className="text-sm font-semibold text-slate-100">
                  Receitas x Despesas ({anoAtual})
                </h2>
                <p className="text-xs text-slate-400">
                  Comparativo mensal entre o que entra e o que sai.
                </p>
              </div>
              <div className="text-right text-xs space-y-1">
                <div className="text-emerald-300">
                  Receitas: {fmtBR(despResumo.totalReceitasAno)}
                </div>
                <div className="text-rose-300">
                  Despesas: {fmtBR(despResumo.totalDespesasAno)}
                </div>
                <div
                  className={
                    despResumo.saldoAno >= 0
                      ? "text-emerald-300 font-semibold"
                      : "text-rose-300 font-semibold"
                  }
                >
                  Saldo: {fmtBR(despResumo.saldoAno)}
                </div>
              </div>
            </div>

            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                  <XAxis
                    dataKey="mes"
                    stroke="#9ca3af"
                    fontSize={11}
                    tickMargin={6}
                  />
                  <YAxis
                    stroke="#9ca3af"
                    fontSize={11}
                    tickFormatter={(v) =>
                      v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v
                    }
                  />
                  <Tooltip
                    formatter={(value) => fmtBR(value)}
                    contentStyle={{
                      backgroundColor: "#020617",
                      borderColor: "#1f2937",
                      borderRadius: "0.5rem",
                      fontSize: "0.75rem",
                    }}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: "0.7rem", color: "#e5e7eb" }}
                  />
                  <Bar dataKey="Receitas" fill="#22c55e" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Despesas" fill="#fb7185" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Saldo" fill="#60a5fa" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>
        </div>

        {/* Coluna lateral (distribuição + insights) */}
        <div className="space-y-4">
          {/* Distribuição atual da carteira */}
          <section className="rounded-xl bg-slate-900/70 border border-slate-700/80 shadow-lg p-4">
            <h2 className="text-sm font-semibold text-slate-100 mb-1">
              Distribuição da Carteira (último mês)
            </h2>
            <p className="text-xs text-slate-400 mb-3">
              Como seus ativos estão divididos no mês mais recente registrado.
            </p>

            <div className="h-48">
              {distribuicaoAtual.length && totalDistribuicao > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={distribuicaoAtual}
                      dataKey="valor"
                      nameKey="nome"
                      outerRadius={70}
                      innerRadius={35}
                      paddingAngle={3}
                    >
                      {distribuicaoAtual.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={PIE_COLORS[index % PIE_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value, _, props) => {
                        const pct =
                          (value / totalDistribuicao) * 100 || 0;
                        return [
                          `${fmtBR(value)} (${pct.toFixed(1)}%)`,
                          props?.payload?.nome || "Ativo",
                        ];
                      }}
                      contentStyle={{
                        backgroundColor: "#020617",
                        borderColor: "#1f2937",
                        borderRadius: "0.5rem",
                        fontSize: "0.75rem",
                      }}
                    />
                    <Legend
                      layout="vertical"
                      align="right"
                      verticalAlign="middle"
                      wrapperStyle={{
                        fontSize: "0.7rem",
                        color: "#e5e7eb",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-slate-500">
                  Registre pelo menos um mês com ativos para ver a
                  distribuição da carteira.
                </div>
              )}
            </div>
          </section>

          {/* Painel de insights */}
          <section className="rounded-xl bg-slate-900/70 border border-slate-700/80 shadow-lg p-4">
            <h2 className="text-sm font-semibold text-slate-100 mb-2">
              Painel de Insights
            </h2>
            <p className="text-xs text-slate-400 mb-3">
              Comentários automáticos sobre sua evolução, gastos e carteira.
            </p>

            <div className="space-y-3 max-h-72 overflow-y-auto pr-1 custom-scroll">
              {insights.map((item, idx) => {
                const Icon =
                  item.tipo === "alerta"
                    ? AlertTriangle
                    : item.tipo === "positivo"
                    ? TrendingUp
                    : Info;
                const corTexto =
                  item.tipo === "alerta"
                    ? "text-rose-300"
                    : item.tipo === "positivo"
                    ? "text-emerald-300"
                    : "text-slate-200";
                const corBg =
                  item.tipo === "alerta"
                    ? "bg-rose-500/10 border-rose-500/30"
                    : item.tipo === "positivo"
                    ? "bg-emerald-500/10 border-emerald-500/30"
                    : "bg-slate-700/40 border-slate-600/60";

                return (
                  <div
                    key={idx}
                    className={`rounded-lg border px-3 py-2.5 text-xs flex gap-2 ${corBg}`}
                  >
                    <Icon className={`${corTexto} mt-0.5 h-4 w-4 flex-shrink-0`} />
                    <div>
                      <div className={`font-semibold mb-0.5 ${corTexto}`}>
                        {item.titulo}
                      </div>
                      <div className="text-slate-200 text-[11px]">
                        {item.texto}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
