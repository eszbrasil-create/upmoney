// src/App.jsx
import { useMemo, useState } from "react";
import AppLayout from "./layouts/AppLayout";

import CardResumo from "./components/cards/CardResumo";
import CardRegistro from "./components/cards/CardRegistro";
import CardEvolucao from "./components/cards/CardEvolucao";
import CardEvolucaoPct from "./components/cards/CardEvolucaoPct";
import CardParticipacao from "./components/cards/CardParticipacao";
import CardDividendosCash from "./components/cards/CardDividendosCash";

// páginas internas do painel (com sidebar)
import CarteiraCash from "./pages/CarteiraCash";
import Despesas from "./pages/Despesas";
import Relatorios from "./pages/Relatorios";
import CursosPage from "./pages/CursosPage";

// landing hero
import Landing from "./pages/Landing";

// páginas full-screen (sem sidebar)
import SaidaFiscal from "./pages/SaidaFiscal";
import InvistaExterior from "./pages/InvistaExterior";
import Cursos from "./pages/Cursos";
import Noticias from "./pages/Noticias";
import CashControlHome from "./pages/CashControlHome";

// ---- Mapa dos meses
const MES_IDX = {
  Jan: 0, Fev: 1, Mar: 2, Abr: 3, Mai: 4, Jun: 5,
  Jul: 6, Ago: 7, Set: 8, Out: 9, Nov: 10, Dez: 11,
};

// ------------------ Dashboard ------------------
function DashboardMain({ registrosPorMes = {}, onDeleteMonth }) {
  const columns = useMemo(() => {
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

  const { rows } = useMemo(() => {
    const allAssets = new Set();
    for (const mes of columns) {
      (registrosPorMes[mes] || []).forEach((item) => allAssets.add(item.nome));
    }
    const assetsSorted = Array.from(allAssets).sort((a, b) =>
      a.localeCompare(b, "pt-BR")
    );
    const rows = assetsSorted.map((nomeAtivo) => {
      const valores = columns.map((mes) => {
        const lista = registrosPorMes[mes] || [];
        const item = lista.find((i) => i.nome === nomeAtivo);
        return item ? Number(item.valor) || 0 : 0;
      });
      return { ativo: nomeAtivo, valores };
    });
    return { rows };
  }, [columns, registrosPorMes]);

  const dadosResumo = useMemo(() => {
    const totaisMes = columns.map((mes) =>
      (registrosPorMes[mes] || []).reduce(
        (acc, it) => acc + (Number(it.valor) || 0),
        0
      )
    );
    const hasData = columns.length > 0;
    const idxUlt = hasData ? columns.length - 1 : -1;

    return {
      mesAtual: hasData ? columns[idxUlt] : "-",
      patrimonioAtual: hasData ? totaisMes[idxUlt] : 0,
      comparativos: {
        mesAnterior: idxUlt - 1 >= 0 ? totaisMes[idxUlt - 1] : 0,
        m3: idxUlt - 3 >= 0 ? totaisMes[idxUlt - 3] : 0,
        m6: idxUlt - 6 >= 0 ? totaisMes[idxUlt - 6] : 0,
        m12: idxUlt - 12 >= 0 ? totaisMes[idxUlt - 12] : 0,
      },
      distribuicao: hasData
        ? [...(registrosPorMes[columns[idxUlt]] || [])]
            .map((i) => ({ nome: i.nome, valor: Number(i.valor) || 0 }))
            .sort((a, b) => b.valor - a.valor)
        : [],
    };
  }, [columns, registrosPorMes]);

  return (
    <div className="pt-3 pr-6 pl-0">
      {/* Linha superior */}
      <div className="flex items-start gap-3 flex-wrap md:flex-nowrap">
        <CardResumo data={dadosResumo} />
        <CardEvolucao columns={columns} rows={rows} />
      </div>

      {/* Linha do meio – Registros + MEUS DIVIDENDOS */}
      <div className="mt-3 flex items-start gap-3 flex-wrap md:flex-nowrap">
        <CardRegistro
          columns={columns}
          rows={rows}
          onDeleteMonth={onDeleteMonth}
        />
        <CardDividendosCash columns={columns} />
      </div>

      {/* Linha inferior – Evolução % + PARTICIPAÇÃO */}
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

// ------------------ Mercado (placeholder) ------------------
function Mercado() {
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-[#1f3548]">Mercado</h2>
      <p className="mt-2 text-[#1f3548]/80">
        Área de cotações, insights e notícias (placeholder).
      </p>
    </div>
  );
}

// ------------------ App ------------------
export default function App() {
  const [view, setView] = useState("landing");

  const SCREEN = {
    // FULL-SCREEN (sem sidebar)
    landing: <Landing onNavigate={setView} />,
    "saida-fiscal": <SaidaFiscal onNavigate={setView} />,
    "invista-exterior": <InvistaExterior onNavigate={setView} />,
    cursos: <Cursos onNavigate={setView} />,
    noticias: <Noticias onNavigate={setView} />,
    "cashcontrol-home": <CashControlHome onNavigate={setView} />,

    // PAINEL COM SIDEBAR
    dashboard: <DashboardMain />,
    "cursos-dashboard": <CursosPage />,
    carteira: <CarteiraCash />,
    despesas: <Despesas />,
    relatorios: <Relatorios />,
    mercado: <Mercado />,

    login: <DashboardMain />,
  };

  const FULLSCREEN_VIEWS = [
    "landing",
    "saida-fiscal",
    "invista-exterior",
    "cursos",
    "noticias",
    "cashcontrol-home",
  ];

  if (FULLSCREEN_VIEWS.includes(view)) {
    return SCREEN[view] ?? SCREEN.landing;
  }

  return (
    <AppLayout onNavigate={setView} currentView={view}>
      {SCREEN[view] ?? <DashboardMain />}
    </AppLayout>
  );
}
