import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Trash2 } from "lucide-react";
import { exigirUsuario } from "@/lib/auth";
import { sql } from "@/lib/db";
import type { Manutencao } from "@/lib/types";
import { formatarData, hoje } from "@/lib/utils";
import { Assistente } from "@/components/assistente";
import { BotaoAcao } from "@/components/formulario";
import { Cartao, Titulo } from "@/components/ui";
import { excluirManutencao, salvarManutencao } from "../../../actions";
import { veiculosComResumo } from "../../../resumo";
import { CamposManutencao } from "../campos-manutencao";

/** Corrige ou apaga uma manutenção lançada. */
export default async function ManutencaoPage({ params }: { params: { id: string; mid: string } }) {
  await exigirUsuario("gerenciarFrota");
  const [v] = await veiculosComResumo(params.id).catch(() => []);
  if (!v) notFound();
  const [m] = await sql<Manutencao[]>`
    select * from veiculo_manutencoes where id = ${params.mid} and veiculo_id = ${v.id}`.catch(() => []);
  if (!m) notFound();

  return (
    <>
      <Link
        href={`/frota/${v.id}?aba=manutencoes`}
        className="mb-2 inline-flex items-center gap-1 text-sm text-stone-500 hover:text-stone-800"
      >
        <ChevronLeft className="h-4 w-4" />
        {v.modelo} · {v.placa}
      </Link>
      <Titulo
        acao={
          <BotaoAcao
            acao={excluirManutencao.bind(null, v.id, m.id)}
            variante="fantasma"
            confirmar={`Apagar a manutenção de ${formatarData(m.data)}? Não dá para desfazer.`}
          >
            <Trash2 className="h-4 w-4" />
            Apagar
          </BotaoAcao>
        }
      >
        Corrigir manutenção
      </Titulo>
      <Cartao className="max-w-xl">
        <Assistente acao={salvarManutencao.bind(null, v.id, m.id)} textoBotao="Salvar correção" comecarNaConferencia>
          <CamposManutencao m={m} hoje={hoje()} kmAtual={v.km_atual} />
        </Assistente>
      </Cartao>
    </>
  );
}
