// src/pages/Dashboard.jsx
import CardResumo from "../components/cards/CardResumo";
import CardRegistro from "../components/cards/CardRegistro";
import CardEvolucao from "../components/cards/CardEvolucao";
import CardEvolucaoPct from "../components/cards/CardEvolucaoPct";
import CardParticipacao from "../components/cards/CardParticipacao";

const MESES = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
const MES_IDX = { Jan:0,Fev:1,Mar:2,Abr:3,Mai:4,Jun:5,Jul:6,Ago:7,Set:8,Out:9,Nov:10,Dez:11 };

// normaliza qualquer chave parecida para "MMM/YYYY"
function normalizeMesKey(key) {
  if (!key) return key;
  const trimmed = String(key).trim();

  // formatos tipo "Nov/2026" ou "11/2026"
  const partsSlash = trimmed.split("/");
  if (partsSlash.length === 2) {
    let [m, a] = partsSlash;
    m = m.trim();
    a = a.trim();

    if (/^\d+$/.test(m)) {
      const mi = Number(m) - 1;
      if (mi >= 0 && mi < 12) m = MESES[mi];
    } else {
      m = m.charAt(0).toUpperCase() + m.slice(1,3).toLowerCase();
      if (!MES_IDX.hasOwnProperty(m)) {
        const found = MESES.find(mm => mm.toLowerCase() === m.toLowerCase());
        if (found) m = found;
      }
    }

    if (/^\d{2}$/.test(a)) a = `20${a}`;
    return `${m}/${a}`;
  }

  // tenta formatos tipo "Nov-2026" ou "Nov 2026"
  const partsOther = trimmed.split(/[-\s]+/);
  if (partsOther.length === 2) {
    return normalizeMesKey(`${partsOther[0]}/${partsOther[1]}`);
  }

  return trimmed;
}

export default function Dashboard({ registrosPorMes = {}, onDeleteMonth }) {
  // normaliza todas as chaves antes de ordenar/usar
  const normalizedRegistros = Object.fromEntries(
    Object.entries(registrosPorMes).map(([k, v]) => [normalizeMesKey(k), v])
  );

  const columns = Object.keys(normalizedRegistros).sort((a, b) => {
    const [ma, aa] = a.split("/");
    const [mb, ab] = b.split("/");
    const ia = MES_IDX[ma], ib = MES_IDX[mb];
    return Number(aa) - Number(ab) || ia - ib;
  });

  // monta rows (ativos x meses)
  const allAssets = new Set();
  for (const mes of columns) {
    (normalizedRegistros[mes] || []).forEach((i) => allAssets.add(i.nome));
  }

  const rows = Array.from(allAssets)
    .sort((a, b) => a.localeCompare(b, "pt-BR"))
    .map((name) => ({
      ativo: name,
      valores: columns.map((mes) => {
        const item = (normalizedRegistros[mes] || []).find(
          (i) => i.nome === name
        );
        return item ? Number(item.valor) : 0;
      }),
    }));

  // totais por mês
  const totais = columns.map(
    (mes) =>
      (normalizedRegistros[mes] || []).reduce(
        (a, i) => a + Number(i.valor || 0),
        0
      )
  );

  // ✅ pega o último mês com total > 0 (se existir), senão o último mesmo
  const idxUltimoComValor = (() => {
    for (let i = totais.length - 1; i >= 0; i--) {
      if ((totais[i] || 0) > 0) return i;
    }
    return totais.length - 1;
  })();

  const mesAtual = columns[idxUltimoComValor] || "-";
  const patrimonioAtual = totais[idxUltimoComValor] || 0;

  const totalAntes = (n) => totais[idxUltimoComValor - n] || 0;

  // ✅ distribuicao baseada em rows (mesmo que aparece no CardRegistro)
  const distribuicao = rows
    .map((r) => ({
      nome: r.ativo,
      valor: Number(r.valores?.[idxUltimoComValor] || 0),
    }))
    .filter((i) => i.valor > 0)
    .sort((a, b) => b.valor - a.valor);

  const dadosResumo = {
    mesAtual,
    patrimonioAtual,
    comparativos: {
      mesAnterior: totalAntes(1),
      m3: totalAntes(3),
      m6: totalAntes(6),
      m12: totalAntes(12),
    },
    distribuicao,
  };

  return (
    <div className="pt-3 pr-6">
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
        <CardParticipacao
          itens={dadosResumo.distribuicao}
          mesAtual={dadosResumo.mesAtual}
        />
      </div>

      <div className="mt-3">
        <CardEvolucaoPct columns={columns} rows={rows} />
      </div>
    </div>
  );
}
