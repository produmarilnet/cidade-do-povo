"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { sql } from "@/lib/db";
import { exigirUsuario } from "@/lib/auth";
import { quantidadeComUnidade } from "@/lib/iluminacao";
import { erroDeValidacao, type Resultado } from "@/lib/resultado";
import type { UnidadeMaterial } from "@/lib/types";
import { hoje } from "@/lib/utils";

// Campo opcional vazio vira null no banco.
const opcional = z
  .string()
  .trim()
  .max(200)
  .transform((v) => v || null);

const data = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Informe a data.")
  .refine((d) => d <= hoje(), "A data não pode ser no futuro.");

const esquemaEntrada = z.object({
  data,
  fornecedor: opcional,
  documento: opcional,
  observacao: opcional,
  itens: z
    .array(
      z.object({
        material_id: z.string().uuid("Na entrada só vale material do banco de materiais."),
        quantidade: z.number().positive("A quantidade precisa ser maior que zero.").max(99999),
      }),
    )
    .min(1, "Escolha pelo menos um material que chegou."),
});

/** Os itens chegam em JSON do campo escondido do seletor de materiais. */
function lerItens(texto: FormDataEntryValue | null): unknown {
  try {
    return JSON.parse(typeof texto === "string" && texto ? texto : "[]");
  } catch {
    return null;
  }
}

/** Dá entrada no que chegou: a nota (data, fornecedor, nº) e os materiais dela. */
export async function darEntrada(_: Resultado, dados: FormData): Promise<Resultado> {
  const eu = await exigirUsuario("movimentarEstoque");
  const lido = esquemaEntrada.safeParse({
    data: dados.get("data") ?? "",
    fornecedor: dados.get("fornecedor") ?? "",
    documento: dados.get("documento") ?? "",
    observacao: dados.get("observacao") ?? "",
    itens: lerItens(dados.get("itens")),
  });
  if (!lido.success) return erroDeValidacao(lido.error);
  const e = lido.data;

  // o mesmo material tocado duas vezes vira uma linha só
  const somados = new Map<string, number>();
  for (const i of e.itens) somados.set(i.material_id, (somados.get(i.material_id) ?? 0) + i.quantidade);

  const id = await sql.begin(async (tx) => {
    const [{ id }] = await tx<{ id: string }[]>`
      insert into estoque_entradas (data, fornecedor, documento, observacao, criado_por)
      values (${e.data}, ${e.fornecedor}, ${e.documento}, ${e.observacao}, ${eu.id})
      returning id`;
    let posicao = 0;
    for (const [material_id, quantidade] of somados) {
      await tx`
        insert into estoque_entrada_itens (entrada_id, material_id, quantidade, posicao)
        values (${id}, ${material_id}, ${quantidade}, ${posicao++})`;
    }
    return id;
  });
  revalidatePath("/estoque");
  redirect(`/estoque/entradas/${id}?nova=1`);
}

/** Entrada lançada errado: apaga a nota inteira (o saldo volta como era). */
export async function excluirEntrada(id: string): Promise<void> {
  await exigirUsuario("movimentarEstoque");
  await sql`delete from estoque_entradas where id = ${id}`;
  revalidatePath("/estoque");
  redirect("/estoque/entradas");
}

const esquemaAcerto = z.object({
  contado: z.number().min(0, "A quantidade contada não pode ser negativa.").max(99999),
  motivo: z.string().trim().min(3, "Diga o motivo do acerto (ex.: contagem do mês, perda, quebra).").max(300),
  data,
});

/**
 * Acerto pela contagem: a pessoa conta o que tem na prateleira e o sistema
 * lança a diferença para o saldo ficar igual ao contado.
 */
export async function acertarEstoque(materialId: string, _: Resultado, dados: FormData): Promise<Resultado> {
  const eu = await exigirUsuario("movimentarEstoque");
  const textoContado = String(dados.get("contado") ?? "").trim();
  if (!textoContado) return { ok: false, erro: "Informe quanto tem de verdade na prateleira." };
  // aqui o zero vale (acabou), por isso não usa o lerQuantidade
  const contado = Number(textoContado.replace(",", "."));
  if (!Number.isFinite(contado)) return { ok: false, erro: "A quantidade contada não é um número." };
  const lido = esquemaAcerto.safeParse({
    contado: Math.round(contado * 100) / 100,
    motivo: dados.get("motivo") ?? "",
    data: dados.get("data") ?? "",
  });
  if (!lido.success) return erroDeValidacao(lido.error);
  const a = lido.data;

  const [m] = await sql<{ saldo: number; unidade: UnidadeMaterial }[]>`
    select saldo, unidade from v_estoque where id = ${materialId}`;
  if (!m) return { ok: false, erro: "Material não encontrado." };
  const diferenca = Math.round((a.contado - m.saldo) * 100) / 100;
  if (diferenca === 0) return { ok: true, mensagem: "O contado bate com o sistema — não precisou acertar nada." };

  await sql`
    insert into estoque_acertos (material_id, data, contado, diferenca, motivo, criado_por)
    values (${materialId}, ${a.data}, ${a.contado}, ${diferenca}, ${a.motivo}, ${eu.id})`;
  revalidatePath("/estoque");
  revalidatePath(`/estoque/${materialId}`);
  return {
    ok: true,
    mensagem: `Acertado: ${diferenca > 0 ? "sobrou" : "faltou"} ${quantidadeComUnidade(Math.abs(diferenca), m.unidade)}. O saldo agora é o contado.`,
  };
}
