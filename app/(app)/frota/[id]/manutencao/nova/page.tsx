import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { exigirUsuario } from "@/lib/auth";
import { hoje } from "@/lib/utils";
import { Assistente } from "@/components/assistente";
import { Cartao, Titulo } from "@/components/ui";
import { salvarManutencao } from "../../../actions";
import { veiculosComResumo } from "../../../resumo";
import { CamposManutencao } from "../campos-manutencao";

export default async function NovaManutencaoPage({ params }: { params: { id: string } }) {
  await exigirUsuario("gerenciarFrota");
  const [v] = await veiculosComResumo(params.id).catch(() => []);
  if (!v) notFound();

  return (
    <>
      <Link href={`/frota/${v.id}`} className="mb-2 inline-flex items-center gap-1 text-sm text-stone-500 hover:text-stone-800">
        <ChevronLeft className="h-4 w-4" />
        {v.modelo} · {v.placa}
      </Link>
      <Titulo>Lançar manutenção</Titulo>
      <Cartao className="max-w-xl">
        <Assistente acao={salvarManutencao.bind(null, v.id, null)} textoBotao="Lançar manutenção">
          <CamposManutencao hoje={hoje()} kmAtual={v.km_atual} />
        </Assistente>
      </Cartao>
    </>
  );
}
