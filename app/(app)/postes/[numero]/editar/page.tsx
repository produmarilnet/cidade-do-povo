import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { exigirUsuario } from "@/lib/auth";
import { sql } from "@/lib/db";
import { bairrosConhecidos, localidadesConhecidas } from "@/lib/localidades";
import { lerNumeroDoPoste, numeroDoPoste } from "@/lib/postes";
import type { Poste } from "@/lib/types";
import { Assistente } from "@/components/assistente";
import { Cartao, Titulo } from "@/components/ui";
import { salvarPoste } from "../../actions";
import { CamposPoste } from "../../campos-poste";
import { ruaDoUltimoPoste } from "../../ultimo-poste";

/** Completa a etiqueta lida na rua ou corrige um poste já cadastrado. */
export default async function EditarPostePage({ params }: { params: { numero: string } }) {
  const eu = await exigirUsuario("cadastrarPostes");
  const numero = lerNumeroDoPoste(params.numero);
  if (numero === null) notFound();
  const [poste] = await sql<Poste[]>`select * from postes where numero = ${numero}`;
  if (!poste) notFound();
  const cadastrado = poste.cadastrado_em !== null;

  return (
    <>
      <Link
        href={`/postes/${numero}`}
        className="mb-2 inline-flex items-center gap-1 text-sm text-stone-500 hover:text-stone-800"
      >
        <ChevronLeft className="h-4 w-4" />
        Poste {numeroDoPoste(numero)}
      </Link>
      <Titulo>{cadastrado ? "Corrigir o cadastro" : `Cadastrar o poste ${numeroDoPoste(numero)}`}</Titulo>
      <Cartao className="max-w-xl">
        <Assistente
          acao={salvarPoste.bind(null, numero)}
          textoBotao={cadastrado ? "Salvar correção" : "Cadastrar poste"}
          comecarNaConferencia={cadastrado}
        >
          <CamposPoste
            inicio={cadastrado ? poste : await ruaDoUltimoPoste(eu.id)}
            localidades={await localidadesConhecidas()}
            bairros={await bairrosConhecidos()}
          />
        </Assistente>
      </Cartao>
    </>
  );
}
