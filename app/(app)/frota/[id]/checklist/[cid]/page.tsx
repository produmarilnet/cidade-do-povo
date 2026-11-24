import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Trash2 } from "lucide-react";
import { exigirUsuario } from "@/lib/auth";
import { sql } from "@/lib/db";
import { pode } from "@/lib/permissoes";
import { NOME_SITUACAO_ITEM, textoKm } from "@/lib/frota";
import { dataHoraDaFicha } from "@/lib/iluminacao";
import type { Checklist, ItemChecklist, Veiculo } from "@/lib/types";
import { cn, formatarData } from "@/lib/utils";
import { BotaoAcao } from "@/components/formulario";
import { BotaoImprimir } from "@/components/imprimir";
import { Marca } from "@/components/marca";
import { Aviso } from "@/components/ui";
import { excluirChecklist } from "../../../actions";

const COR: Record<ItemChecklist["situacao"], string> = {
  ok: "text-green-800",
  problema: "font-semibold text-red-700",
  na: "text-stone-400",
};

/** O checklist feito: na tela e na impressão (uma A4). Os problemas vêm primeiro. */
export default async function ChecklistPage({
  params,
  searchParams,
}: {
  params: { id: string; cid: string };
  searchParams: { novo?: string };
}) {
  const eu = await exigirUsuario("verFrota");
  const [c] = await sql<(Checklist & Pick<Veiculo, "placa" | "modelo">)[]>`
    select c.*, v.placa, v.modelo
    from veiculo_checklists c join veiculos v on v.id = c.veiculo_id
    where c.id = ${params.cid} and c.veiculo_id = ${params.id}`.catch(() => []);
  if (!c) notFound();

  const problemas = c.itens.filter((i) => i.situacao === "problema");
  const grupos = [...new Set(c.itens.map((i) => i.grupo))];

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-2 print:hidden">
        <Link
          href={`/frota/${params.id}?aba=checklists`}
          className="mr-auto inline-flex items-center gap-1 text-sm text-stone-500 hover:text-stone-800"
        >
          <ChevronLeft className="h-4 w-4" />
          {c.modelo} · {c.placa}
        </Link>
        <BotaoImprimir />
        {pode(eu.papel, "gerenciarFrota") && (
          <BotaoAcao
            acao={excluirChecklist.bind(null, params.id, c.id)}
            variante="fantasma"
            confirmar={`Apagar o checklist de ${formatarData(c.data)}? Não dá para desfazer.`}
          >
            <Trash2 className="h-4 w-4" />
            Apagar
          </BotaoAcao>
        )}
      </div>
      {searchParams.novo && (
        <div className="mb-4 print:hidden">
          <Aviso tipo="ok">Checklist salvo.</Aviso>
        </div>
      )}

      <div className="mx-auto max-w-[190mm] rounded-xl bg-white p-5 shadow-sm print:max-w-none print:rounded-none print:p-0 print:shadow-none">
        <div className="flex items-center justify-between gap-4 border-b border-stone-300 pb-3">
          <Marca />
          <div className="text-right">
            <div className="text-base font-bold uppercase">Checklist do veículo</div>
            <div className="text-xs text-stone-500">{dataHoraDaFicha(c.criado_em)}</div>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
          <div>
            <span className="text-stone-500">Veículo: </span>
            <span className="font-semibold">
              {c.modelo} · {c.placa}
            </span>
          </div>
          <div>
            <span className="text-stone-500">Data: </span>
            {formatarData(c.data)}
          </div>
          <div>
            <span className="text-stone-500">Conferido por: </span>
            {c.responsavel}
          </div>
          <div>
            <span className="text-stone-500">Km: </span>
            {c.km !== null ? textoKm(c.km) : "—"}
          </div>
        </div>

        <div
          className={cn(
            "mt-3 rounded-lg px-3 py-2 text-sm",
            problemas.length ? "bg-red-50 text-red-800" : "bg-green-50 text-green-800",
          )}
        >
          {problemas.length === 0 ? (
            <span className="font-semibold">Tudo OK.</span>
          ) : (
            <>
              <span className="font-semibold">
                {problemas.length} {problemas.length === 1 ? "item com problema" : "itens com problema"}:
              </span>
              <ul className="mt-1 list-disc pl-5">
                {problemas.map((p) => (
                  <li key={`${p.grupo}|${p.item}`}>
                    {p.item}
                    {p.obs && ` — ${p.obs}`}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>

        <div className="mt-3 grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2 print:grid-cols-2">
          {grupos.map((g) => (
            <div key={g} className="break-inside-avoid">
              <div className="border-b border-stone-300 text-[11px] font-semibold uppercase tracking-wide text-stone-500">
                {g}
              </div>
              <ul>
                {c.itens
                  .filter((i) => i.grupo === g)
                  .map((i) => (
                    <li key={i.item} className="flex justify-between gap-2 border-b border-stone-100 py-0.5 text-[13px]">
                      <span>{i.item}</span>
                      <span className={cn("shrink-0", COR[i.situacao])}>{NOME_SITUACAO_ITEM[i.situacao]}</span>
                    </li>
                  ))}
              </ul>
            </div>
          ))}
        </div>

        {c.observacao && (
          <p className="mt-3 whitespace-pre-line text-sm">
            <span className="text-stone-500">Observação: </span>
            {c.observacao}
          </p>
        )}

        <div className="mt-10 hidden grid-cols-2 gap-10 text-center text-xs print:grid">
          <div className="border-t border-stone-500 pt-1">{c.responsavel}</div>
          <div className="border-t border-stone-500 pt-1">Responsável pela frota</div>
        </div>
      </div>
    </>
  );
}
