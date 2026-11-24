import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { exigirUsuario } from "@/lib/auth";
import { Assistente } from "@/components/assistente";
import { Cartao, Titulo } from "@/components/ui";
import { salvarVeiculo } from "../actions";
import { CamposVeiculo } from "../campos-veiculo";

export default async function NovoVeiculoPage() {
  await exigirUsuario("gerenciarFrota");
  return (
    <>
      <Link href="/frota" className="mb-2 inline-flex items-center gap-1 text-sm text-stone-500 hover:text-stone-800">
        <ChevronLeft className="h-4 w-4" />
        Frota
      </Link>
      <Titulo>Novo veículo</Titulo>
      <Cartao className="max-w-xl">
        <Assistente acao={salvarVeiculo.bind(null, null)} textoBotao="Cadastrar veículo">
          <CamposVeiculo />
        </Assistente>
      </Cartao>
    </>
  );
}
