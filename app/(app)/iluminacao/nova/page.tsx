import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { exigirUsuario } from "@/lib/auth";
import { Assistente } from "@/components/assistente";
import { Cartao, Titulo } from "@/components/ui";
import { CamposOrdem } from "../campos-ordem";
import { abrirOrdem } from "../actions";

export default async function NovaOrdemPage() {
  const eu = await exigirUsuario("abrirOrdens");
  return (
    <>
      <Link href="/iluminacao" className="mb-2 inline-flex items-center gap-1 text-sm text-stone-500 hover:text-stone-800">
        <ChevronLeft className="h-4 w-4" />
        Ordens de serviço
      </Link>
      <Titulo>Nova ordem de serviço</Titulo>
      <Cartao className="max-w-xl">
        <Assistente acao={abrirOrdem} textoBotao="Abrir ordem">
          <CamposOrdem atendente={eu.nome} />
        </Assistente>
      </Cartao>
    </>
  );
}
