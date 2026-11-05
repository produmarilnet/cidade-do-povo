import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { exigirUsuario } from "@/lib/auth";
import { sql } from "@/lib/db";
import { Cartao, Titulo } from "@/components/ui";
import { MapaPostes, type PosteNoMapa } from "./mapa-postes";

export default async function MapaDosPostesPage() {
  await exigirUsuario("verPostes");
  const postes = await sql<PosteNoMapa[]>`
    select p.numero, p.latitude, p.longitude, p.endereco,
      (select count(*)::int from ordens_servico o where o.poste_id = p.id and o.situacao = 'aberta') as abertas
    from postes p
    where p.ativo and p.cadastrado_em is not null`;
  const comOrdem = postes.filter((p) => p.abertas > 0).length;

  return (
    <>
      <Link href="/postes" className="mb-2 inline-flex items-center gap-1 text-sm text-stone-500 hover:text-stone-800">
        <ChevronLeft className="h-4 w-4" />
        Postes
      </Link>
      <Titulo>Mapa dos postes</Titulo>
      {postes.length === 0 ? (
        <Cartao className="text-center text-sm text-stone-500">Nenhum poste marcado ainda.</Cartao>
      ) : (
        <>
          <p className="-mt-2 mb-3 text-sm text-stone-500">
            {postes.length} {postes.length === 1 ? "poste" : "postes"}
            {comOrdem > 0 && `, ${comOrdem} com ordem aberta (em vermelho)`}. Toque num ponto para ver o poste.
          </p>
          <MapaPostes postes={postes} />
        </>
      )}
    </>
  );
}
