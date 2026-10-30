import type { Papel } from "./types";

// Quem pode o quê. Cada módulo novo ganha uma linha aqui.
export const PODE = {
  gerenciarUsuarios: ["admin"],
  verIluminacao: ["admin", "atendente", "eletricista", "visualizador"],
  // abrir, corrigir e cancelar ordem de serviço
  abrirOrdens: ["admin", "atendente"],
  // passar para o sistema o que o eletricista fez na rua
  registrarExecucao: ["admin", "atendente", "eletricista"],
} satisfies Record<string, readonly Papel[]>;

export type Permissao = keyof typeof PODE;

export function pode(papel: Papel, permissao: Permissao): boolean {
  return (PODE[permissao] as readonly Papel[]).includes(papel);
}
