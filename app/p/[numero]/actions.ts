"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { sql } from "@/lib/db";
import { ATENDENTE_QR, PEDIDOS_QR_POR_HORA } from "@/lib/iluminacao";
import { erroDeValidacao, type Resultado } from "@/lib/resultado";
import type { Poste } from "@/lib/types";

const esquemaPedido = z.object({
  servico: z.string().trim().min(3, "Diga qual é o problema do poste.").max(300, "Escreva o problema em poucas palavras."),
  nome: z.string().trim().min(2, "Informe o seu nome.").max(80, "O nome está grande demais."),
  telefone: z
    .string()
    .trim()
    .max(20)
    .refine((t) => t.replace(/\D/g, "").length >= 10, "Informe o telefone com DDD, para a equipe poder falar com você."),
});

/**
 * Pedido de conserto de quem leu o QR. É a ÚNICA ação do sistema sem login, por
 * isso não começa com exigirUsuario e tem os próprios freios: só poste cadastrado
 * e ativo, um pedido aberto por poste e um limite por hora para o sistema todo.
 * O endereço vem do cadastro do poste, nunca do formulário.
 */
export async function pedirConserto(numero: number, _: Resultado, dados: FormData): Promise<Resultado> {
  const lido = esquemaPedido.safeParse({
    servico: dados.get("servico") ?? "",
    nome: dados.get("nome") ?? "",
    telefone: dados.get("telefone") ?? "",
  });
  if (!lido.success) return erroDeValidacao(lido.error);
  const p = lido.data;

  const [poste] = await sql<Poste[]>`
    select * from postes where numero = ${numero} and ativo and cadastrado_em is not null`;
  if (!poste?.endereco) return { ok: false, erro: "Este poste não está recebendo pedidos pelo QR." };

  const [{ n }] = await sql<{ n: number }[]>`
    select count(*)::int as n from ordens_servico
    where atendente = ${ATENDENTE_QR} and criado_em > now() - interval '1 hour'`;
  if (n >= PEDIDOS_QR_POR_HORA) {
    return { ok: false, erro: "Recebemos muitos pedidos agora. Tente de novo daqui a pouco." };
  }

  // numa instrução só: dois moradores no mesmo poste não abrem duas ordens
  const feitas = await sql`
    insert into ordens_servico (nome, telefone, localidade, bairro, endereco, ponto_referencia, servico, atendente, poste_id)
    select ${p.nome}::text, ${p.telefone}::text, ${poste.localidade}::text, ${poste.bairro}::text, ${poste.endereco}::text,
           ${poste.ponto_referencia}::text, ${p.servico}::text, ${ATENDENTE_QR}::text, ${poste.id}::uuid
    where not exists (select 1 from ordens_servico where poste_id = ${poste.id}::uuid and situacao = 'aberta')`;

  revalidatePath("/iluminacao");
  revalidatePath("/postes", "layout");
  redirect(`/p/${numero}${feitas.count > 0 ? "?pedido=1" : ""}`);
}
