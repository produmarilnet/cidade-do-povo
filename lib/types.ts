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
