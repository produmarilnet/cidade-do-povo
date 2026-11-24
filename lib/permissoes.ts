import type { Papel } from "./types";

// Quem pode o quê. Cada módulo novo ganha uma linha aqui.
export const PODE = {
  gerenciarUsuarios: ["admin"],
  verIluminacao: ["admin", "atendente", "eletricista", "visualizador"],
  // abrir, corrigir e cancelar ordem de serviço
  abrirOrdens: ["admin", "atendente"],
  // apagar a ordem de vez, com o material lançado nela (pedido do setor, 16/11/2026)
  excluirOrdens: ["admin", "atendente"],
  // passar para o sistema o que o eletricista fez na rua
  registrarExecucao: ["admin", "atendente", "eletricista"],
  // incluir, renomear e desativar itens do banco de materiais
  gerenciarMateriais: ["admin", "atendente"],
  // ver o saldo do estoque e o extrato de cada material
  verEstoque: ["admin", "atendente", "eletricista", "visualizador"],
  // dar entrada de material e acertar o saldo pela contagem
  movimentarEstoque: ["admin", "atendente"],
  // ver a lista, o mapa e a ficha dos postes
  verPostes: ["admin", "atendente", "eletricista", "visualizador"],
  // marcar o poste pelo GPS na rua e corrigir o cadastro
  cadastrarPostes: ["admin", "atendente", "eletricista"],
  // gerar lote de etiquetas e desativar poste
  gerenciarPostes: ["admin", "atendente"],
  // ver a equipe: cadastro, EPI entregue, folgas e faltas (pedido de 24/11/2026)
  verEletricistas: ["admin", "atendente", "visualizador"],
  // cadastrar eletricista, lançar entrega de EPI, folga e falta, desligar
  gerenciarEletricistas: ["admin", "atendente"],
  // ver os veículos, as manutenções e os checklists (pedido de 24/11/2026)
  verFrota: ["admin", "atendente", "eletricista", "visualizador"],
  // fazer o checklist do veículo antes de sair (quem dirige é o eletricista)
  fazerChecklist: ["admin", "atendente", "eletricista"],
  // cadastrar veículo, lançar manutenção, desativar
  gerenciarFrota: ["admin", "atendente"],
} satisfies Record<string, readonly Papel[]>;

export type Permissao = keyof typeof PODE;

export function pode(papel: Papel, permissao: Permissao): boolean {
  return (PODE[permissao] as readonly Papel[]).includes(papel);
}
