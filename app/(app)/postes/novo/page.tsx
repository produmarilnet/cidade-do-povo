import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { exigirUsuario } from "@/lib/auth";
import { bairrosConhecidos, localidadesConhecidas } from "@/lib/localidades";
import { Assistente } from "@/components/assistente";
import { Cartao, Titulo } from "@/components/ui";
import { salvarPoste } from "../actions";
import { CamposPoste } from "../campos-poste";
import { ruaDoUltimoPoste } from "../ultimo-poste";

/** Poste sem etiqueta na mão: ganha o próximo número e a etiqueta sai depois, pela ficha. */
export default async function NovoPostePage() {
  const eu = await exigirUsuario("cadastrarPostes");
  return (
    <>
      <Link href="/postes" className="mb-2 inline-flex items-center gap-1 text-sm text-stone-500 hover:text-stone-800">
        <ChevronLeft className="h-4 w-4" />
        Postes
      </Link>
      <Titulo>Novo poste</Titulo>
      <Cartao className="max-w-xl">
        <Assistente acao={salvarPoste.bind(null, null)} textoBotao="Cadastrar poste">
          <CamposPoste
            inicio={await ruaDoUltimoPoste(eu.id)}
            localidades={await localidadesConhecidas()}
            bairros={await bairrosConhecidos()}
          />
        </Assistente>
      </Cartao>
    </>
  );
}
