// src/App.jsx - updated (reset password + courses menu)
import { useEffect, useMemo, useState, useCallback } from "react";
import AppLayout from "./layouts/AppLayout";

import CardResumo from "./components/cards/CardResumo";
import CardRegistro from "./components/cards/CardRegistro";
import CardEvolucao from "./components/cards/CardEvolucao";
import CardEvolucaoPct from "./components/cards/CardEvolucaoPct";
import CardParticipacao from "./components/cards/CardParticipacao";
import CardDividendosCash from "./components/cards/CardDividendosCash";

import CarteiraCash from "./pages/CarteiraCash";
import Despesas from "./pages/Despesas";
import Relatorios from "./pages/Relatorios";
import CursosPage from "./pages/CursosPage";
import Landing from "./pages/Landing";
import SaidaFiscal from "./pages/SaidaFiscal";
import InvistaExterior from "./pages/InvistaExterior";
import Cursos from "./pages/Cursos";
import Noticias from "./pages/Noticias";
import CashControlHome from "./pages/CashControlHome";
import Login from "./pages/Login.jsx";
import ResetPassword from "./pages/ResetPassword.jsx";

// new course pages
import CursosMenu from "./pages/CursosMenu.jsx";
import CursoConfiguracaoMental from "./pages/CursoConfiguracaoMental.jsx";

import { supabase } from "./lib/supabaseClient";
import { deleteRegistroAtivosPorMesAno } from "./components/modals/EditAtivosModal";

const MES_IDX = {
  Jan: 0,
  Fev: 1,
  Mar: 2,
  Abr: 3,
  Mai: 4,
  Jun: 5,
  Jul: 6,
  Ago: 7,
  Set: 8,
  Out: 9,
  Nov: 10,
  Dez: 11,
};

// load records from supabase
async function carregarRegistrosAtivos() {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return {};

  const { data: registros } = await supabase
    .from("registros_ativos")
    .select("id, mes_ano")
    .eq("user_id", user.id)
    .order("mes_ano", { ascending: false });

  if (!registros || registros.length === 0) return {};

  const { data: itens } = await supabase
    .from("registros_ativos_itens")
    .select("registro_id, nome_ativo, valor");

  const porMes = {};
  registros.forEach((reg) => {
    porMes[reg.mes_ano] = [];
  });

  itens?.forEach((i) => {
    const reg = registros.find((r) => r.id === i.registro_id);
    if (reg) {
      porMes[reg.mes_ano].push({
        nome: i.nome_ativo,
        valor: Number(i.valor),
      });
    }
  });

  return porMes;
}

// dashboard
function DashboardMain({ registrosPorMes, onDeleteMonth }) {
  const columns = useMemo(
    () =>
      Object.keys(registrosPorMes).sort((a, b) => {
        const [ma, aa] = a.split("/");
        const [mb, ab] = b.split("/");
        const ya = parseInt(aa, 10);
        const yb = parseInt(ab, 10);
        const ia = MES_IDX[ma] ?? 0;
        const ib = MES_IDX[mb] ?? 0;
        return ya !== yb ? ya - yb : ia - ib;
      }),
    [registrosPorMes]
  );

  const rows = useMemo(() => {
    const ativos = new Set();
    columns.forEach((mes) =>
      (registrosPorMes[mes] || []).forEach((i) => ativos.add(i.nome))
    );
    return Array.from(ativos)
      .sort()
      .map((nome) => ({
        ativo: nome,
        valores: columns.map((mes) => {
          const item = (registrosPorMes[mes] || []).find(
            (i) => i.nome === nome
          );
          return item ? Number(item.valor) : 0;
        }),
      }));
  }, [columns, registrosPorMes]);

  const dadosResumo = useMemo(() => {
    if (columns.length === 0) {
      return {
        mesAtual: "-",
        patrimonioAtual: 0,
        comparativos: {},
        distribuicao: [],
      };
    }

    const totais = columns.map((mes) =>
      (registrosPorMes[mes] || []).reduce(
        (acc, item) => acc + (Number(item.valor) || 0),
        0
      )
    );

    const idxLast = columns.length - 1;
    const mesAtualKey = columns[idxLast];

    function pegarMesesAtras(qtd) {
      const pos = idxLast - qtd;
      return pos >= 0 ? totais[pos] : null;
    }

    return {
      mesAtual: mesAtualKey,
      patrimonioAtual: totais[idxLast],
      comparativos: {
        mesAnterior: pegarMesesAtras(1),
        m3: pegarMesesAtras(3),
        m6: pegarMesesAtras(6),
        m12: pegarMesesAtras(12),
      },
      distribuicao: [...(registrosPorMes[mesAtualKey] || [])].sort(
        (a, b) => b.valor - a.valor
      ),
    };
  }, [columns, registrosPorMes]);

  return (
    <div className="pt-1 pr-6 pl-0">
      <div className="flex items-start gap-3 flex-wrap md:flex-nowrap">
        <CardResumo data={dadosResumo} />
        <CardEvolucao columns={columns} rows={rows} />
      </div>
      <div className="mt-3 flex items-start gap-3 flex-wrap md:flex-nowrap">
        <CardRegistro
          columns={columns}
          rows={rows}
          onDeleteMonth={onDeleteMonth}
        />
        <CardDividendosCash columns={columns} />
      </div>
      <div className="mt-3 flex items-start gap-3 flex-wrap md:flex-nowrap">
        <CardEvolucaoPct columns={columns} rows={rows} />
        <CardParticipacao
          itens={dadosResumo.distribuicao}
          mesAtual={dadosResumo.mesAtual}
        />
      </div>
    </div>
  );
}

