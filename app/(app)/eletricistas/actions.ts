"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { sql } from "@/lib/db";
import { exigirUsuario } from "@/lib/auth";
import { TIPOS_OCORRENCIA } from "@/lib/types";
import { erroDeValidacao, type Resultado } from "@/lib/resultado";

const opcional = (max: number) =>
  z
    .string()
    .trim()
    .max(max, "Texto grande demais.")
    .transform((v) => v || null);

const data = (mensagem: string) => z.string().regex(/^\d{4}-\d{2}-\d{2}$/, mensagem);

const esquemaEletricista = z.object({
  nome: z.string().trim().min(3, "Informe o nome completo.").max(120),
  apelido: opcional(60),
  funcao: opcional(60),
  cpf: opcional(20),
  telefone: opcional(20),
  data_admissao: data("Informe a data de admissão."),
  tamanho_camisa: opcional(10),
  tamanho_calca: opcional(10),
  tamanho_bota: opcional(10),
  observacoes: opcional(1000),
});

/** Cadastra (id nulo) ou corrige o eletricista. */
export async function salvarEletricista(id: string | null, _: Resultado, dados: FormData): Promise<Resultado> {
  const eu = await exigirUsuario("gerenciarEletricistas");
  const lido = esquemaEletricista.safeParse(
    Object.fromEntries(Object.keys(esquemaEletricista.shape).map((k) => [k, dados.get(k) ?? ""])),
  );
  if (!lido.success) return erroDeValidacao(lido.error);
  const e = lido.data;

  let salvo = id;
  if (salvo === null) {
    const [novo] = await sql<{ id: string }[]>`
      insert into eletricistas
        (nome, apelido, funcao, cpf, telefone, data_admissao,
         tamanho_camisa, tamanho_calca, tamanho_bota, observacoes, criado_por)
      values
        (${e.nome}, ${e.apelido}, ${e.funcao}, ${e.cpf}, ${e.telefone}, ${e.data_admissao},
         ${e.tamanho_camisa}, ${e.tamanho_calca}, ${e.tamanho_bota}, ${e.observacoes}, ${eu.id})
      returning id`;
    salvo = novo.id;
  } else {
    const feitos = await sql`
      update eletricistas set
        nome = ${e.nome}, apelido = ${e.apelido}, funcao = ${e.funcao}, cpf = ${e.cpf},
        telefone = ${e.telefone}, data_admissao = ${e.data_admissao},
        tamanho_camisa = ${e.tamanho_camisa}, tamanho_calca = ${e.tamanho_calca},
        tamanho_bota = ${e.tamanho_bota}, observacoes = ${e.observacoes}, atualizado_em = now()
      where id = ${salvo}`.catch(() => ({ count: 0 }));
    if (feitos.count === 0) return { ok: false, erro: "Esse eletricista não existe mais." };
  }
  revalidatePath("/eletricistas", "layout");
  redirect(`/eletricistas/${salvo}`);
}

/** Desliga (ou readmite) o eletricista. Nunca apaga: o histórico de EPI fica. */
export async function ativarEletricista(id: string, ativo: boolean): Promise<void> {
  await exigirUsuario("gerenciarEletricistas");
  await sql`update eletricistas set ativo = ${ativo}, atualizado_em = now() where id = ${id}`;
  revalidatePath("/eletricistas", "layout");
}

// ── Materiais de segurança (EPI) ───────────────────────────────────────────

const esquemaEntrega = z.object({
  data: data("Informe a data da entrega."),
  itens: z
    .array(
      z.object({
        item: z.string().trim().min(2, "Escreva o nome do material.").max(120),
        quantidade: z.number().int("A quantidade é em peças inteiras.").min(1, "A quantidade mínima é 1.").max(999),
      }),
    )
    .min(1, "Marque pelo menos um material entregue."),
  ca: opcional(40),
  observacao: opcional(500),
});

