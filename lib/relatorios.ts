import { sql } from "./db";
import { formatarData } from "./utils";
import { dataDaFicha, quantidadeComUnidade } from "./iluminacao";
import type { SituacaoOrdem, UnidadeMaterial } from "./types";

// ── Relatórios da iluminação pública ───────────────────────────────────────
//
// Cada relatório é um agrupamento das ordens do período. Os que falam do que
// foi FEITO (serviço executado, material, data de execução, equipe) olham só as
// ordens executadas, pela data de execução. Os que falam do PEDIDO (data de
// solicitação, localidade, solicitante, concluídos e não concluídos) olham
// todas as ordens abertas no período, pela data de solicitação.

export const TIPOS_RELATORIO = [
  { tipo: "servico", titulo: "Por serviço executado", base: "execucao" },
  { tipo: "material", titulo: "Por material usado", base: "execucao" },
  { tipo: "execucao", titulo: "Por data de execução", base: "execucao" },
  { tipo: "solicitacao", titulo: "Por data de solicitação", base: "solicitacao" },
  { tipo: "localidade", titulo: "Por localidade (sede ou povoado)", base: "solicitacao" },
  { tipo: "equipe", titulo: "Por equipe", base: "execucao" },
  { tipo: "solicitante", titulo: "Por nome do solicitante", base: "solicitacao" },
  { tipo: "situacao", titulo: "Concluídos e não concluídos", base: "solicitacao" },
] as const;

export type TipoRelatorio = (typeof TIPOS_RELATORIO)[number]["tipo"];

/** Filtro de situação dos relatórios pelo pedido. */
export const FILTROS_SITUACAO = [
  { valor: "todas", texto: "Todas" },
  { valor: "concluidas", texto: "Concluídas" },
  { valor: "nao_concluidas", texto: "Não concluídas" },
  { valor: "canceladas", texto: "Canceladas" },
] as const;
export type FiltroSituacao = (typeof FILTROS_SITUACAO)[number]["valor"];

const SITUACAO_DO_FILTRO: Record<FiltroSituacao, SituacaoOrdem[]> = {
  todas: ["aberta", "executada", "cancelada"],
  concluidas: ["executada"],
  nao_concluidas: ["aberta"],
  canceladas: ["cancelada"],
};

/** A ordem como aparece no detalhe do relatório. */
export type OrdemDoRelatorio = {
  id: string;
  numero: number;
  nome: string;
  localidade: string | null;
  endereco: string;
  numero_casa: string | null;
  servico: string;
  servico_executado: string | null;
  situacao: SituacaoOrdem;
  eletricista: string | null;
  equipe: string | null;
  data_execucao: string | null;
  criado_em: Date;
};

export type GrupoDoRelatorio = {
  rotulo: string;
  ordens: OrdemDoRelatorio[];
  /** Só no relatório de material: o total usado ("12 un", "87,5 m"). */
  quantidade?: string;
};

export type Relatorio = {
  grupos: GrupoDoRelatorio[];
  /** Quantas ordens entraram (uma ordem conta uma vez, mesmo em vários materiais). */
  totalOrdens: number;
};

// Mesma chave para "Bom Jesus", "bom jesus " e "Bom  Jesús".
const chave = (t: string) =>
  t
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

/** Junta as ordens por um rótulo; o primeiro jeito de escrever vira o nome do grupo. */
function agrupar(ordens: OrdemDoRelatorio[], rotuloDe: (o: OrdemDoRelatorio) => string): GrupoDoRelatorio[] {
  const grupos = new Map<string, GrupoDoRelatorio>();
  for (const o of ordens) {
    const rotulo = rotuloDe(o);
    const k = chave(rotulo);
    const g = grupos.get(k) ?? { rotulo, ordens: [] };
    g.ordens.push(o);
    grupos.set(k, g);
  }
  return Array.from(grupos.values());
}

const maisOrdensPrimeiro = (a: GrupoDoRelatorio, b: GrupoDoRelatorio) =>
  b.ordens.length - a.ordens.length || a.rotulo.localeCompare(b.rotulo, "pt-BR");

const NOME_SITUACAO_RELATORIO: Record<SituacaoOrdem, string> = {
  executada: "Concluídos (executados)",
  aberta: "Não concluídos (em aberto)",
  cancelada: "Cancelados",
};

