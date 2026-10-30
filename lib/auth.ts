import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { sql } from "./db";
import { pode, type Permissao } from "./permissoes";
import type { Usuario } from "./types";

export const COOKIE_SESSAO = "cidade_sessao";
const DIAS_DE_SESSAO = 30;

function hashDoToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function gerarHashDeSenha(senha: string): Promise<string> {
  return bcrypt.hash(senha, 10);
}

/** Confere email e senha; devolve o usuário ou null. */
export async function conferirLogin(email: string, senha: string): Promise<Usuario | null> {
  const [linha] = await sql<(Usuario & { senha_hash: string })[]>`
    select id, nome, email, papel, ativo, senha_hash
    from usuarios where email = ${email.trim().toLowerCase()}`;
  if (!linha || !linha.ativo) return null;
  if (!(await bcrypt.compare(senha, linha.senha_hash))) return null;
  const { senha_hash: _, ...usuario } = linha;
  return usuario;
}

export async function abrirSessao(usuarioId: string): Promise<void> {
  const token = randomBytes(32).toString("hex");
  const expira = new Date(Date.now() + DIAS_DE_SESSAO * 24 * 60 * 60 * 1000);
  await sql`
    insert into sessoes (token_hash, usuario_id, expira_em)
    values (${hashDoToken(token)}, ${usuarioId}, ${expira})`;
  // Limpeza de passagem: sessões vencidas não servem para nada.
  await sql`delete from sessoes where expira_em < now()`;
  cookies().set(COOKIE_SESSAO, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expira,
  });
}

export async function fecharSessao(): Promise<void> {
  const token = cookies().get(COOKIE_SESSAO)?.value;
  if (token) await sql`delete from sessoes where token_hash = ${hashDoToken(token)}`;
  cookies().delete(COOKIE_SESSAO);
}

/** Usuário logado, ou null. */
export async function usuarioAtual(): Promise<Usuario | null> {
  const token = cookies().get(COOKIE_SESSAO)?.value;
  if (!token) return null;
  const [usuario] = await sql<Usuario[]>`
    select u.id, u.nome, u.email, u.papel, u.ativo
    from sessoes s join usuarios u on u.id = s.usuario_id
    where s.token_hash = ${hashDoToken(token)} and s.expira_em > now() and u.ativo`;
  return usuario ?? null;
}

/** Para telas e ações: exige login (e, se pedido, uma permissão). */
export async function exigirUsuario(permissao?: Permissao): Promise<Usuario> {
  const usuario = await usuarioAtual();
  if (!usuario) redirect("/login");
  if (permissao && !pode(usuario.papel, permissao)) redirect("/?sem-permissao=1");
  return usuario;
}

export async function existeAlgumUsuario(): Promise<boolean> {
  const [{ existe }] = await sql<{ existe: boolean }[]>`select exists(select 1 from usuarios) as existe`;
  return existe;
}
