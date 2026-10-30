import type { ZodError } from "zod";

/** O que toda server action de formulário devolve para a tela. */
export type Resultado = { ok: boolean; erro?: string; mensagem?: string };

export function erroDeValidacao(erro: ZodError): Resultado {
  const problema = erro.issues[0];
  if (!problema) return { ok: false, erro: "Dados inválidos." };
  // Mensagem padrão do zod vem em inglês ("Required"…): troca por algo legível.
  if (problema.code === "invalid_type") {
    return { ok: false, erro: `Preencha o campo "${problema.path.join(".")}".` };
  }
  return { ok: false, erro: problema.message };
}
