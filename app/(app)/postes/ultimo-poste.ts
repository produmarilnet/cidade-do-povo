import { sql } from "@/lib/db";
import type { InicioDoPoste } from "./campos-poste";

/**
 * Quem está marcando postes na rua faz vários em sequência na mesma rua: o
 * cadastro já abre com a rua do último, e é só conferir. Vale por algumas horas.
 */
export async function ruaDoUltimoPoste(usuarioId: string): Promise<InicioDoPoste | undefined> {
  const [ultimo] = await sql<InicioDoPoste[]>`
    select localidade, bairro, endereco from postes
    where cadastrado_por = ${usuarioId} and cadastrado_em > now() - interval '4 hours'
    order by cadastrado_em desc
    limit 1`;
  return ultimo;
}
