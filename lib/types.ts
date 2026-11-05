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
  // migration 0004 — as ordens antigas vêm sem localidade e sem equipe
  localidade: string | null; // "Sede" ou o nome do povoado
  equipe: string | null;
  servico_executado: string | null; // o que foi feito (pode diferir do pedido)
  bairro: string | null; // migration 0005 — opcional: povoado nem sempre tem bairro
  poste_id: string | null; // migration 0006 — a ordem pode dizer de qual poste é
};

/** Poste da cidade (migration 0006). Sem cadastrado_em: etiqueta impressa, ainda sem localização. */
export type Poste = {
  id: string;
  numero: number;
  latitude: number | null;
  longitude: number | null;
  precisao: number | null; // ± metros do GPS na hora de marcar
  localidade: string | null;
  bairro: string | null;
  endereco: string | null;
  ponto_referencia: string | null;
  ativo: boolean;
  cadastrado_em: Date | null;
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
  /** Abaixo disso o estoque avisa que está acabando. 0 = sem aviso (migration 0003). */
  estoque_minimo: number;
};

/** Linha da view v_estoque: o material com o saldo e de onde ele veio. */
export type SaldoMaterial = Material & {
  entradas: number;
  saidas: number; // aplicado nas ordens executadas
  acertos: number; // soma das diferenças da contagem
  saldo: number;
};

/** Entrada de material no estoque (a nota que chegou). */
export type EntradaEstoque = {
  id: string;
  data: string; // AAAA-MM-DD
  fornecedor: string | null;
  documento: string | null;
  observacao: string | null;
  criado_em: Date;
};

/** Material aplicado numa ordem — nome e unidade copiados na hora da baixa. */
export type MaterialDaOrdem = {
  material_id: string | null; // null = "outros", fora da lista
  descricao: string;
  quantidade: number;
  unidade: UnidadeMaterial;
};
