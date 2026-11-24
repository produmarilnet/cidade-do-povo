"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { sql } from "@/lib/db";
import { exigirUsuario } from "@/lib/auth";
import { CHECKLIST, formatarPlaca, lerKm } from "@/lib/frota";
import { SITUACOES_ITEM, type ItemChecklist } from "@/lib/types";
import { lerDinheiro } from "@/lib/utils";
import { erroDeValidacao, type Resultado } from "@/lib/resultado";

const opcional = (max: number) =>
  z
    .string()
    .trim()
    .max(max, "Texto grande demais.")
    .transform((v) => v || null);

const data = (mensagem: string) => z.string().regex(/^\d{4}-\d{2}-\d{2}$/, mensagem);

/** km digitado ("12.345") → número; vazio → null. */
const km = (mensagem: string) =>
  z
    .string()
    .transform(lerKm)
    .refine((v) => v === null || (Number.isInteger(v) && v >= 0 && v < 10_000_000), mensagem);

// ── Veículo ────────────────────────────────────────────────────────────────

const esquemaVeiculo = z.object({
  placa: z
    .string()
    .transform(formatarPlaca)
    .refine((p) => /^[A-Z]{3}-?\d[A-Z0-9]\d{2}$/.test(p), "Placa inválida. Ex.: ABC1D23 ou ABC-1234."),
  modelo: z.string().trim().min(2, "Informe o modelo.").max(80),
  marca: opcional(40),
  ano: z
    .string()
    .trim()
    .transform((v) => (v ? Number(v) : null))
    .refine((v) => v === null || (Number.isInteger(v) && v >= 1950 && v <= 2100), "Ano inválido."),
  cor: opcional(30),
  tipo: opcional(40),
  renavam: opcional(20),
  chassi: opcional(30),
  km_inicial: km("Km inválido."),
  observacoes: opcional(1000),
});

/** Cadastra (id nulo) ou corrige o veículo. */
export async function salvarVeiculo(id: string | null, _: Resultado, dados: FormData): Promise<Resultado> {
  const eu = await exigirUsuario("gerenciarFrota");
  const lido = esquemaVeiculo.safeParse(
    Object.fromEntries(Object.keys(esquemaVeiculo.shape).map((k) => [k, dados.get(k) ?? ""])),
  );
  if (!lido.success) return erroDeValidacao(lido.error);
  const v = { ...lido.data, km_inicial: lido.data.km_inicial ?? 0 };

  // a mesma placa (com ou sem traço) não entra duas vezes
  const [repetida] = await sql<{ id: string }[]>`
    select id from veiculos
    where upper(replace(placa, '-', '')) = ${v.placa.replace("-", "")}
      and id is distinct from ${id}::uuid`.catch(() => []);
  if (repetida) return { ok: false, erro: `A placa ${v.placa} já está cadastrada.` };

  let salvo = id;
  if (salvo === null) {
    const [novo] = await sql<{ id: string }[]>`
      insert into veiculos
        (placa, modelo, marca, ano, cor, tipo, renavam, chassi, km_inicial, observacoes, criado_por)
      values
        (${v.placa}, ${v.modelo}, ${v.marca}, ${v.ano}, ${v.cor}, ${v.tipo}, ${v.renavam}, ${v.chassi},
         ${v.km_inicial}, ${v.observacoes}, ${eu.id})
      returning id`;
    salvo = novo.id;
  } else {
    const feitos = await sql`
      update veiculos set
        placa = ${v.placa}, modelo = ${v.modelo}, marca = ${v.marca}, ano = ${v.ano}, cor = ${v.cor},
        tipo = ${v.tipo}, renavam = ${v.renavam}, chassi = ${v.chassi}, km_inicial = ${v.km_inicial},
        observacoes = ${v.observacoes}, atualizado_em = now()
      where id = ${salvo}`.catch(() => ({ count: 0 }));
    if (feitos.count === 0) return { ok: false, erro: "Esse veículo não existe mais." };
  }
  revalidatePath("/frota", "layout");
  redirect(`/frota/${salvo}`);
}

/** Tira o veículo da frota (ou volta). Nunca apaga: o histórico fica. */
export async function ativarVeiculo(id: string, ativo: boolean): Promise<void> {
  await exigirUsuario("gerenciarFrota");
  await sql`update veiculos set ativo = ${ativo}, atualizado_em = now() where id = ${id}`;
  revalidatePath("/frota", "layout");
}

// ── Manutenção ─────────────────────────────────────────────────────────────

const esquemaManutencao = z.object({
  tipo: z.enum(["preventiva", "corretiva"], { errorMap: () => ({ message: "Escolha preventiva ou corretiva." }) }),
  servico: z.string().trim().min(3, "Escreva o que foi feito.").max(1000),
  data: data("Informe a data da manutenção."),
  km: km("Km inválido."),
  oficina: opcional(120),
  valor: z
    .string()
    .trim()
    .transform((t) => (t ? lerDinheiro(t) : null))
    .refine((v) => v === null || (Number.isFinite(v) && v >= 0), "Valor inválido."),
  proxima_km: km("Km da próxima inválido."),
  proxima_data: z
    .string()
    .trim()
    .transform((v) => v || null)
    .pipe(data("Data da próxima inválida.").nullable()),
  observacao: opcional(500),
});

