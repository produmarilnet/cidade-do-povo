import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Pencil, Printer, Trash2 } from "lucide-react";
import { exigirUsuario } from "@/lib/auth";
import { sql } from "@/lib/db";
import { pode } from "@/lib/permissoes";
import { COR_OCORRENCIA, diasDoPeriodo, NOME_OCORRENCIA, tempoDeCasa } from "@/lib/eletricistas";
import { TIPOS_OCORRENCIA, type Eletricista, type EpiEntregue, type Ocorrencia } from "@/lib/types";
import { cn, formatarData, hoje } from "@/lib/utils";
import { BotaoAcao } from "@/components/formulario";
import { Cartao, Etiqueta, classeBotao } from "@/components/ui";
import { ativarEletricista, entregarEpi, excluirEpi, excluirOcorrencia, lancarOcorrencia } from "../actions";
import { FormEpi } from "./form-epi";
import { FormOcorrencia } from "./form-ocorrencia";

/** Dias do período que caem dentro do ano (férias de dezembro a janeiro contam em cada ano a sua parte). */
function diasNoAno(o: Ocorrencia, ano: string): number {
  const inicio = o.inicio > `${ano}-01-01` ? o.inicio : `${ano}-01-01`;
  const fim = o.fim < `${ano}-12-31` ? o.fim : `${ano}-12-31`;
  return fim < inicio ? 0 : diasDoPeriodo(inicio, fim);
}

