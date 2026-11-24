import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { exigirUsuario } from "@/lib/auth";
import { sql } from "@/lib/db";
import type { Eletricista } from "@/lib/types";
import { hoje } from "@/lib/utils";
import { Assistente } from "@/components/assistente";
import { Cartao, Titulo } from "@/components/ui";
import { salvarEletricista } from "../../actions";
import { CamposEletricista } from "../../campos-eletricista";

export default async function EditarEletricistaPage({ params }: { params: { id: string } }) {
  await exigirUsuario("gerenciarEletricistas");
  const [eletricista] = await sql<Eletricista[]>`select * from eletricistas where id = ${params.id}`.catch(() => []);
  if (!eletricista) notFound();

  return (
    <>
      <Link
        href={`/eletricistas/${eletricista.id}`}
        className="mb-2 inline-flex items-center gap-1 text-sm text-stone-500 hover:text-stone-800"
      >
        <ChevronLeft className="h-4 w-4" />
        {eletricista.nome}
      </Link>
      <Titulo>Corrigir o cadastro</Titulo>
      <Cartao className="max-w-xl">
        <Assistente acao={salvarEletricista.bind(null, eletricista.id)} textoBotao="Salvar correção" comecarNaConferencia>
          <CamposEletricista eletricista={eletricista} hoje={hoje()} />
        </Assistente>
      </Cartao>
    </>
  );
}
