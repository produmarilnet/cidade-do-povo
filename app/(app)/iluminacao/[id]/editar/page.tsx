import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { exigirUsuario } from "@/lib/auth";
import { bairrosConhecidos, localidadesConhecidas } from "@/lib/localidades";
import { sql } from "@/lib/db";
import { numeroDaOrdem } from "@/lib/iluminacao";
import type { OrdemServico } from "@/lib/types";
import { Assistente } from "@/components/assistente";
import { Cartao, Titulo } from "@/components/ui";
import { CamposOrdem } from "../../campos-ordem";
import { corrigirOrdem } from "../../actions";

export default async function CorrigirOrdemPage({ params }: { params: { id: string } }) {
  const eu = await exigirUsuario("abrirOrdens");
  const [ordem] = await sql<OrdemServico[]>`select * from ordens_servico where id = ${params.id}`.catch(() => []);
  if (!ordem) notFound();

  return (
    <>
      <Link
        href={`/iluminacao/${ordem.id}`}
        className="mb-2 inline-flex items-center gap-1 text-sm text-stone-500 hover:text-stone-800"
      >
        <ChevronLeft className="h-4 w-4" />
        Ordem nº {numeroDaOrdem(ordem.numero)}
      </Link>
      <Titulo>Corrigir o pedido</Titulo>
      <Cartao className="max-w-xl">
        <Assistente acao={corrigirOrdem.bind(null, ordem.id)} textoBotao="Salvar correção" comecarNaConferencia>
          <CamposOrdem
            ordem={ordem}
            atendente={eu.nome}
            localidades={await localidadesConhecidas()}
            bairros={await bairrosConhecidos()}
          />
        </Assistente>
      </Cartao>
    </>
  );
}