export default async function EletricistaPage({ params }: { params: { id: string } }) {
  const eu = await exigirUsuario("verEletricistas");
  const [e] = await sql<Eletricista[]>`select * from eletricistas where id = ${params.id}`.catch(() => []);
  if (!e) notFound();
  const podeMexer = pode(eu.papel, "gerenciarEletricistas");
  const dia = hoje();
  const ano = dia.slice(0, 4);

  const [epis, ocorrencias] = await Promise.all([
    sql<EpiEntregue[]>`
      select * from eletricista_epis where eletricista_id = ${e.id}
      order by data desc, criado_em desc, item`,
    sql<Ocorrencia[]>`
      select * from eletricista_ocorrencias where eletricista_id = ${e.id}
      order by inicio desc, criado_em desc`,
  ]);

  // os materiais entregues juntos (mesmo dia) ficam num bloco só
  const entregas: { data: string; itens: EpiEntregue[] }[] = [];
  for (const epi of epis) {
    const ultima = entregas[entregas.length - 1];
    if (ultima?.data === epi.data) ultima.itens.push(epi);
    else entregas.push({ data: epi.data, itens: [epi] });
  }

  const diasPorTipo = Object.fromEntries(
    TIPOS_OCORRENCIA.map((t) => [t, ocorrencias.filter((o) => o.tipo === t).reduce((s, o) => s + diasNoAno(o, ano), 0)]),
  ) as Record<(typeof TIPOS_OCORRENCIA)[number], number>;

  const tamanhos = [
    e.tamanho_camisa && `camisa ${e.tamanho_camisa}`,
    e.tamanho_calca && `calça ${e.tamanho_calca}`,
    e.tamanho_bota && `bota ${e.tamanho_bota}`,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <>
      <Link href="/eletricistas" className="mb-2 inline-flex items-center gap-1 text-sm text-stone-500 hover:text-stone-800">
        <ChevronLeft className="h-4 w-4" />
        Eletricistas
      </Link>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <h1 className="mr-auto text-xl font-semibold">
          {e.nome} {e.apelido && <span className="font-normal text-stone-500">({e.apelido})</span>}{" "}
          {!e.ativo && <Etiqueta cor="cinza">Desligado</Etiqueta>}
        </h1>
        <Link href={`/eletricistas/${e.id}/ficha-epi`} className={classeBotao("secundario")}>
          <Printer className="h-4 w-4" />
          Ficha de EPI
        </Link>
        {podeMexer && (
          <>
            <Link href={`/eletricistas/${e.id}/editar`} className={classeBotao("secundario")}>
              <Pencil className="h-4 w-4" />
              Alterar cadastro
            </Link>
            <BotaoAcao
              acao={ativarEletricista.bind(null, e.id, !e.ativo)}
              variante="fantasma"
              confirmar={
                e.ativo
                  ? `Desligar ${e.nome} da equipe? Ele sai da lista de ativos, mas os materiais entregues, folgas e faltas ficam guardados.`
                  : undefined
              }
            >
              {e.ativo ? "Desligar" : "Readmitir"}
            </BotaoAcao>
          </>
        )}
      </div>

      <div className="flex flex-col gap-4">
        <Cartao>
          <dl className="grid grid-cols-1 gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
            <Dado rotulo="Função" valor={e.funcao} />
            <Dado
              rotulo="Admissão"
              valor={`${formatarData(e.data_admissao)}${e.ativo ? ` · ${tempoDeCasa(e.data_admissao, dia)} de casa` : ""}`}
            />
            <Dado rotulo="CPF" valor={e.cpf} />
            <Dado rotulo="Telefone" valor={e.telefone} />
            <Dado rotulo="Tamanhos" valor={tamanhos || null} />
            <Dado rotulo="Observações" valor={e.observacoes} />
          </dl>
        </Cartao>

        <div>
          <h2 className="mb-2 font-semibold">Em {ano}</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            <Numero rotulo="Folgas" dias={diasPorTipo.folga} />
            <Numero rotulo="Faltas" dias={diasPorTipo.falta} alerta />
            <Numero rotulo="Faltas justificadas" dias={diasPorTipo.falta_justificada} />
            <Numero rotulo="Atestado" dias={diasPorTipo.atestado} />
            <Numero rotulo="Férias" dias={diasPorTipo.ferias} />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* Materiais de segurança */}
          <div className="flex flex-col gap-4">
            {podeMexer && e.ativo && (
              <Cartao>
                <h2 className="mb-3 font-semibold">Entregar material de segurança</h2>
                <FormEpi acao={entregarEpi.bind(null, e.id)} hoje={dia} />
              </Cartao>
            )}
            <Cartao className="p-0">
              <h2 className="border-b border-stone-100 px-4 py-3 font-semibold">Materiais de segurança entregues</h2>
              {entregas.length === 0 ? (
                <p className="px-4 py-6 text-center text-sm text-stone-500">Nenhuma entrega lançada.</p>
              ) : (
                <ul className="divide-y divide-stone-100">
                  {entregas.map((entrega) => (
                    <li key={entrega.data} className="px-4 py-2.5">
                      <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-stone-500">
                        {formatarData(entrega.data)}
                      </div>
                      <ul className="flex flex-col gap-1">
                        {entrega.itens.map((i) => (
                          <li key={i.id} className="flex items-center gap-2 text-sm">
                            <span className="w-8 shrink-0 text-right font-semibold tabular-nums">{i.quantidade}×</span>
                            <span className="min-w-0 flex-1">
                              {i.item}
                              {i.ca && <span className="text-stone-500"> · CA {i.ca}</span>}
                              {i.observacao && <span className="block text-xs text-stone-500">{i.observacao}</span>}
                            </span>
                            {podeMexer && (
                              <BotaoAcao
                                acao={excluirEpi.bind(null, e.id, i.id)}
                                variante="fantasma"
                                className="h-8 px-2"
                                confirmar={`Apagar "${i.item}" da entrega de ${formatarData(i.data)}?`}
                              >
                                <Trash2 className="h-4 w-4" />
                                <span className="sr-only">Apagar</span>
                              </BotaoAcao>
                            )}
                          </li>
                        ))}
                      </ul>
                    </li>
                  ))}
                </ul>
              )}
            </Cartao>
          </div>

          {/* Folgas, faltas, atestados e férias */}
          <div className="flex flex-col gap-4">
            {podeMexer && e.ativo && (
              <Cartao>
                <h2 className="mb-3 font-semibold">Lançar folga, falta, atestado ou férias</h2>
                <FormOcorrencia acao={lancarOcorrencia.bind(null, e.id)} hoje={dia} />
              </Cartao>
            )}
            <Cartao className="p-0">
              <h2 className="border-b border-stone-100 px-4 py-3 font-semibold">Folgas, faltas e afastamentos</h2>
              {ocorrencias.length === 0 ? (
                <p className="px-4 py-6 text-center text-sm text-stone-500">Nada lançado.</p>
              ) : (
                <ul className="divide-y divide-stone-100">
                  {ocorrencias.map((o) => {
                    const dias = diasDoPeriodo(o.inicio, o.fim);
                    return (
                      <li key={o.id} className="flex items-center gap-2 px-4 py-2.5 text-sm">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <Etiqueta cor={COR_OCORRENCIA[o.tipo]}>{NOME_OCORRENCIA[o.tipo]}</Etiqueta>
                            <span className="tabular-nums">
                              {dias === 1
                                ? formatarData(o.inicio)
                                : `${formatarData(o.inicio)} a ${formatarData(o.fim)} (${dias} dias)`}
                            </span>
                          </div>
                          {o.observacao && <div className="mt-0.5 text-xs text-stone-500">{o.observacao}</div>}
                        </div>
                        {podeMexer && (
                          <BotaoAcao
                            acao={excluirOcorrencia.bind(null, e.id, o.id)}
                            variante="fantasma"
                            className="h-8 px-2"
                            confirmar={`Apagar ${NOME_OCORRENCIA[o.tipo].toLowerCase()} de ${formatarData(o.inicio)}?`}
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Apagar</span>
                          </BotaoAcao>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </Cartao>
          </div>
        </div>
      </div>
    </>
  );
}

function Dado({ rotulo, valor }: { rotulo: string; valor: string | null }) {
  return (
    <div>
      <dt className="text-xs text-stone-500">{rotulo}</dt>
      <dd className={cn("whitespace-pre-line break-words", valor ? "font-medium" : "text-stone-400")}>
        {valor || "não informado"}
      </dd>
    </div>
  );
}

function Numero({ rotulo, dias, alerta }: { rotulo: string; dias: number; alerta?: boolean }) {
  return (
    <div className="rounded-lg border border-stone-200 bg-white px-4 py-3">
      <div className={cn("text-xl font-semibold tabular-nums", alerta && dias > 0 && "text-red-700")}>
        {dias} <span className="text-sm font-normal text-stone-500">{dias === 1 ? "dia" : "dias"}</span>
      </div>
      <div className="text-sm text-stone-500">{rotulo}</div>
    </div>
  );
}
