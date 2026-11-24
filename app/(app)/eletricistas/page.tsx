import Link from "next/link";
import { ChevronRight, Plus } from "lucide-react";
import { exigirUsuario } from "@/lib/auth";
import { sql } from "@/lib/db";
import { pode } from "@/lib/permissoes";
import { COR_OCORRENCIA, HOJE_OCORRENCIA, tempoDeCasa } from "@/lib/eletricistas";
import type { Eletricista, TipoOcorrencia } from "@/lib/types";
import { formatarData, hoje } from "@/lib/utils";
import { Cartao, Etiqueta, Titulo, classeBotao } from "@/components/ui";

type Linha = Eletricista & {
  faltas_ano: number; // dias de falta (sem justificar) neste ano
  ausente_hoje: TipoOcorrencia | null;
};

/** A equipe: quem é, desde quando, quantas faltas no ano e quem não está hoje. */
export default async function EletricistasPage() {
  const eu = await exigirUsuario("verEletricistas");
  const dia = hoje();
  const ano = dia.slice(0, 4);

  const eletricistas = await sql<Linha[]>`
    select e.*,
      coalesce((
        select sum(least(o.fim, ${`${ano}-12-31`}::date) - greatest(o.inicio, ${`${ano}-01-01`}::date) + 1)
        from eletricista_ocorrencias o
        where o.eletricista_id = e.id and o.tipo = 'falta'
          and o.fim >= ${`${ano}-01-01`}::date and o.inicio <= ${`${ano}-12-31`}::date
      ), 0)::int as faltas_ano,
      (select o.tipo from eletricista_ocorrencias o
        where o.eletricista_id = e.id and ${dia}::date between o.inicio and o.fim
        order by o.criado_em desc limit 1) as ausente_hoje
    from eletricistas e
    order by e.ativo desc, e.nome`;

  const ativos = eletricistas.filter((e) => e.ativo);
  const ausentes = ativos.filter((e) => e.ausente_hoje).length;

  return (
    <>
      <Titulo
        acao={
          pode(eu.papel, "gerenciarEletricistas") && (
            <Link href="/eletricistas/novo" className={classeBotao()}>
              <Plus className="h-4 w-4" />
              Novo eletricista
            </Link>
          )
        }
      >
        Eletricistas
      </Titulo>
      <p className="-mt-2 mb-4 text-sm text-stone-500">
        {ativos.length} na equipe
        {ausentes > 0 && ` · ${ausentes} fora hoje`}. Toque no nome para ver os materiais de segurança entregues, as
        folgas e as faltas.
      </p>

      <Cartao className="p-0">
        {eletricistas.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-stone-500">Nenhum eletricista cadastrado ainda.</p>
        ) : (
          <ul className="divide-y divide-stone-100">
            {eletricistas.map((e) => (
              <li key={e.id}>
                <Link href={`/eletricistas/${e.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-stone-50">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={e.ativo ? "font-medium" : "text-stone-400"}>{e.nome}</span>
                      {e.apelido && <span className="text-sm text-stone-500">({e.apelido})</span>}
                      {!e.ativo && <Etiqueta cor="cinza">Desligado</Etiqueta>}
                      {e.ativo && e.ausente_hoje && (
                        <Etiqueta cor={COR_OCORRENCIA[e.ausente_hoje]}>{HOJE_OCORRENCIA[e.ausente_hoje]}</Etiqueta>
                      )}
                    </div>
                    <div className="text-sm text-stone-500">
                      {e.funcao && `${e.funcao} · `}
                      Admissão {formatarData(e.data_admissao)}
                      {e.ativo && ` · ${tempoDeCasa(e.data_admissao, dia)} de casa`}
                      {e.faltas_ano > 0 && (
                        <span className="text-red-700">
                          {" "}
                          · {e.faltas_ano} {e.faltas_ano === 1 ? "falta" : "faltas"} em {ano}
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-stone-400" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Cartao>
    </>
  );
}
