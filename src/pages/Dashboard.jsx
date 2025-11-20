import CardResumo from "../components/cards/CardResumo";
import CardRegistro from "../components/cards/CardRegistro";
import CardEvolucao from "../components/cards/CardEvolucao";
import CardEvolucaoPct from "../components/cards/CardEvolucaoPct";
import CardParticipacao from "../components/cards/CardParticipacao";

const MES_IDX = { Jan:0,Fev:1,Mar:2,Abr:3,Mai:4,Jun:5,Jul:6,Ago:7,Set:8,Out:9,Nov:10,Dez:11 };

export default function Dashboard({ registrosPorMes = {}, onDeleteMonth }) {
  const columns = Object.keys(registrosPorMes).sort((a, b) => {
    const [ma, aa] = a.split("/");
    const [mb, ab] = b.split("/");
    const ia = MES_IDX[ma], ib = MES_IDX[mb];
    return aa - ab || ia - ib;
  });

  const allAssets = new Set();
  for (const mes of columns) (registrosPorMes[mes] || []).forEach((i) => allAssets.add(i.nome));
  const rows = Array.from(allAssets).sort((a,b)=>a.localeCompare(b,"pt-BR")).map(name=>{
    return { ativo:name, valores:columns.map(mes=>{
      const item=(registrosPorMes[mes]||[]).find(i=>i.nome===name);
      return item? Number(item.valor):0;
    })};
  });

  const totais = columns.map((mes)=> (registrosPorMes[mes]||[]).reduce((a,i)=>a+Number(i.valor||0),0));
  const idx=columns.length-1;
  const mesAtual=columns[idx]||"-";
  const patrimonioAtual=totais[idx]||0;
  const totalAntes=(n)=>totais[idx-n]||0;

  const dadosResumo = {
    mesAtual,
    patrimonioAtual,
    comparativos:{ mesAnterior:totalAntes(1), m3:totalAntes(3), m6:totalAntes(6), m12:totalAntes(12) },
    distribuicao: (registrosPorMes[mesAtual]||[]).map(i=>({nome:i.nome, valor:Number(i.valor||0)})).sort((a,b)=>b.valor-a.valor)
  };

  return (
    <div className="pt-3 pr-6">
      <div className="flex items-start gap-3 flex-wrap md:flex-nowrap">
        <CardResumo data={dadosResumo}/>
        <CardEvolucao columns={columns} rows={rows}/>
      </div>

      <div className="mt-3 flex items-start gap-3 flex-wrap md:flex-nowrap">
        <CardRegistro columns={columns} rows={rows} onDeleteMonth={onDeleteMonth}/>
        <CardParticipacao itens={dadosResumo.distribuicao} mesAtual={dadosResumo.mesAtual}/>
      </div>

      <div className="mt-3">
        <CardEvolucaoPct columns={columns} rows={rows}/>
      </div>
    </div>
  );
}
