import Link from "next/link";
import { exigirUsuario } from "@/lib/auth";
import { dataDaFicha, numeroDaOrdem } from "@/lib/iluminacao";
import {
  FILTROS_SITUACAO,
  TIPOS_RELATORIO,
  gerarRelatorio,
  type FiltroSituacao,
  type TipoRelatorio,
} from "@/lib/relatorios";
import { cn, formatarData, hoje } from "@/lib/utils";
import { BotaoImprimir } from "@/components/imprimir";
import { Marca } from "@/components/marca";
import { Cartao, Titulo, classeBotao } from "@/components/ui";

const DATA = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Os relatórios da iluminação pública: escolhe o tipo e o período, e a tela
 * mostra os grupos com quantas ordens cada um teve — e, se pedir, as ordens de
 * cada grupo. "Imprimir" sai em A4 só com o relatório.
 */
export default async function RelatoriosPage({
  searchParams,
}: {
  searchParams: { tipo?: string; de?: string; ate?: string; situacao?: string; detalhe?: string };
}) {
  await exigirUsuario("verIluminacao");

  const tipo = (TIPOS_RELATORIO.find((t) => t.tipo === searchParams.tipo)?.tipo ?? "servico") as TipoRelatorio;
  const def = TIPOS_RELATORIO.find((t) => t.tipo === tipo)!;
  const hojeIso = hoje();
  let de = DATA.test(searchParams.de ?? "") ? searchParams.de! : `${hojeIso.slice(0, 7)}-01`;
  let ate = DATA.test(searchParams.ate ?? "") ? searchParams.ate! : hojeIso;
  if (de > ate) [de, ate] = [ate, de];
  const situacao = (FILTROS_SITUACAO.find((f) => f.valor === searchParams.situacao)?.valor ?? "todas") as FiltroSituacao;
  const detalhe = searchParams.detalhe === "1";

  const { grupos, totalOrdens } = await gerarRelatorio(tipo, de, ate, situacao);
  const comQuantidade = tipo === "material";

  const link = (t: string) =>
    `/relatorios?tipo=${t}&de=${de}&ate=${ate}&situacao=${situacao}${detalhe ? "&detalhe=1" : ""}`;
  const explicacao =
    def.base === "execucao"
      ? "Ordens executadas, pela data de execução."
      : "Ordens abertas no período, pela data de solicitação.";

  return (
    <>
      <style>{`@page { size: A4; margin: 12mm; }`}</style>

      <div className="print:hidden">
        <Titulo acao={<BotaoImprimir texto="Imprimir relatório" />}>Relatórios</Titulo>

        <div className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {TIPOS_RELATORIO.map((t) => (
            <Link
              key={t.tipo}
              href={link(t.tipo)}
              className={cn(
                "rounded-lg border px-3 py-2.5 text-sm",
                t.tipo === tipo
                  ? "border-marca-600 bg-marca-50 font-semibold text-marca-800 ring-1 ring-marca-600"
                  : "border-stone-300 bg-white text-stone-700 hover:bg-stone-50",
              )}
            >
              {t.titulo}
            </Link>
          ))}
        </div>

        <Cartao className="mb-4">
          <form className="flex flex-wrap items-end gap-3">
            <input type="hidden" name="tipo" value={tipo} />
            <label className="flex flex-col gap-1 text-sm font-medium text-stone-700">
              De
              <input
                type="date"
                name="de"
                defaultValue={de}
                max={hojeIso}
                className="h-10 rounded-lg border border-stone-300 bg-white px-3 text-base sm:text-sm"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm font-medium text-stone-700">
              Até
              <input
                type="date"
                name="ate"
                defaultValue={ate}
                max={hojeIso}
                className="h-10 rounded-lg border border-stone-300 bg-white px-3 text-base sm:text-sm"
              />
            </label>
            {def.base === "solicitacao" ? (
              <label className="flex flex-col gap-1 text-sm font-medium text-stone-700">
                Situação
                <select
                  name="situacao"
                  defaultValue={situacao}
                  className="h-10 rounded-lg border border-stone-300 bg-white px-3 text-base sm:text-sm"
                >
                  {FILTROS_SITUACAO.map((f) => (
                    <option key={f.valor} value={f.valor}>
                      {f.texto}
                    </option>
                  ))}
                </select>
              </label>
            ) : (
              <input type="hidden" name="situacao" value={situacao} />
            )}
            <label className="flex h-10 items-center gap-2 text-sm text-stone-700">
              <input type="checkbox" name="detalhe" value="1" defaultChecked={detalhe} className="h-4 w-4" />
              Mostrar as ordens de cada grupo
            </label>
            <button className={classeBotao()}>Gerar</button>
          </form>
          <p className="mt-2 text-xs text-stone-500">{explicacao}</p>
        </Cartao>
      </div>

      {/* ── O relatório (é o que sai na impressão) ── */}
      <article className="bg-white">
        <header className="mb-3 hidden items-center justify-between gap-4 border-b-2 border-stone-800 pb-2 print:flex">
          <Marca />
          <div className="text-right text-xs text-stone-500">Emitido em {formatarData(hojeIso)}</div>
        </header>

        <div className="mb-3">
          <h2 className="text-lg font-semibold">Iluminação pública — {def.titulo.toLowerCase()}</h2>
          <p className="text-sm text-stone-600">
            De {formatarData(de)} a {formatarData(ate)} · {explicacao.replace(".", "")}
            {def.base === "solicitacao" && situacao !== "todas" && (
              <> · só {FILTROS_SITUACAO.find((f) => f.valor === situacao)!.texto.toLowerCase()}</>
            )}
            {" · "}
            <span className="font-medium text-stone-900">
              {totalOrdens} {totalOrdens === 1 ? "ordem" : "ordens"}
            </span>
          </p>
        </div>

        {grupos.length === 0 ? (
          <Cartao className="text-center text-sm text-stone-500 print:border-0 print:shadow-none">
            Nenhuma ordem nesse período.
          </Cartao>
        ) : (
          <Cartao className="overflow-x-auto p-0 print:overflow-visible print:border-0 print:shadow-none">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone-300 text-left text-xs uppercase tracking-wide text-stone-500">
                  <th className="px-4 py-2 font-semibold">{rotuloDoGrupo(tipo)}</th>
                  {comQuantidade && <th className="px-4 py-2 text-right font-semibold">Quantidade</th>}
                  <th className="px-4 py-2 text-right font-semibold">Ordens</th>
                  {!comQuantidade && <th className="px-4 py-2 text-right font-semibold">%</th>}
                </tr>
              </thead>
              {grupos.map((g, i) => (
                <tbody key={i} className="border-b border-stone-200 print:break-inside-avoid">
                  <tr className={cn(detalhe && "bg-stone-50 print:bg-stone-100")}>
                    <td className="px-4 py-2 font-medium">{g.rotulo}</td>
                    {comQuantidade && <td className="px-4 py-2 text-right font-semibold tabular-nums">{g.quantidade}</td>}
                    <td className="px-4 py-2 text-right tabular-nums">{g.ordens.length}</td>
                    {!comQuantidade && (
                      <td className="px-4 py-2 text-right tabular-nums text-stone-500">
                        {Math.round((g.ordens.length / totalOrdens) * 100)}%
                      </td>
                    )}
                  </tr>
                  {detalhe &&
                    g.ordens.map((o) => (
                      <tr key={o.id} className="text-xs text-stone-600">
                        <td colSpan={3} className="px-4 py-1 pl-8">
                          <Link href={`/iluminacao/${o.id}`} className="hover:underline">
                            <span className="font-medium tabular-nums text-stone-800">nº {numeroDaOrdem(o.numero)}</span>
                            {" · "}
                            {o.situacao === "executada" && o.data_execucao
                              ? `executada ${formatarData(o.data_execucao)}`
                              : `${o.situacao === "cancelada" ? "CANCELADA" : "em aberto"} · pedida ${dataDaFicha(o.criado_em)}`}
                            {" · "}
                            {o.nome}
                            {" · "}
                            {o.endereco}
                            {o.numero_casa && `, ${o.numero_casa}`}
                            {o.localidade && ` (${o.localidade})`}
                            {" · "}
                            {o.servico_executado ?? o.servico}
                            {o.situacao === "executada" && (o.equipe || o.eletricista) && (
                              <> · {[o.equipe, o.eletricista].filter(Boolean).join(" / ")}</>
                            )}
                          </Link>
                        </td>
                      </tr>
                    ))}
                </tbody>
              ))}
            </table>
          </Cartao>
        )}
      </article>
    </>
  );
}

function rotuloDoGrupo(tipo: TipoRelatorio): string {
  switch (tipo) {
    case "servico":
      return "Serviço executado";
    case "material":
      return "Material";
    case "execucao":
      return "Data de execução";
    case "solicitacao":
      return "Data de solicitação";
    case "localidade":
      return "Localidade";
    case "equipe":
      return "Equipe";
    case "solicitante":
      return "Solicitante";
    case "situacao":
      return "Situação";
  }
}
