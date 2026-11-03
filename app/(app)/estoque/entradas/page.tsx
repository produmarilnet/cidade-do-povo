import Link from "next/link";
import { ArrowDownToLine, ChevronLeft } from "lucide-react";
import { exigirUsuario } from "@/lib/auth";
import { sql } from "@/lib/db";
import { pode } from "@/lib/permissoes";
import type { EntradaEstoque } from "@/lib/types";
import { formatarData } from "@/lib/utils";
import { Cartao, Titulo, classeBotao } from "@/components/ui";

/** As entradas do estoque, a mais nova em cima. */
export default async function EntradasPage() {
  const eu = await exigirUsuario("verEstoque");
  const entradas = await sql<(EntradaEstoque & { itens: number; resumo: string })[]>`
    select e.*,
      (select count(*)::int from estoque_entrada_itens i where i.entrada_id = e.id) as itens,
      (select string_agg(m.nome, ', ' order by i.posicao)
         from estoque_entrada_itens i join materiais m on m.id = i.material_id
        where i.entrada_id = e.id) as resumo
    from estoque_entradas e
    order by e.data desc, e.criado_em desc
    limit 300`;

  return (
    <>
      <Link href="/estoque" className="mb-2 inline-flex items-center gap-1 text-sm text-stone-500 hover:text-stone-800">
        <ChevronLeft className="h-4 w-4" />
        Estoque
      </Link>
      <Titulo
        acao={
          pode(eu.papel, "movimentarEstoque") && (
            <Link href="/estoque/entrada" className={classeBotao()}>
              <ArrowDownToLine className="h-4 w-4" />
              Dar entrada
            </Link>
          )
        }
      >
        Entradas no estoque
      </Titulo>

      {entradas.length === 0 ? (
        <Cartao className="text-center text-sm text-stone-500">Nenhuma entrada lançada ainda.</Cartao>
      ) : (
        <Cartao className="p-0">
          <ul className="divide-y divide-stone-100">
            {entradas.map((e) => (
              <li key={e.id}>
                <Link href={`/estoque/entradas/${e.id}`} className="flex gap-3 px-4 py-3 hover:bg-stone-50">
                  <div className="w-20 shrink-0 pt-0.5 text-sm tabular-nums text-stone-500">{formatarData(e.data)}</div>
                  <div className="min-w-0 flex-1">
                    <div className="font-medium">
                      {e.fornecedor ?? "Sem fornecedor"}
                      {e.documento && <span className="font-normal text-stone-500"> · doc. {e.documento}</span>}
                    </div>
                    <div className="truncate text-sm text-stone-500">
                      {e.itens} {e.itens === 1 ? "material" : "materiais"}: {e.resumo}
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </Cartao>
      )}
    </>
  );
}
