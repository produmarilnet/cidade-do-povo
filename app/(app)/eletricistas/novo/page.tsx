import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { exigirUsuario } from "@/lib/auth";
import { hoje } from "@/lib/utils";
import { Assistente } from "@/components/assistente";
import { Cartao, Titulo } from "@/components/ui";
import { salvarEletricista } from "../actions";
import { CamposEletricista } from "../campos-eletricista";

export default async function NovoEletricistaPage() {
  await exigirUsuario("gerenciarEletricistas");
  return (
    <>
      <Link href="/eletricistas" className="mb-2 inline-flex items-center gap-1 text-sm text-stone-500 hover:text-stone-800">
        <ChevronLeft className="h-4 w-4" />
        Eletricistas
      </Link>
      <Titulo>Novo eletricista</Titulo>
      <Cartao className="max-w-xl">
        <Assistente acao={salvarEletricista.bind(null, null)} textoBotao="Cadastrar eletricista">
          <CamposEletricista hoje={hoje()} />
        </Assistente>
      </Cartao>
    </>
  );
}