/** Lança os materiais de segurança entregues de uma vez (o mesmo dia para todos). */
export async function entregarEpi(eletricistaId: string, _: Resultado, dados: FormData): Promise<Resultado> {
  const eu = await exigirUsuario("gerenciarEletricistas");
  let itens: unknown = [];
  try {
    itens = JSON.parse(String(dados.get("itens") ?? "[]"));
  } catch {
    return { ok: false, erro: "Não deu para ler os materiais marcados. Marque de novo." };
  }
  const lido = esquemaEntrega.safeParse({
    data: dados.get("data") ?? "",
    itens,
    ca: dados.get("ca") ?? "",
    observacao: dados.get("observacao") ?? "",
  });
  if (!lido.success) return erroDeValidacao(lido.error);
  const e = lido.data;

  const linhas = e.itens.map((i) => ({
    eletricista_id: eletricistaId,
    data: e.data,
    item: i.item,
    quantidade: i.quantidade,
    ca: e.ca,
    observacao: e.observacao,
    criado_por: eu.id,
  }));
  try {
    await sql`insert into eletricista_epis ${sql(linhas)}`;
  } catch {
    return { ok: false, erro: "Esse eletricista não existe mais." };
  }
  revalidatePath(`/eletricistas/${eletricistaId}`, "layout");
  const n = e.itens.length;
  return { ok: true, mensagem: n === 1 ? "Entrega lançada." : `Entrega de ${n} materiais lançada.` };
}

/** Apaga um item lançado errado. */
export async function excluirEpi(eletricistaId: string, id: string): Promise<void> {
  await exigirUsuario("gerenciarEletricistas");
  await sql`delete from eletricista_epis where id = ${id} and eletricista_id = ${eletricistaId}`;
  revalidatePath(`/eletricistas/${eletricistaId}`, "layout");
}

// ── Folgas, faltas, atestados e férias ─────────────────────────────────────

const esquemaOcorrencia = z
  .object({
    tipo: z.enum(TIPOS_OCORRENCIA, { errorMap: () => ({ message: "Escolha o que foi: folga, falta…" }) }),
    inicio: data("Informe o dia."),
    fim: z
      .string()
      .trim()
      .transform((v) => v || null)
      .pipe(data("Data final inválida.").nullable()),
    observacao: opcional(500),
  })
  .refine((o) => !o.fim || o.fim >= o.inicio, { message: "O último dia não pode ser antes do primeiro." });

/** Lança a folga, falta, atestado ou férias — de um dia ou de um período. */
export async function lancarOcorrencia(eletricistaId: string, _: Resultado, dados: FormData): Promise<Resultado> {
  const eu = await exigirUsuario("gerenciarEletricistas");
  // "um dia só" manda o fim vazio: o período é só o primeiro dia
  const periodo = dados.get("periodo") === "varios";
  const lido = esquemaOcorrencia.safeParse({
    tipo: dados.get("tipo") ?? "",
    inicio: dados.get("inicio") ?? "",
    fim: periodo ? (dados.get("fim") ?? "") : "",
    observacao: dados.get("observacao") ?? "",
  });
  if (!lido.success) return erroDeValidacao(lido.error);
  const o = lido.data;
  try {
    await sql`
      insert into eletricista_ocorrencias (eletricista_id, tipo, inicio, fim, observacao, criado_por)
      values (${eletricistaId}, ${o.tipo}, ${o.inicio}, ${o.fim ?? o.inicio}, ${o.observacao}, ${eu.id})`;
  } catch {
    return { ok: false, erro: "Esse eletricista não existe mais." };
  }
  revalidatePath("/eletricistas", "layout");
  return { ok: true, mensagem: "Lançado." };
}

/** Apaga o lançamento feito errado. */
export async function excluirOcorrencia(eletricistaId: string, id: string): Promise<void> {
  await exigirUsuario("gerenciarEletricistas");
  await sql`delete from eletricista_ocorrencias where id = ${id} and eletricista_id = ${eletricistaId}`;
  revalidatePath("/eletricistas", "layout");
}
