// src/pages/Dashboard.jsx
import CardResumo from "../components/cards/CardResumo";
import CardRegistro from "../components/cards/CardRegistro";
import CardEvolucao from "../components/cards/CardEvolucao";
import CardEvolucaoPct from "../components/cards/CardEvolucaoPct";
import CardParticipacao from "../components/cards/CardParticipacao";
import CardDividendosCash from "../components/cards/CardDividendosCash";

const MESES = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
const MES_IDX = { Jan:0,Fev:1,Mar:2,Abr:3,Mai:4,Jun:5,Jul:6,Ago:7,Set:8,Out:9,Nov:10,Dez:11 };

// ---------------------------------------------------------
// NORMALIZAÇÃO DAS CHAVES (mes/ano escrito de várias formas)
// ---------------------------------------------------------
function normalizeMesKey(key) {
  if (!key) return key;

  const trimmed = String(key).trim();

  // formato "Nov/2026"
  if (trimmed.includes("/")) {
    let [m, a] = trimmed.split("/").map(s => s.trim());

    // mês número -> texto
    if (/^\d+$/.test(m)) {
      const idx = Number(m) - 1;
      if (idx >= 0 && idx < 12) m = MESES[idx];
    } else {
      m = m.charAt(0).toUpperCase() + m.slice(1,3).toLowerCase();
      if (!MES_IDX[m]) {
        const found = MESES.find(x => x.toLowerCase() === m.toLowerCase());
        if (found) m = found;
      }
    }

    // ano 2 dígitos → 4 dígitos
    if (/^\d{2}$/.test(a)) a = `20${a}`;

    return `${m}/${a}`;
  }

  // formato "Nov-2026" ou "Nov 2026"
  const parts = trimmed.split(/[-\s]+/);
  if (parts.length === 2) return normalizeMesKey(parts.join("/"));

  return trimmed;
}

// ---------------------------------------------------------

export default function Dashboard({ registrosPorMes = {}, onDeleteMonth }) {

  // 1) Normaliza as chaves do objeto
  const normalizedRegistros = Object.fromEntries(
    Object.entries(registrosPorMes).map(([k,v]) => [normalizeMesKey(k), v])
  );

  // 2) Ordena corretamente por ano depois por mês
  const columns = Object.keys(normalizedRegistros).sort((a,b)=>{
    const [ma, aa] = a.split("/");
    const [mb, ab] = b.split("/");
    const ia = MES_IDX[ma], ib = MES_IDX[mb];
    return Number(aa) - Number(ab) || ia - ib;
  });

  // 3) monta lista única de ativos
  const allAssets = new Set();
  for (const mes of columns) {
    (normalizedRegistros[mes] || []).forEach((i)=> allAssets.add(i.nome));
  }

  // 4) cria matriz rows = [{ativo, valores:[...] }]
  const rows = Array.from(allAssets)
    .sort((a,b)=>a.localeCompare(b,"pt-BR"))
    .map(name => ({
      ativo: name,
      valores: columns.map(mes => {
        const item = (normalizedRegistros[mes]||[]).find(i=>i.nome===name);
        return item ? Number(item.valor) : 0;
      })
    }));

  // 5) totais por mês
  const totais = columns.map(mes =>
    (normalizedRegistros[mes]||[])
      .reduce((acc,i)=> acc + Number(i.valor||0), 0)
  );

  const idx = columns.length - 1;
  const mesAtual = columns[idx] || "-";
  const patrimonioAtual = totais[idx] || 0;
  const totalAntes = (n)=> totais[idx-n] || 0;

  // ✅ distribuicao igual ao CardRegistro (mês atual)
  const distribuicao = rows
    .map(r => ({
      nome: r.ativo,
      valor: Number(r.valores[idx] || 0)
    }))
    .filter(i => Number.isFinite(i.valor) && i.valor > 0)
    .sort((a,b)=> b.valor - a.valor);

  const dadosResumo = {
    mesAtual,
    patrimonioAtual,
    comparativos: {
      mesAnterior: totalAntes(1),
      m3: totalAntes(3),
      m6: totalAntes(6),
      m12: totalAntes(12)
    },
    distribuicao
  };

  return (
    <div className="pt-3 pr-6">

      {/* Linha superior */}
      <div className="flex items-start gap-3 flex-wrap md:flex-nowrap">
        <CardResumo data={dadosResumo}/>
        <CardEvolucao columns={columns} rows={rows}/>
      </div>

      {/* Linha do meio: esquerda registros | direita coluna com 2 cards */}
      <div className="mt-3 flex items-start gap-3 flex-wrap md:flex-nowrap">
        <CardRegistro
          columns={columns}
          rows={rows}
          onDeleteMonth={onDeleteMonth}
        />

        <div className="flex flex-col gap-3">
          <CardParticipacao
            itens={dadosResumo.distribuicao}
            mesAtual={dadosResumo.mesAtual}
          />

          {/* ✅ NOVO CARD DE DIVIDENDOS CASH */}
          <CardDividendosCash />
        </div>
      </div>

      {/* Linha inferior */}
      <div className="mt-3">
        <CardEvolucaoPct columns={columns} rows={rows}/>
      </div>

    </div>
  );
}
