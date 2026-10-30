"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { sql } from "@/lib/db";
import { exigirUsuario, gerarHashDeSenha } from "@/lib/auth";
import { erroDeValidacao, type Resultado } from "@/lib/resultado";
import { PAPEIS, type Papel } from "@/lib/types";

const senha = z.string().min(6, "A senha precisa ter pelo menos 6 caracteres.");

export async function criarUsuario(_: Resultado, dados: FormData): Promise<Resultado> {
  await exigirUsuario("gerenciarUsuarios");
  const lido = z
    .object({
      nome: z.string().trim().min(2, "Informe o nome."),
      email: z.string().trim().toLowerCase().email("Email inválido."),
      papel: z.enum(PAPEIS),
      senha,
    })
    .safeParse(Object.fromEntries(dados));
  if (!lido.success) return erroDeValidacao(lido.error);
  const u = lido.data;
  try {
    await sql`
      insert into usuarios (nome, email, senha_hash, papel)
      values (${u.nome}, ${u.email}, ${await gerarHashDeSenha(u.senha)}, ${u.papel})`;
  } catch {
    return { ok: false, erro: "Já existe um usuário com esse email." };
  }
  revalidatePath("/usuarios");
  return { ok: true, mensagem: `${u.nome} cadastrado. Passe o email e a senha para a pessoa.` };
}

/** Garante que sempre sobra pelo menos um administrador ativo. */
async function sobraOutroAdmin(id: string): Promise<boolean> {
  const [{ n }] = await sql<{ n: number }[]>`
    select count(*)::int as n from usuarios where papel = 'admin' and ativo and id <> ${id}`;
  return n > 0;
}

export async function mudarPapel(id: string, papel: Papel): Promise<void> {
  await exigirUsuario("gerenciarUsuarios");
  if (!PAPEIS.includes(papel)) return;
  if (papel !== "admin" && !(await sobraOutroAdmin(id))) return;
  await sql`update usuarios set papel = ${papel} where id = ${id}`;
  revalidatePath("/usuarios");
}

export async function alternarAtivo(id: string): Promise<void> {
  const eu = await exigirUsuario("gerenciarUsuarios");
  if (id === eu.id) return; // não dá para desativar a si mesmo
  await sql`update usuarios set ativo = not ativo where id = ${id}`;
  // Desativado sai na hora: derruba as sessões abertas.
  await sql`delete from sessoes where usuario_id = ${id} and exists (select 1 from usuarios where id = ${id} and not ativo)`;
  revalidatePath("/usuarios");
}

export async function redefinirSenha(id: string, _: Resultado, dados: FormData): Promise<Resultado> {
  await exigirUsuario("gerenciarUsuarios");
  const lido = senha.safeParse(dados.get("senha"));
  if (!lido.success) return erroDeValidacao(lido.error);
  await sql`update usuarios set senha_hash = ${await gerarHashDeSenha(lido.data)} where id = ${id}`;
  await sql`delete from sessoes where usuario_id = ${id}`;
  return { ok: true, mensagem: "Senha trocada." };
}
