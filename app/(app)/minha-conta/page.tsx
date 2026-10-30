import { z } from "zod";
import { exigirUsuario, conferirLogin, gerarHashDeSenha } from "@/lib/auth";
import { sql } from "@/lib/db";
import { erroDeValidacao, type Resultado } from "@/lib/resultado";
import { NOME_PAPEL } from "@/lib/types";
import { Formulario } from "@/components/formulario";
import { Campo, Cartao, Rotulo, Titulo } from "@/components/ui";

async function trocarMinhaSenha(_: Resultado, dados: FormData): Promise<Resultado> {
  "use server";
  const eu = await exigirUsuario();
  const lido = z
    .object({
      atual: z.string().min(1, "Informe a senha atual."),
      nova: z.string().min(6, "A nova senha precisa ter pelo menos 6 caracteres."),
    })
    .safeParse(Object.fromEntries(dados));
  if (!lido.success) return erroDeValidacao(lido.error);
  if (!(await conferirLogin(eu.email, lido.data.atual))) return { ok: false, erro: "A senha atual não confere." };
  await sql`update usuarios set senha_hash = ${await gerarHashDeSenha(lido.data.nova)} where id = ${eu.id}`;
  return { ok: true, mensagem: "Senha trocada." };
}

export default async function MinhaContaPage() {
  const eu = await exigirUsuario();
  return (
    <>
      <Titulo>Minha conta</Titulo>
      <Cartao className="mb-4 text-sm">
        <div className="font-medium">{eu.nome}</div>
        <div className="text-stone-500">
          {eu.email} · {NOME_PAPEL[eu.papel]}
        </div>
      </Cartao>
      <Cartao className="max-w-md">
        <h2 className="mb-3 font-semibold">Trocar senha</h2>
        <Formulario acao={trocarMinhaSenha} limparAoSalvar textoBotao="Trocar senha">
          <Rotulo texto="Senha atual">
            <Campo name="atual" type="password" autoComplete="current-password" required />
          </Rotulo>
          <Rotulo texto="Nova senha">
            <Campo name="nova" type="password" autoComplete="new-password" minLength={6} required />
          </Rotulo>
        </Formulario>
      </Cartao>
    </>
  );
}
