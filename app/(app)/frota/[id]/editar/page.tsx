import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { exigirUsuario } from "@/lib/auth";
import { sql } from "@/lib/db";
import type { Veiculo } from "@/lib/types";
import { Assistente } from "@/components/assistente";
import { Cartao, Titulo } from "@/components/ui";
import { salvarVeiculo } from "../../actions";
import { CamposVeiculo } from "../../campos-veiculo";

export default async function EditarVeiculoPage({ params }: { params: { id: string } }) {
  await exigirUsuario("gerenciarFrota");
  const [veiculo] = await sql<Veiculo[]>`select * from veiculos where id = ${params.id}`.catch(() => []);
  if (!veiculo) notFound();

  return (
    <>
      <Link href={`/frota/${veiculo.id}`} className="mb-2 inline-flex items-center gap-1 text-sm text-stone-500 hover:text-stone-800">
        <ChevronLeft className="h-4 w-4" />
        {veiculo.modelo} · {veiculo.placa}
      </Link>
      <Titulo>Corrigir o cadastro</Titulo>
      <Cartao className="max-w-xl">
        <Assistente acao={salvarVeiculo.bind(null, veiculo.id)} textoBotao="Salvar correção" comecarNaConferencia>
          <CamposVeiculo veiculo={veiculo} />
        </Assistente>
      </Cartao>
    </>
  );
}
