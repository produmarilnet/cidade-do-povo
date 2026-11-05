"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { sql } from "@/lib/db";
import { exigirUsuario } from "@/lib/auth";
import { bairroDoBanco, localidadeDoBanco } from "@/lib/localidades";
import { ETIQUETAS_POR_LOTE } from "@/lib/postes";
import { erroDeValidacao, type Resultado } from "@/lib/resultado";

// Vazio não pode virar zero: zero é um lugar no mar, não "sem GPS".
const coordenada = (limite: number) =>
  z
    .string()
    .trim()
    .min(1, "Marque a localização pelo GPS.")
    .transform(Number)
    .pipe(z.number({ invalid_type_error: "Marque a localização pelo GPS." }).min(-limite).max(limite));

const esquemaPoste = z.object({
  latitude: coordenada(90),
  longitude: coordenada(180),
  precisao: z.string().trim().min(1, "Marque a localização pelo GPS.").transform(Number).pipe(z.number().min(0)),
  localidade: z.string().trim().min(2, "Informe a localidade: Sede ou o nome do povoado.").max(80),
  bairro: z
    .string()
    .trim()
    .max(80, "O nome do bairro está grande demais.")
    .transform((v) => v || null),
  endereco: z.string().trim().min(3, "Informe a rua do poste.").max(200),
  ponto_referencia: z
    .string()
    .trim()
    .max(200)
    .transform((v) => v || null),
});

/** Salva o cadastro. Com número: completa ou corrige aquele poste. Sem número: poste novo. */
export async function salvarPoste(numero: number | null, _: Resultado, dados: FormData): Promise<Resultado> {
  const eu = await exigirUsuario("cadastrarPostes");
  const lido = esquemaPoste.safeParse({
    latitude: dados.get("latitude") ?? "",
    longitude: dados.get("longitude") ?? "",
    precisao: dados.get("precisao") ?? "",
    localidade: dados.get("localidade") ?? "",
    bairro: dados.get("bairro") ?? "",
    endereco: dados.get("endereco") ?? "",
    ponto_referencia: dados.get("ponto_referencia") ?? "",
  });
  if (!lido.success) return erroDeValidacao(lido.error);
  const p = lido.data;
  // o mesmo povoado ou bairro escrito de outro jeito fica com a grafia que já existe
  p.localidade = await localidadeDoBanco(p.localidade);
  if (p.bairro) p.bairro = await bairroDoBanco(p.bairro);

  let salvo = numero;
  if (salvo === null) {
    const [novo] = await sql<{ numero: number }[]>`
      insert into postes
        (latitude, longitude, precisao, localidade, bairro, endereco, ponto_referencia,
         criado_por, cadastrado_por, cadastrado_em)
      values
        (${p.latitude}, ${p.longitude}, ${p.precisao}, ${p.localidade}, ${p.bairro}, ${p.endereco},
         ${p.ponto_referencia}, ${eu.id}, ${eu.id}, now())
      returning numero`;
    salvo = novo.numero;
  } else {
    const feitos = await sql`
      update postes set
        latitude = ${p.latitude}, longitude = ${p.longitude}, precisao = ${p.precisao},
        localidade = ${p.localidade}, bairro = ${p.bairro}, endereco = ${p.endereco},
        ponto_referencia = ${p.ponto_referencia},
        cadastrado_por = coalesce(cadastrado_por, ${eu.id}),
        cadastrado_em = coalesce(cadastrado_em, now()),
        atualizado_em = now()
      where numero = ${salvo}`;
    if (feitos.count === 0) return { ok: false, erro: "Esse poste não existe mais." };
  }
  revalidatePath("/postes", "layout");
  redirect(`/postes/${salvo}?salvo=1`);
}

/** Cria os números do lote. A etiqueta vai para a rua e o poste é marcado lendo o QR. */
export async function gerarEtiquetas(_: Resultado, dados: FormData): Promise<Resultado> {
  const eu = await exigirUsuario("gerenciarPostes");
  const quantidade = Number(dados.get("quantidade"));
  if (!Number.isInteger(quantidade) || quantidade < 1 || quantidade > ETIQUETAS_POR_LOTE) {
    return { ok: false, erro: `Informe de 1 a ${ETIQUETAS_POR_LOTE} etiquetas.` };
  }
  const criados = await sql<{ numero: number }[]>`
    insert into postes (criado_por)
    select ${eu.id}::uuid from generate_series(1, ${quantidade}::int)
    returning numero`;
  const numeros = criados.map((c) => c.numero);
  revalidatePath("/postes", "layout");
  redirect(`/postes/etiquetas/imprimir?de=${Math.min(...numeros)}&ate=${Math.max(...numeros)}`);
}

/** Tira o poste de uso (ou volta). Ele nunca é apagado: a etiqueta pode estar na rua. */
export async function ativarPoste(numero: number, ativo: boolean): Promise<void> {
  await exigirUsuario("gerenciarPostes");
  await sql`update postes set ativo = ${ativo}, atualizado_em = now() where numero = ${numero}`;
  revalidatePath("/postes", "layout");
}
