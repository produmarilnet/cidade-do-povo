import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { exigirUsuario } from "@/lib/auth";
import { CHECKLIST, temCesto } from "@/lib/frota";
import { hoje } from "@/lib/utils";
import { Cartao, Titulo } from "@/components/ui";
import { salvarChecklist } from "../../../actions";
import { veiculosComResumo } from "../../../resumo";
import { FormChecklist } from "../form-checklist";

export default async function NovoChecklistPage({ params }: { params: { id: string } }) {
  const eu = await exigirUsuario("fazerChecklist");
  const [v] = await veiculosComResumo(params.id).catch(() => []);
  if (!v) notFound();
  // o grupo do cesto aéreo só para o veículo que tem cesto
  // `indice` é a posição em CHECKLIST: é ela que vai no nome do campo
  const grupos = CHECKLIST.map(({ grupo, itens, soCesto }, indice) => ({ grupo, itens, indice, soCesto })).filter(
    (g) => !g.soCesto || temCesto(v),
  );

  return (
    <>
      <Link href={`/frota/${v.id}?aba=checklists`} className="mb-2 inline-flex items-center gap-1 text-sm text-stone-500 hover:text-stone-800">
        <ChevronLeft className="h-4 w-4" />
        {v.modelo} · {v.placa}
      </Link>
      <Titulo>Checklist</Titulo>
      <Cartao className="max-w-xl">
        <FormChecklist
          acao={salvarChecklist.bind(null, v.id)}
          grupos={grupos}
          hoje={hoje()}
          responsavel={eu.nome}
          kmAtual={v.km_atual}
        />
      </Cartao>
    </>
  );
}
