"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { sql } from "@/lib/db";
import { abrirSessao, gerarHashDeSenha } from "@/lib/auth";
import { erroDeValidacao, type Resultado } from "@/lib/resultado";

const esquema = z.object({
  nome: z.string().trim().min(2, "Informe o nome."),
  email: z.string().trim().toLowerCase().email("Email inválido."),
  senha: z.string().min(6, "A senha precisa ter pelo menos 6 caracteres."),
});

/** Cria o primeiro administrador. Só funciona enquanto não existe nenhum usuário. */
export async function criarPrimeiroAdmin(_: Resultado, dados: FormData): Promise<Resultado> {
  const lido = esquema.safeParse(Object.fromEntries(dados));
  if (!lido.success) return erroDeValidacao(lido.error);
  const { nome, email, senha } = lido.data;
  const hash = await gerarHashDeSenha(senha);

  // O "where not exists" na mesma instrução impede dois primeiros acessos ao mesmo tempo.
  const criados = await sql<{ id: string }[]>`
    insert into usuarios (nome, email, senha_hash, papel)
    select ${nome}, ${email}, ${hash}, 'admin'
    where not exists (select 1 from usuarios)
    returning id`;
  if (criados.length === 0) redirect("/login");

  await abrirSessao(criados[0].id);
  redirect("/");
}
