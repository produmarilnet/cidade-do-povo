import { sql } from "./db";

// A localidade da ordem é texto livre com sugestão ("Sede" ou o povoado).
// Para o relatório não partir o mesmo povoado em dois ("Bom Jesus" e
// "bom jesus"), quem salva passa por `localidadeDoBanco`, que reaproveita a
// grafia que já existe. Os postes usam os mesmos nomes, então as duas tabelas
// entram na lista.

export const SEDE = "Sede";

const chave = (t: string) =>
  t
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

/** "Sede" e as localidades já usadas, as mais pedidas primeiro. */
export async function localidadesConhecidas(): Promise<string[]> {
  const linhas = await sql<{ localidade: string }[]>`
    select localidade from (
      select localidade from ordens_servico
      union all
      select localidade from postes
    ) lugares
    where localidade is not null
    group by localidade
    order by count(*) desc, localidade`;
  const nomes = linhas.map((l) => l.localidade).filter((l) => chave(l) !== chave(SEDE));
  return [SEDE, ...nomes];
}

/** A grafia que vai para o banco: a que já existe, se for o mesmo lugar escrito diferente. */
export async function localidadeDoBanco(texto: string): Promise<string> {
  const limpo = texto.replace(/\s+/g, " ").trim();
  if (chave(limpo) === chave(SEDE)) return SEDE;
  const conhecidas = await localidadesConhecidas();
  return conhecidas.find((l) => chave(l) === chave(limpo)) ?? limpo;
}

/** Os bairros já usados, os mais pedidos primeiro. */
export async function bairrosConhecidos(): Promise<string[]> {
  const linhas = await sql<{ bairro: string }[]>`
    select bairro from (
      select bairro from ordens_servico
      union all
      select bairro from postes
    ) lugares
    where bairro is not null
    group by bairro
    order by count(*) desc, bairro`;
  return linhas.map((l) => l.bairro);
}

/** Igual à localidade: o mesmo bairro escrito de outro jeito fica com a grafia que já existe. */
export async function bairroDoBanco(texto: string): Promise<string> {
  const limpo = texto.replace(/\s+/g, " ").trim();
  const conhecidos = await bairrosConhecidos();
  return conhecidos.find((b) => chave(b) === chave(limpo)) ?? limpo;
}
