import "server-only";
import { sql } from "@/lib/db";
import type { Veiculo } from "@/lib/types";

/**
 * O veículo com o que a lista e a ficha mostram:
 * - km_atual: o maior km lançado (cadastro, manutenção ou checklist);
 * - a próxima manutenção: a da última manutenção lançada com "próxima"
 *   (lançou a troca de óleo nova com a próxima, a antiga deixa de contar);
 * - a última manutenção e o último checklist.
 */
export type VeiculoResumo = Veiculo & {
  km_atual: number;
  proxima_km: number | null;
  proxima_data: string | null;
  proxima_servico: string | null;
  ultima_manutencao: string | null; // AAAA-MM-DD
  ultimo_checklist: string | null; // AAAA-MM-DD
  ultimo_checklist_problemas: number | null;
};

export async function veiculosComResumo(id?: string): Promise<VeiculoResumo[]> {
  return sql<VeiculoResumo[]>`
    select v.*,
      greatest(
        v.km_inicial,
        coalesce((select max(m.km) from veiculo_manutencoes m where m.veiculo_id = v.id), 0),
        coalesce((select max(c.km) from veiculo_checklists c where c.veiculo_id = v.id), 0)
      )::int as km_atual,
      p.proxima_km, p.proxima_data, p.servico as proxima_servico,
      (select max(m.data) from veiculo_manutencoes m where m.veiculo_id = v.id) as ultima_manutencao,
      uc.data as ultimo_checklist, uc.problemas as ultimo_checklist_problemas
    from veiculos v
    left join lateral (
      select m.proxima_km, m.proxima_data, m.servico from veiculo_manutencoes m
      where m.veiculo_id = v.id and (m.proxima_km is not null or m.proxima_data is not null)
      order by m.data desc, m.criado_em desc limit 1
    ) p on true
    left join lateral (
      select c.data, c.problemas from veiculo_checklists c
      where c.veiculo_id = v.id
      order by c.data desc, c.criado_em desc limit 1
    ) uc on true
    ${id ? sql`where v.id = ${id}` : sql``}
    order by v.ativo desc, v.modelo, v.placa`;
}