export async function gerarRelatorio(
  tipo: TipoRelatorio,
  de: string,
  ate: string,
  filtro: FiltroSituacao,
): Promise<Relatorio> {
  const base = TIPOS_RELATORIO.find((t) => t.tipo === tipo)!.base;
  const situacoes = base === "execucao" ? ["executada"] : SITUACAO_DO_FILTRO[filtro];

  const ordens = await sql<OrdemDoRelatorio[]>`
    select id, numero, nome, localidade, endereco, numero_casa, servico, servico_executado,
           situacao, eletricista, equipe, data_execucao, criado_em
    from ordens_servico
    where situacao in ${sql(situacoes)}
      and ${
        base === "execucao"
          ? sql`data_execucao between ${de} and ${ate}`
          : sql`(criado_em at time zone 'America/Sao_Paulo')::date between ${de} and ${ate}`
      }
    order by ${base === "execucao" ? sql`data_execucao, numero` : sql`criado_em, numero`}`;

  if (tipo === "material") return relatorioDeMaterial(ordens);

  let grupos: GrupoDoRelatorio[];
  switch (tipo) {
    case "servico":
      grupos = agrupar(ordens, (o) => o.servico_executado ?? o.servico).sort(maisOrdensPrimeiro);
      break;
    case "execucao":
      // já vem em ordem de data
      grupos = agrupar(ordens, (o) => formatarData(o.data_execucao));
      break;
    case "solicitacao":
      grupos = agrupar(ordens, (o) => dataDaFicha(o.criado_em));
      break;
    case "localidade":
      grupos = agrupar(ordens, (o) => o.localidade ?? "Localidade não informada").sort(maisOrdensPrimeiro);
      break;
    case "equipe":
      grupos = agrupar(ordens, (o) => o.equipe ?? "Equipe não informada").sort(maisOrdensPrimeiro);
      break;
    case "solicitante":
      grupos = agrupar(ordens, (o) => o.nome).sort(maisOrdensPrimeiro);
      break;
    case "situacao": {
      const ordem: SituacaoOrdem[] = ["executada", "aberta", "cancelada"];
      grupos = agrupar(ordens, (o) => NOME_SITUACAO_RELATORIO[o.situacao]).sort(
        (a, b) => ordem.indexOf(a.ordens[0].situacao) - ordem.indexOf(b.ordens[0].situacao),
      );
      break;
    }
  }
  return { grupos, totalOrdens: ordens.length };
}

/** Material usado: soma o que foi aplicado nas ordens executadas do período. */
async function relatorioDeMaterial(ordens: OrdemDoRelatorio[]): Promise<Relatorio> {
  if (ordens.length === 0) return { grupos: [], totalOrdens: 0 };
  const porId = new Map(ordens.map((o) => [o.id, o]));
  const itens = await sql<{ ordem_id: string; descricao: string; nome: string | null; quantidade: number; unidade: UnidadeMaterial }[]>`
    select om.ordem_id, om.descricao, m.nome, om.quantidade, om.unidade
    from ordem_materiais om left join materiais m on m.id = om.material_id
    where om.ordem_id in ${sql(ordens.map((o) => o.id))}`;

  // agrupa pelo nome de hoje do material (o "outros" pela descrição) e pela unidade
  const grupos = new Map<string, GrupoDoRelatorio & { total: number; unidade: UnidadeMaterial }>();
  const usaram = new Set<string>();
  for (const i of itens) {
    const rotulo = i.nome ?? i.descricao;
    const k = `${chave(rotulo)}|${i.unidade}`;
    const g = grupos.get(k) ?? { rotulo, ordens: [], total: 0, unidade: i.unidade };
    g.total = Math.round((g.total + i.quantidade) * 100) / 100;
    const o = porId.get(i.ordem_id)!;
    if (!g.ordens.includes(o)) g.ordens.push(o);
    grupos.set(k, g);
    usaram.add(i.ordem_id);
  }
  // dentro do material, as ordens na ordem em que foram executadas
  const ordemDe = new Map(ordens.map((o, i) => [o.id, i]));
  for (const g of grupos.values()) g.ordens.sort((a, b) => ordemDe.get(a.id)! - ordemDe.get(b.id)!);
  const lista = Array.from(grupos.values())
    .sort((a, b) => b.ordens.length - a.ordens.length || b.total - a.total || a.rotulo.localeCompare(b.rotulo, "pt-BR"))
    .map(({ total, unidade, ...g }) => ({ ...g, quantidade: quantidadeComUnidade(total, unidade) }));
  return { grupos: lista, totalOrdens: usaram.size };
}
