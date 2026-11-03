import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { exigirUsuario } from "@/lib/auth";
import { sql } from "@/lib/db";
import type { Material } from "@/lib/types";
import { Assistente } from "@/components/assistente";
import { Cartao, Titulo } from "@/components/ui";
import { alterarMaterial } from "../actions";
import { CamposMaterial } from "../campos-material";

export default async function AlterarMaterialPage({ params }: { params: { id: string } }) {
  await exigirUsuario("gerenciarMateriais");
  const [material] = await sql<Material[]>`select * from materiais where id = ${params.id}`.catch(() => []);
  if (!material) notFound();

  return (
    <>
      <Link href="/iluminacao/materiais" className="mb-2 inline-flex items-center gap-1 text-sm text-stone-500 hover:text-stone-800">
        <ChevronLeft className="h-4 w-4" />
        Banco de materiais
      </Link>
      <Titulo>Alterar material</Titulo>
      <Cartao className="max-w-xl">
        <p className="mb-3 text-sm text-stone-500">
          As ordens que já usaram este material continuam com o nome de antes.
        </p>
        <Assistente acao={alterarMaterial.bind(null, material.id)} comecarNaConferencia>
          <CamposMaterial material={material} />
        </Assistente>
      </Cartao>
    </>
  );
}
