import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { exigirUsuario } from "@/lib/auth";
import { sql } from "@/lib/db";
import { bairrosConhecidos, localidadesConhecidas } from "@/lib/localidades";
import { lerNumeroDoPoste } from "@/lib/postes";
import type { Poste } from "@/lib/types";
import { Assistente } from "@/components/assistente";
import { Cartao, Titulo } from "@/components/ui";
import { CamposOrdem } from "../campos-ordem";
import { abrirOrdem } from "../actions";

export default async function NovaOrdemPage({ searchParams }: { searchParams: { poste?: string } }) {
  const eu = await exigirUsuario("abrirOrdens");
  // veio da ficha do poste: o endereço e o número já entram preenchidos
  const numero = lerNumeroDoPoste(searchParams.poste ?? "");
  const [poste] = numero !== null ? await sql<Poste[]>`select * from postes where numero = ${numero}` : [];
  return (
    <>
      <Link href="/iluminacao" className="mb-2 inline-flex items-center gap-1 text-sm text-stone-500 hover:text-stone-800">
        <ChevronLeft className="h-4 w-4" />
        Ordens de serviço
      </Link>
      <Titulo>Nova ordem de serviço</Titulo>
      <Cartao className="max-w-xl">
        <Assistente acao={abrirOrdem} textoBotao="Abrir ordem">
          <CamposOrdem
            ordem={
              poste && {
                localidade: poste.localidade,
                bairro: poste.bairro,
                endereco: poste.endereco ?? undefined,
                ponto_referencia: poste.ponto_referencia,
              }
            }
            posteNumero={poste?.numero}
            atendente={eu.nome}
            localidades={await localidadesConhecidas()}
            bairros={await bairrosConhecidos()}
          />
        </Assistente>
      </Cartao>
    </>
  );
}
