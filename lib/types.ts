export const PAPEIS = ["admin", "atendente", "eletricista", "visualizador"] as const;
export type Papel = (typeof PAPEIS)[number];

export const NOME_PAPEL: Record<Papel, string> = {
  admin: "Administrador",
  atendente: "Atendente",
  eletricista: "Eletricista",
  visualizador: "Visualizador",
};

export type Usuario = {
  id: string;
  nome: string;
  email: string;
  papel: Papel;
  ativo: boolean;
};

// ── Iluminação pública ─────────────────────────────────────────────────────

export const SITUACOES_ORDEM = ["aberta", "executada", "cancelada"] as const;
export type SituacaoOrdem = (typeof SITUACOES_ORDEM)[number];

export type OrdemServico = {
  id: string;
  numero: number;
  nome: string;
  apelido: string | null;
  telefone: string | null;
  endereco: string;
  numero_casa: string | null;
  ponto_referencia: string | null;
  servico: string;
  atendente: string;
  criado_em: Date; // data da ficha: preenchida pelo sistema ao salvar
  situacao: SituacaoOrdem;
  eletricista: string | null;
  material: string | null;
  data_execucao: string | null; // AAAA-MM-DD
  observacoes: string | null;
};

/** "un" = peça; "m" = metro (cabo). */
export type UnidadeMaterial = "un" | "m";

/** Item do banco de materiais (migration 0002). */
export type Material = {
  id: string;
  nome: string;
  unidade: UnidadeMaterial;
  ordem: number;
  ativo: boolean;
};

/** Material aplicado numa ordem — nome e unidade copiados na hora da baixa. */
export type MaterialDaOrdem = {
  material_id: string | null; // null = "outros", fora da lista
  descricao: string;
  quantidade: number;
  unidade: UnidadeMaterial;
};
