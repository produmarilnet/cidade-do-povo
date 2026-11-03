import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { exigirUsuario } from "@/lib/auth";
import { sql } from "@/lib/db";
import { pode } from "@/lib/permissoes";
import { quantidadeComUnidade } from "@/lib/iluminacao";
import type { EntradaEstoque, UnidadeMaterial } from "@/lib/types";
import { formatarData } from "@/lib/utils";
import { BotaoAcao } from "@/components/formulario";
import { Aviso, Cartao } from "@/components/ui";
import { excluirEntrada } from "../../actions";

export default async function EntradaPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { nova?: string };
}) {
  const eu = await exigirUsuario("verEstoque");
  const [e] = await sql<(EntradaEstoque & { lancado_por: string | null })[]>`
    select e.*, u.nome as lancado_por
    from estoque_entradas e left join usuarios u on u.id = e.criado_por
    where e.id = ${params.id}`.catch(() => []);
  if (!e) notFound();

  const itens = await sql<{ material_id: string; nome: string; unidade: UnidadeMaterial; quantidade: number }[]>`
    select i.material_id, m.nome, m.unidade, i.quantidade
    from estoque_entrada_itens i join materiais m on m.id = i.material_id
    where i.entrada_id = ${e.id}
    order by i.posicao`;

  return (
    <>
      <Link href="/estoque/entradas" className="mb-2 inline-flex items-center gap-1 text-sm text-stone-500 hover:text-stone-800">
        <ChevronLeft className="h-4 w-4" />
        Entradas
      </Link>
      <h1 className="mb-4 text-xl font-semibold">Entrada de {formatarData(e.data)}</h1>
      {searchParams.nova && (
        <div className="mb-4">
          <Aviso tipo="ok">Entrada lançada. O saldo dos materiais já subiu.</Aviso>
        </div>
      )}

      <Cartao className="mb-4 max-w-xl">
        <dl className="grid grid-cols-[auto,1fr] gap-x-4 gap-y-1.5 text-sm">
          <dt className="text-stone-500">Fornecedor</dt>
          <dd className="font-medium">{e.fornecedor ?? "—"}</dd>
          <dt className="text-stone-500">Nota / documento</dt>
          <dd className="font-medium">{e.documento ?? "—"}</dd>
          {e.observacao && (
            <>
              <dt className="text-stone-500">Observação</dt>
              <dd className="whitespace-pre-line">{e.observacao}</dd>
            </>
          )}
          <dt className="text-stone-500">Lançado por</dt>
          <dd>{e.lancado_por ?? "—"}</dd>
        </dl>
      </Cartao>

      <Cartao className="mb-4 max-w-xl p-0">
        <ul className="divide-y divide-stone-100">
          {itens.map((i) => (
            <li key={i.material_id}>
              <Link href={`/estoque/${i.material_id}`} className="flex gap-3 px-4 py-2.5 text-sm hover:bg-stone-50">
                <span className="w-16 shrink-0 text-right font-medium tabular-nums">
                  {quantidadeComUnidade(i.quantidade, i.unidade)}
                </span>
                <span>{i.nome}</span>
              </Link>
            </li>
          ))}
        </ul>
      </Cartao>

      {pode(eu.papel, "movimentarEstoque") && (
        <BotaoAcao
          acao={excluirEntrada.bind(null, e.id)}
          confirmar="Apagar esta entrada? Os materiais dela saem do saldo do estoque."
          variante="fantasma"
          className="text-red-700"
        >
          Apagar entrada (lançada errado)
        </BotaoAcao>
      )}
    </>
  );
}
