import Link from "next/link";
import { redirect } from "next/navigation";
import { usuarioAtual } from "@/lib/auth";
import { sql } from "@/lib/db";
import { pode } from "@/lib/permissoes";
import { lerNumeroDoPoste, numeroDoPoste } from "@/lib/postes";
import { Marca } from "@/components/marca";
import { Cartao } from "@/components/ui";

export const dynamic = "force-dynamic";

/**
 * Para onde o QR da etiqueta aponta: abre pela câmera comum do celular, sem
 * aplicativo. Quem é da equipe vai direto para a ficha do poste.
 *
 * Esta é a única tela aberta do sistema, por isso mostra só o que já está
 * escrito na etiqueta. Rua, GPS e ordens ficam atrás do login. Pedido de
 * conserto pelo morador ainda não foi decidido pelo dono; quando for, ele entra
 * aqui, sem precisar trocar as etiquetas.
 */
export default async function PosteLidoPeloQrPage({ params }: { params: { numero: string } }) {
  const numero = lerNumeroDoPoste(params.numero);
  const eu = await usuarioAtual();
  if (numero !== null && eu && pode(eu.papel, "verPostes")) redirect(`/postes/${numero}`);

  const [poste] = numero !== null ? await sql<{ numero: number }[]>`select numero from postes where numero = ${numero}` : [];

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <Cartao className="w-full max-w-sm p-6">
        <div className="mb-6">
          <Marca grande />
        </div>
        {poste ? (
          <>
            <p className="text-sm text-stone-500">Iluminação pública</p>
            <h1 className="mb-2 text-2xl font-bold tabular-nums">Poste {numeroDoPoste(poste.numero)}</h1>
            <p className="mb-6 text-sm text-stone-600">
              Este poste faz parte do cadastro de iluminação pública da Prefeitura de São Mateus do Maranhão.
            </p>
          </>
        ) : (
          <p className="mb-6 text-sm text-stone-600">Este QR não é de um poste cadastrado.</p>
        )}
        <Link
          href={poste ? `/login?volta=${encodeURIComponent(`/postes/${poste.numero}`)}` : "/login"}
          className="text-sm text-marca-700 underline"
        >
          Sou da equipe: entrar
        </Link>
      </Cartao>
    </main>
  );
}
