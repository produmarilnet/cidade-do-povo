"use server";

import { redirect } from "next/navigation";
import { abrirSessao, conferirLogin, fecharSessao } from "@/lib/auth";
import type { Resultado } from "@/lib/resultado";

export async function entrar(_: Resultado, dados: FormData): Promise<Resultado> {
  const email = String(dados.get("email") ?? "");
  const senha = String(dados.get("senha") ?? "");
  const usuario = await conferirLogin(email, senha);
  if (!usuario) return { ok: false, erro: "Email ou senha não conferem." };
  await abrirSessao(usuario.id);
  redirect("/");
}

export async function sair() {
  await fecharSessao();
  redirect("/login");
}
