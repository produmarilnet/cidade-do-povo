import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { exigirUsuario } from "@/lib/auth";
import { sql } from "@/lib/db";
import type { Eletricista, EpiEntregue } from "@/lib/types";
import { formatarData } from "@/lib/utils";
import { BotaoImprimir } from "@/components/imprimir";
import { Marca } from "@/components/marca";

/** Linhas da tabela numa folha: o que foi lançado e o resto em branco, para escrever à mão. */
const LINHAS_NA_FOLHA = 22;

/**
 * A ficha de entrega dos materiais de segurança, para o eletricista assinar
 * cada entrega. Sai em A4 com o que já foi lançado e linhas em branco embaixo.
 */
export default async function FichaEpiPage({ params }: { params: { id: string } }) {
  await exigirUsuario("verEletricistas");
  const [e] = await sql<Eletricista[]>`select * from eletricistas where id = ${params.id}`.catch(() => []);
  if (!e) notFound();
  const epis = await sql<EpiEntregue[]>`
    select * from eletricista_epis where eletricista_id = ${e.id}
    order by data, criado_em, item`;
  const brancas = Math.max(LINHAS_NA_FOLHA - epis.length, 4);

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-2 print:hidden">
        <Link
          href={`/eletricistas/${e.id}`}
          className="mr-auto inline-flex items-center gap-1 text-sm text-stone-500 hover:text-stone-800"
        >
          <ChevronLeft className="h-4 w-4" />
          {e.nome}
        </Link>
        <BotaoImprimir />
      </div>

      <div className="mx-auto max-w-[190mm] bg-white p-6 text-stone-900 shadow-sm print:max-w-none print:p-0 print:shadow-none">
        <div className="flex items-center justify-between gap-4 border-b border-stone-300 pb-3">
          <Marca />
          <div className="text-right">
            <div className="text-base font-bold uppercase">Ficha de entrega de EPI</div>
            <div className="text-xs text-stone-500">Equipamento de proteção individual</div>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
          <div>
            <span className="text-stone-500">Nome: </span>
            <span className="font-semibold">{e.nome}</span>
          </div>
          <div>
            <span className="text-stone-500">Função: </span>
            {e.funcao || "—"}
          </div>
          <div>
            <span className="text-stone-500">CPF: </span>
            {e.cpf || "—"}
          </div>
          <div>
            <span className="text-stone-500">Admissão: </span>
            {formatarData(e.data_admissao)}
          </div>
        </div>

        <p className="mt-3 text-[11px] leading-snug text-stone-700">
          Declaro que recebi os equipamentos de proteção individual abaixo, em perfeito estado, e que fui orientado
          sobre o uso correto deles. Comprometo-me a usá-los durante o trabalho, a guardá-los e conservá-los, e a
          devolvê-los ou pedir a troca quando estiverem danificados.
        </p>

        <table className="mt-3 w-full border-collapse text-[12px]">
          <thead>
            <tr className="bg-stone-100 text-left">
              <th className="w-[20mm] border border-stone-400 px-1.5 py-1">Data</th>
              <th className="w-[12mm] border border-stone-400 px-1.5 py-1 text-center">Qtd</th>
              <th className="border border-stone-400 px-1.5 py-1">Material</th>
              <th className="w-[20mm] border border-stone-400 px-1.5 py-1">CA</th>
              <th className="w-[50mm] border border-stone-400 px-1.5 py-1">Assinatura</th>
            </tr>
          </thead>
          <tbody>
            {epis.map((i) => (
              <tr key={i.id} className="h-7">
                <td className="border border-stone-400 px-1.5 tabular-nums">{formatarData(i.data)}</td>
                <td className="border border-stone-400 px-1.5 text-center tabular-nums">{i.quantidade}</td>
                <td className="border border-stone-400 px-1.5">{i.item}</td>
                <td className="border border-stone-400 px-1.5">{i.ca}</td>
                <td className="border border-stone-400" />
              </tr>
            ))}
            {Array.from({ length: brancas }, (_, n) => (
              <tr key={`branca-${n}`} className="h-7">
                <td className="border border-stone-400" />
                <td className="border border-stone-400" />
                <td className="border border-stone-400" />
                <td className="border border-stone-400" />
                <td className="border border-stone-400" />
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-12 grid grid-cols-2 gap-10 text-center text-xs">
          <div className="border-t border-stone-500 pt-1">{e.nome}</div>
          <div className="border-t border-stone-500 pt-1">Responsável pela entrega</div>
        </div>
      </div>
    </>
  );
}
