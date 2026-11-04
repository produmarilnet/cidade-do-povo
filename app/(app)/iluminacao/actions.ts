"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { sql } from "@/lib/db";
import { exigirUsuario } from "@/lib/auth";
import { localidadeDoBanco } from "@/lib/localidades";
import { erroDeValidacao, type Resultado } from "@/lib/resultado";

// Campo opcional vazio vira null no banco.
const opcional = z
  .string()
  .trim()
  .transform((v) => v || null);

const esquemaPedido = z.object({
  nome: z.string().trim().min(2, "Informe o nome de quem pediu."),
  apelido: opcional,
  telefone: opcional,
  localidade: z.string().trim().min(2, "Informe a localidade: Sede ou o nome do povoado.").max(80),
  endereco: z.string().trim().min(3, "Informe o endereço."),
  numero_casa: opcional,
  ponto_referencia: opcional,
  servico: z.string().trim().min(3, "Diga qual serviço foi pedido."),
  atendente: z.string().trim().min(2, "Informe o nome do atendente."),
});

async function lerPedido(dados: FormData) {
  const lido = esquemaPedido.safeParse({
    nome: dados.get("nome") ?? "",
    apelido: dados.get("apelido") ?? "",
    telefone: dados.get("telefone") ?? "",
    localidade: dados.get("localidade") ?? "",
    endereco: dados.get("endereco") ?? "",
    numero_casa: dados.get("numero_casa") ?? "",
    ponto_referencia: dados.get("ponto_referencia") ?? "",
    servico: dados.get("servico") ?? "",
    atendente: dados.get("atendente") ?? "",
  });
  // o mesmo povoado escrito de outro jeito fica com a grafia que já existe
  if (lido.success) lido.data.localidade = await localidadeDoBanco(lido.data.localidade);
  return lido;
}

/** Abre a ordem. A data da ficha é a hora em que foi salva (o banco preenche). */
export async function abrirOrdem(_: Resultado, dados: FormData): Promise<Resultado> {
  const eu = await exigirUsuario("abrirOrdens");
  const lido = await lerPedido(dados);
  if (!lido.success) return erroDeValidacao(lido.error);
  const p = lido.data;
  const [{ id }] = await sql<{ id: string }[]>`
    insert into ordens_servico
      (nome, apelido, telefone, localidade, endereco, numero_casa, ponto_referencia, servico, atendente, criado_por)
    values
      (${p.nome}, ${p.apelido}, ${p.telefone}, ${p.localidade}, ${p.endereco}, ${p.numero_casa},
       ${p.ponto_referencia}, ${p.servico}, ${p.atendente}, ${eu.id})
    returning id`;
  revalidatePath("/iluminacao");
  redirect(`/iluminacao/${id}?nova=1`);
}

/** Corrige os dados do pedido. Nº e data da ficha não mudam. */
export async function corrigirOrdem(id: string, _: Resultado, dados: FormData): Promise<Resultado> {
  await exigirUsuario("abrirOrdens");
  const lido = await lerPedido(dados);
  if (!lido.success) return erroDeValidacao(lido.error);
  const p = lido.data;
  await sql`
    update ordens_servico set
      nome = ${p.nome}, apelido = ${p.apelido}, telefone = ${p.telefone},
      localidade = ${p.localidade}, endereco = ${p.endereco},
      numero_casa = ${p.numero_casa}, ponto_referencia = ${p.ponto_referencia}, servico = ${p.servico},
      atendente = ${p.atendente}, atualizado_em = now()
    where id = ${id}`;
  revalidatePath("/iluminacao");
  redirect(`/iluminacao/${id}`);
}

const esquemaExecucao = z.object({
  eletricista: z.string().trim().min(2, "Informe o eletricista que executou."),
  equipe: opcional,
  servico_executado: z.string().trim().min(3, "Diga qual serviço foi feito.").max(500),
  material: opcional,
  data_execucao: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Informe a data do serviço."),
  observacoes: opcional,
});

/** O material escolhido na baixa, que chega em JSON do campo escondido. */
const esquemaMateriais = z.array(
  z.object({
    material_id: z.string().uuid().nullable(),
    descricao: z.string().trim().min(1, "Diga qual é o outro material.").max(200),
    quantidade: z.number().positive("A quantidade do material precisa ser maior que zero.").max(99999),
    unidade: z.enum(["un", "m"]),
  }),
);

function lerMateriais(texto: FormDataEntryValue | null) {
  let json: unknown = [];
  try {
    json = JSON.parse(typeof texto === "string" && texto ? texto : "[]");
  } catch {
    json = null;
  }
  return esquemaMateriais.safeParse(json);
}

/** Passa para o sistema o que veio escrito na ficha da rua e dá a ordem como executada. */
export async function registrarExecucao(id: string, _: Resultado, dados: FormData): Promise<Resultado> {
  const eu = await exigirUsuario("registrarExecucao");
  const lido = esquemaExecucao.safeParse({
    eletricista: dados.get("eletricista") ?? "",
    equipe: dados.get("equipe") ?? "",
    servico_executado: dados.get("servico_executado") ?? "",
    material: dados.get("material") ?? "",
    data_execucao: dados.get("data_execucao") ?? "",
    observacoes: dados.get("observacoes") ?? "",
  });
  if (!lido.success) return erroDeValidacao(lido.error);
  const materiais = lerMateriais(dados.get("materiais"));
  if (!materiais.success) return erroDeValidacao(materiais.error);
  const e = lido.data;

  // A ordem e o material dela mudam juntos: ou grava tudo, ou nada.
  const gravou = await sql.begin(async (tx) => {
    const feitas = await tx`
      update ordens_servico set
        situacao = 'executada', eletricista = ${e.eletricista}, equipe = ${e.equipe},
        servico_executado = ${e.servico_executado}, material = ${e.material},
        data_execucao = ${e.data_execucao}, observacoes = ${e.observacoes},
        baixa_por = ${eu.id}, atualizado_em = now()
      where id = ${id} and situacao <> 'cancelada'`;
    if (feitas.count === 0) return false;
    // corrigir a baixa troca a lista inteira pelo que está na tela
    await tx`delete from ordem_materiais where ordem_id = ${id}`;
    for (const [posicao, m] of materiais.data.entries()) {
      await tx`
        insert into ordem_materiais (ordem_id, material_id, descricao, quantidade, unidade, posicao)
        values (${id}, ${m.material_id}, ${m.descricao}, ${m.quantidade}, ${m.unidade}, ${posicao})`;
    }
    return true;
  });
  if (!gravou) return { ok: false, erro: "Ordem cancelada não pode ser executada. Reabra antes." };
  revalidatePath("/iluminacao");
  revalidatePath(`/iluminacao/${id}`);
  return { ok: true, mensagem: "Serviço registrado. A ordem está executada." };
}

export async function cancelarOrdem(id: string): Promise<void> {
  await exigirUsuario("abrirOrdens");
  await sql`
    update ordens_servico set situacao = 'cancelada', atualizado_em = now()
    where id = ${id} and situacao = 'aberta'`;
  revalidatePath("/iluminacao");
  revalidatePath(`/iluminacao/${id}`);
}

/** Volta a ordem para aberta. O que já foi escrito da execução fica guardado. */
export async function reabrirOrdem(id: string): Promise<void> {
  await exigirUsuario("abrirOrdens");
  await sql`update ordens_servico set situacao = 'aberta', atualizado_em = now() where id = ${id}`;
  revalidatePath("/iluminacao");
  revalidatePath(`/iluminacao/${id}`);
}
