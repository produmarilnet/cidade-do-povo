"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { sql } from "@/lib/db";
import { exigirUsuario } from "@/lib/auth";
import { lerQuantidade } from "@/lib/estoque";
import { erroDeValidacao, type Resultado } from "@/lib/resultado";

const esquemaMaterial = z.object({
  nome: z.string().trim().min(2, "Informe o nome do material.").max(120),
  unidade: z.enum(["un", "m"], { message: "Diga se o material é contado por peça ou por metro." }),
  estoque_minimo: z.number().min(0).max(99999),
});

function lerMaterial(dados: FormData) {
  return esquemaMaterial.safeParse({
    nome: dados.get("nome") ?? "",
    unidade: dados.get("unidade") ?? "",
    estoque_minimo: lerQuantidade(String(dados.get("estoque_minimo") ?? "")),
  });
}

/** O banco não deixa dois materiais com o mesmo nome. */
function nomeRepetido(erro: unknown): boolean {
  return typeof erro === "object" && erro !== null && "code" in erro && erro.code === "23505";
}

/** Inclui no banco de materiais. Entra no fim da lista. */
export async function incluirMaterial(_: Resultado, dados: FormData): Promise<Resultado> {
  await exigirUsuario("gerenciarMateriais");
  const lido = lerMaterial(dados);
  if (!lido.success) return erroDeValidacao(lido.error);
  const m = lido.data;
  try {
    await sql`
      insert into materiais (nome, unidade, estoque_minimo, ordem)
      values (${m.nome}, ${m.unidade}, ${m.estoque_minimo}, (select coalesce(max(ordem), 0) + 1 from materiais))`;
  } catch (e) {
    if (nomeRepetido(e)) return { ok: false, erro: `"${m.nome}" já está no banco de materiais.` };
    throw e;
  }
  revalidatePath("/estoque/materiais");
  return { ok: true, mensagem: `"${m.nome}" entrou no banco de materiais.` };
}

/** Corrige nome ou unidade. O que já foi registrado nas ordens não muda (lá o nome está copiado). */
export async function alterarMaterial(id: string, _: Resultado, dados: FormData): Promise<Resultado> {
  await exigirUsuario("gerenciarMateriais");
  const lido = lerMaterial(dados);
  if (!lido.success) return erroDeValidacao(lido.error);
  const m = lido.data;
  try {
    await sql`
      update materiais set nome = ${m.nome}, unidade = ${m.unidade}, estoque_minimo = ${m.estoque_minimo}
      where id = ${id}`;
  } catch (e) {
    if (nomeRepetido(e)) return { ok: false, erro: `"${m.nome}" já está no banco de materiais.` };
    throw e;
  }
  revalidatePath("/estoque/materiais");
  redirect("/estoque/materiais");
}

/** Desativado some da baixa da ordem, mas continua nas ordens em que já foi usado. */
export async function ativarMaterial(id: string, ativo: boolean): Promise<void> {
  await exigirUsuario("gerenciarMateriais");
  await sql`update materiais set ativo = ${ativo} where id = ${id}`;
  revalidatePath("/estoque/materiais");
}