export default function App() {
  const [view, setView] = useState(() => {
    if (typeof window !== "undefined") {
      const path = window.location.pathname;
      const hash = window.location.hash;
      if (path === "/reset-password" || hash.includes("reset-password")) {
        return "reset-password";
      }
    }
    return "landing";
  });

  const [user, setUser] = useState(null);
  const [authLoaded, setAuthLoaded] = useState(false);
  const [registrosPorMes, setRegistrosPorMes] = useState({});
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const refreshData = useCallback(
    () => setRefreshTrigger((t) => t + 1),
    []
  );

  useEffect(() => {
    if (!user) {
      setRegistrosPorMes({});
      return;
    }
    carregarRegistrosAtivos().then(setRegistrosPorMes);
  }, [user, refreshTrigger]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user ?? null));
    supabase.auth.onAuthStateChange((_event, session) =>
      setUser(session?.user ?? null)
    );
    setAuthLoaded(true);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const hash = window.location.hash || "";
    const path = window.location.pathname;
    if (path === "/reset-password" || hash.includes("type=recovery")) {
      setView("reset-password");
    }
  }, []);

  const handleDeleteMonth = async (mesAno) => {
    if (!confirm(`Excluir todos os ativos de ${mesAno}?`)) return;
    await deleteRegistroAtivosPorMesAno(mesAno);
    refreshData();
  };

  if (!authLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-300">
        Loading...
      </div>
    );
  }

  const protectedViews = [
    "dashboard",
    "cursos-dashboard",
    "cursos-menu",
    "curso-configuracao-mental",
    "carteira",
    "despesas",
    "relatorios",
    "mercado",
  ];

  if (!user && protectedViews.includes(view)) {
    setView("login");
  }

  const screens = {
    landing: <Landing onNavigate={setView} />,
    login: <Login onNavigate={setView} />,
    "reset-password": <ResetPassword onNavigate={setView} />,
    "saida-fiscal": <SaidaFiscal onNavigate={setView} />,
    "invista-exterior": <InvistaExterior onNavigate={setView} />,
    cursos: <Cursos onNavigate={setView} />,
    noticias: <Noticias onNavigate={setView} />,
    "cashcontrol-home": <CashControlHome onNavigate={setView} />,

    dashboard: (
      <DashboardMain
        registrosPorMes={registrosPorMes}
        onDeleteMonth={handleDeleteMonth}
      />
    ),

    "cursos-menu": <CursosMenu onNavigate={setView} />,
    "curso-configuracao-mental": (
      <CursoConfiguracaoMental onNavigate={setView} />
    ),

    "cursos-dashboard": <CursosPage />,

    carteira: <CarteiraCash />,
    despesas: <Despesas />,
    relatorios: <Relatorios />,
    mercado: <div className="p-6 text-white">Mercado (soon)</div>,
  };

  if (
    [
      "landing",
      "login",
      "reset-password",
      "saida-fiscal",
      "invista-exterior",
      "cursos",
      "noticias",
      "cashcontrol-home",
    ].includes(view)
  ) {
    return screens[view];
  }

  return (
    <AppLayout
      onNavigate={setView}
      currentView={view}
      refreshData={refreshData}
    >
      {screens[view]}
    </AppLayout>
  );
}