/** Lança (id nulo) ou corrige a manutenção. */
export async function salvarManutencao(
  veiculoId: string,
  id: string | null,
  _: Resultado,
  dados: FormData,
): Promise<Resultado> {
  const eu = await exigirUsuario("gerenciarFrota");
  const lido = esquemaManutencao.safeParse(
    Object.fromEntries(Object.keys(esquemaManutencao.shape).map((k) => [k, dados.get(k) ?? ""])),
  );
  if (!lido.success) return erroDeValidacao(lido.error);
  const m = lido.data;
  try {
    if (id === null) {
      await sql`
        insert into veiculo_manutencoes
          (veiculo_id, data, km, tipo, servico, oficina, valor, proxima_km, proxima_data, observacao, criado_por)
        values
          (${veiculoId}, ${m.data}, ${m.km}, ${m.tipo}, ${m.servico}, ${m.oficina}, ${m.valor},
           ${m.proxima_km}, ${m.proxima_data}, ${m.observacao}, ${eu.id})`;
    } else {
      await sql`
        update veiculo_manutencoes set
          data = ${m.data}, km = ${m.km}, tipo = ${m.tipo}, servico = ${m.servico}, oficina = ${m.oficina},
          valor = ${m.valor}, proxima_km = ${m.proxima_km}, proxima_data = ${m.proxima_data},
          observacao = ${m.observacao}
        where id = ${id} and veiculo_id = ${veiculoId}`;
    }
  } catch {
    return { ok: false, erro: "Esse veículo não existe mais." };
  }
  revalidatePath("/frota", "layout");
  redirect(`/frota/${veiculoId}?aba=manutencoes`);
}

export async function excluirManutencao(veiculoId: string, id: string): Promise<void> {
  await exigirUsuario("gerenciarFrota");
  await sql`delete from veiculo_manutencoes where id = ${id} and veiculo_id = ${veiculoId}`;
  revalidatePath("/frota", "layout");
  redirect(`/frota/${veiculoId}?aba=manutencoes`);
}

// ── Checklist ──────────────────────────────────────────────────────────────

const esquemaChecklist = z.object({
  data: data("Informe a data."),
  km: km("Km inválido."),
  responsavel: z.string().trim().min(2, "Informe quem conferiu.").max(80),
  observacao: opcional(1000),
});

/**
 * Grava o checklist. Os itens vêm como "item:<nº do grupo>-<nº do item>" = ok / problema / na,
 * pela posição em CHECKLIST. Número e não o nome: nome de campo com acento ("Faróis")
 * chega estragado na server action e o item se perdia.
 */
export async function salvarChecklist(veiculoId: string, _: Resultado, dados: FormData): Promise<Resultado> {
  const eu = await exigirUsuario("fazerChecklist");
  const lido = esquemaChecklist.safeParse({
    data: dados.get("data") ?? "",
    km: dados.get("km") ?? "",
    responsavel: dados.get("responsavel") ?? "",
    observacao: dados.get("observacao") ?? "",
  });
  if (!lido.success) return erroDeValidacao(lido.error);
  const c = lido.data;

  // só os itens da lista oficial entram, na ordem dela
  const itens: ItemChecklist[] = [];
  for (const [gi, g] of CHECKLIST.entries()) {
    for (const [ii, item] of g.itens.entries()) {
      const chave = `${gi}-${ii}`;
      const situacao = dados.get(`item:${chave}`);
      if (situacao === null) continue; // grupo que não aparece para este veículo
      if (!(SITUACOES_ITEM as readonly string[]).includes(String(situacao))) {
        return { ok: false, erro: `Marque como está: ${item}.` };
      }
      const obs = String(dados.get(`obs:${chave}`) ?? "").trim().slice(0, 300);
      itens.push({ grupo: g.grupo, item, situacao: situacao as ItemChecklist["situacao"], ...(obs ? { obs } : {}) });
    }
  }
  if (itens.length === 0) return { ok: false, erro: "Nenhum item conferido." };
  const problemas = itens.filter((i) => i.situacao === "problema").length;

  let novo: { id: string };
  try {
    [novo] = await sql<{ id: string }[]>`
      insert into veiculo_checklists (veiculo_id, data, km, responsavel, itens, problemas, observacao, criado_por)
      values (${veiculoId}, ${c.data}, ${c.km}, ${c.responsavel}, ${sql.json(itens)}, ${problemas},
              ${c.observacao}, ${eu.id})
      returning id`;
  } catch {
    return { ok: false, erro: "Esse veículo não existe mais." };
  }
  revalidatePath("/frota", "layout");
  redirect(`/frota/${veiculoId}/checklist/${novo.id}?novo=1`);
}

export async function excluirChecklist(veiculoId: string, id: string): Promise<void> {
  await exigirUsuario("gerenciarFrota");
  await sql`delete from veiculo_checklists where id = ${id} and veiculo_id = ${veiculoId}`;
  revalidatePath("/frota", "layout");
  redirect(`/frota/${veiculoId}?aba=checklists`);
}
