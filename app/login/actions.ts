"use server";

import { redirect } from "next/navigation";
import { abrirSessao, conferirLogin, fecharSessao } from "@/lib/auth";
import type { Resultado } from "@/lib/resultado";

/** Só caminho do próprio site: "//outro.com" levaria a pessoa para fora depois do login. */
function destinoSeguro(volta: FormDataEntryValue | null): string {
  return typeof volta === "string" && /^\/(?![/\\])/.test(volta) ? volta : "/";
}

export async function entrar(_: Resultado, dados: FormData): Promise<Resultado> {
  const email = String(dados.get("email") ?? "");
  const senha = String(dados.get("senha") ?? "");
  const usuario = await conferirLogin(email, senha);
  if (!usuario) return { ok: false, erro: "Email ou senha não conferem." };
  await abrirSessao(usuario.id);
  redirect(destinoSeguro(dados.get("volta")));
}

export async function sair() {
  await fecharSessao();
  redirect("/login");
}
