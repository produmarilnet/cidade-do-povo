import Link from "next/link";
import { redirect } from "next/navigation";
import { usuarioAtual } from "@/lib/auth";
import { sql } from "@/lib/db";
import { pode } from "@/lib/permissoes";
import { lerNumeroDoPoste, numeroDoPoste } from "@/lib/postes";
import { Assistente } from "@/components/assistente";
import { Marca } from "@/components/marca";
import { Aviso, Cartao } from "@/components/ui";
import { pedirConserto } from "./actions";
import { CamposPedido } from "./campos-pedido";

export const dynamic = "force-dynamic";

/**
 * Para onde o QR da etiqueta aponta: abre pela câmera comum do celular, sem
 * aplicativo. Quem é da equipe vai direto para a ficha do poste; o morador pode
 * pedir o conserto (o dono decidiu assim em 05/11/2026).
 *
 * Esta é a única tela aberta do sistema: mostra só o que já está escrito na
 * etiqueta e o formulário. Rua, GPS e ordens ficam atrás do login.
 */
export default async function PosteLidoPeloQrPage({
  params,
  searchParams,
}: {
  params: { numero: string };
  searchParams: { pedido?: string };
}) {
  const numero = lerNumeroDoPoste(params.numero);
  const eu = await usuarioAtual();
  if (numero !== null && eu && pode(eu.papel, "verPostes")) redirect(`/postes/${numero}`);

  const [poste] =
    numero !== null
      ? await sql<{ numero: number; recebe: boolean; tem_pedido: boolean }[]>`
          select p.numero, p.ativo and p.cadastrado_em is not null as recebe,
            exists (select 1 from ordens_servico o where o.poste_id = p.id and o.situacao = 'aberta') as tem_pedido
          from postes p where p.numero = ${numero}`
      : [];

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <Cartao className="w-full max-w-sm p-6">
        <div className="mb-6">
          <Marca grande />
        </div>
        {poste ? (
          <>
            <p className="text-sm text-stone-500">Iluminação pública</p>
            <h1 className="mb-3 text-2xl font-bold tabular-nums">Poste {numeroDoPoste(poste.numero)}</h1>
            {searchParams.pedido ? (
              <Aviso tipo="ok">Pedido recebido. A equipe da iluminação pública vai atender. Obrigado por avisar.</Aviso>
            ) : poste.tem_pedido ? (
              <Aviso tipo="ok">Este poste já tem um pedido de conserto aberto. A equipe já foi avisada.</Aviso>
            ) : poste.recebe ? (
              <Assistente acao={pedirConserto.bind(null, poste.numero)} textoBotao="Pedir conserto">
                <CamposPedido />
              </Assistente>
            ) : (
              <p className="text-sm text-stone-600">Este poste ainda não está recebendo pedidos pelo QR.</p>
            )}
          </>
        ) : (
          <p className="text-sm text-stone-600">Este QR não é de um poste cadastrado.</p>
        )}
        <div className="mt-6">
          <Link
            href={poste ? `/login?volta=${encodeURIComponent(`/postes/${poste.numero}`)}` : "/login"}
            className="text-sm text-marca-700 underline"
          >
            Sou da equipe: entrar
          </Link>
        </div>
      </Cartao>
    </main>
  );
}
