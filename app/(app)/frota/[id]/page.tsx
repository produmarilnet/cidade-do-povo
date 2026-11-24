import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, ChevronRight, ClipboardCheck, Pencil, Plus, Wrench } from "lucide-react";
import { exigirUsuario } from "@/lib/auth";
import { sql } from "@/lib/db";
import { pode } from "@/lib/permissoes";
import { situacaoDaProxima, textoKm } from "@/lib/frota";
import type { Checklist, Manutencao } from "@/lib/types";
import { cn, formatarData, formatarDinheiro, hoje } from "@/lib/utils";
import { BotaoAcao } from "@/components/formulario";
import { Cartao, Etiqueta, classeBotao } from "@/components/ui";
import { ativarVeiculo } from "../actions";
import { veiculosComResumo } from "../resumo";

export default async function VeiculoPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { aba?: string };
}) {
  const eu = await exigirUsuario("verFrota");
  const [v] = await veiculosComResumo(params.id).catch(() => []);
  if (!v) notFound();
  const aba = searchParams.aba === "checklists" ? "checklists" : "manutencoes";
  const podeMexer = pode(eu.papel, "gerenciarFrota");
  const dia = hoje();
  const ano = dia.slice(0, 4);

  const [manutencoes, checklists] = await Promise.all([
    sql<Manutencao[]>`
      select * from veiculo_manutencoes where veiculo_id = ${v.id}
      order by data desc, criado_em desc`,
    sql<Omit<Checklist, "itens">[]>`
      select id, veiculo_id, data, km, responsavel, problemas, observacao, criado_em
      from veiculo_checklists where veiculo_id = ${v.id}
      order by data desc, criado_em desc`,
  ]);
  const gastoNoAno = manutencoes
    .filter((m) => m.data.startsWith(ano))
    .reduce((s, m) => s + (m.valor ?? 0), 0);
  const proxima = situacaoDaProxima(v, v.km_atual, dia);

  const detalhes = [v.marca, v.ano, v.cor, v.tipo].filter(Boolean).join(" · ");

  return (
    <>
      <Link href="/frota" className="mb-2 inline-flex items-center gap-1 text-sm text-stone-500 hover:text-stone-800">
        <ChevronLeft className="h-4 w-4" />
        Frota
      </Link>
      <div className="mb-1 flex flex-wrap items-center gap-2">
        <h1 className="text-xl font-semibold">{v.modelo}</h1>
        <span className="rounded border border-stone-400 px-2 py-0.5 font-mono text-sm tracking-wide">{v.placa}</span>
        {!v.ativo && <Etiqueta cor="cinza">Fora da frota</Etiqueta>}
      </div>
      {detalhes && <p className="mb-3 text-sm text-stone-500">{detalhes}</p>}

      <div className="mb-4 flex flex-wrap gap-2">
        {v.ativo && pode(eu.papel, "fazerChecklist") && (
          <Link href={`/frota/${v.id}/checklist/novo`} className={classeBotao()}>
            <ClipboardCheck className="h-4 w-4" />
            Fazer checklist
          </Link>
        )}
        {podeMexer && (
          <>
            {v.ativo && (
              <Link href={`/frota/${v.id}/manutencao/nova`} className={classeBotao("secundario")}>
                <Wrench className="h-4 w-4" />
                Lançar manutenção
              </Link>
            )}
            <Link href={`/frota/${v.id}/editar`} className={classeBotao("fantasma")}>
              <Pencil className="h-4 w-4" />
              Alterar cadastro
            </Link>
            <BotaoAcao
              acao={ativarVeiculo.bind(null, v.id, !v.ativo)}
              variante="fantasma"
              confirmar={
                v.ativo
                  ? `Tirar ${v.modelo} (${v.placa}) da frota? As manutenções e os checklists ficam guardados.`
                  : undefined
              }
            >
              {v.ativo ? "Tirar da frota" : "Voltar para a frota"}
            </BotaoAcao>
          </>
        )}
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Numero rotulo="Km atual" valor={v.km_atual > 0 ? textoKm(v.km_atual) : "—"} />
        <Numero
          rotulo={v.proxima_servico ? `Próxima: ${v.proxima_servico}` : "Próxima manutenção"}
          valor={
            proxima === null
              ? "—"
              : [v.proxima_km !== null && textoKm(v.proxima_km), v.proxima_data && formatarData(v.proxima_data)]
                  .filter(Boolean)
                  .join(" ou ")
          }
          destaque={proxima === "vencida" ? "vermelho" : proxima === "perto" ? "amarelo" : undefined}
          nota={proxima === "vencida" ? "vencida" : proxima === "perto" ? "chegando" : undefined}
        />
        <Numero rotulo={`Gasto em manutenção em ${ano}`} valor={formatarDinheiro(gastoNoAno)} />
        <Numero
          rotulo="Último checklist"
          valor={v.ultimo_checklist ? formatarData(v.ultimo_checklist) : "nenhum"}
          destaque={(v.ultimo_checklist_problemas ?? 0) > 0 ? "vermelho" : undefined}
          nota={
            (v.ultimo_checklist_problemas ?? 0) > 0
              ? `${v.ultimo_checklist_problemas} com problema`
              : v.ultimo_checklist
                ? "tudo certo"
                : undefined
          }
        />
      </div>

      <div className="mb-3 flex gap-1 rounded-lg bg-stone-100 p-1">
        <Aba href={`/frota/${v.id}?aba=manutencoes`} ativa={aba === "manutencoes"}>
          Manutenções ({manutencoes.length})
        </Aba>
        <Aba href={`/frota/${v.id}?aba=checklists`} ativa={aba === "checklists"}>
          Checklists ({checklists.length})
        </Aba>
      </div>

      {aba === "manutencoes" ? (
        <Cartao className="p-0">
          {manutencoes.length === 0 ? (
            <Vazio texto="Nenhuma manutenção lançada." />
          ) : (
            <ul className="divide-y divide-stone-100">
              {manutencoes.map((m) => (
                <li key={m.id} className="px-4 py-3 text-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium tabular-nums">{formatarData(m.data)}</span>
                    <Etiqueta cor={m.tipo === "preventiva" ? "verde" : "amarelo"}>
                      {m.tipo === "preventiva" ? "Preventiva" : "Corretiva"}
                    </Etiqueta>
                    {m.km !== null && <span className="text-stone-500">{textoKm(m.km)}</span>}
                    {m.valor !== null && <span className="ml-auto font-medium">{formatarDinheiro(m.valor)}</span>}
                  </div>
                  <p className="mt-1 whitespace-pre-line">{m.servico}</p>
                  <div className="mt-0.5 text-xs text-stone-500">
                    {[
                      m.oficina,
                      (m.proxima_km !== null || m.proxima_data) &&
                        `próxima: ${[m.proxima_km !== null && textoKm(m.proxima_km), m.proxima_data && formatarData(m.proxima_data)].filter(Boolean).join(" ou ")}`,
                      m.observacao,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </div>
                  {podeMexer && (
                    <Link
                      href={`/frota/${v.id}/manutencao/${m.id}`}
                      className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-marca-700 hover:underline"
                    >
                      <Pencil className="h-3 w-3" />
                      Corrigir
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Cartao>
      ) : (
        <Cartao className="p-0">
          {checklists.length === 0 ? (
            <Vazio texto="Nenhum checklist feito." />
          ) : (
            <ul className="divide-y divide-stone-100">
              {checklists.map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/frota/${v.id}/checklist/${c.id}`}
                    className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-stone-50"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium tabular-nums">{formatarData(c.data)}</span>
                        {c.problemas > 0 ? (
                          <Etiqueta cor="vermelho">
                            {c.problemas} {c.problemas === 1 ? "problema" : "problemas"}
                          </Etiqueta>
                        ) : (
                          <Etiqueta cor="verde">Tudo OK</Etiqueta>
                        )}
                      </div>
                      <div className="text-stone-500">
                        {[c.responsavel, c.km !== null && textoKm(c.km)].filter(Boolean).join(" · ")}
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 shrink-0 text-stone-400" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Cartao>
      )}

      {v.observacoes && (
        <p className="mt-4 whitespace-pre-line text-sm text-stone-500">
          <span className="font-medium text-stone-700">Observações: </span>
          {v.observacoes}
        </p>
      )}
      {(v.renavam || v.chassi) && (
        <p className="mt-1 text-xs text-stone-400">
          {[v.renavam && `Renavam ${v.renavam}`, v.chassi && `Chassi ${v.chassi}`].filter(Boolean).join(" · ")}
        </p>
      )}
      {v.ativo && aba === "manutencoes" && podeMexer && manutencoes.length === 0 && (
        <Link href={`/frota/${v.id}/manutencao/nova`} className={classeBotao("secundario", "mt-3")}>
          <Plus className="h-4 w-4" />
          Lançar a primeira manutenção
        </Link>
      )}
    </>
  );
}

function Aba({ href, ativa, children }: { href: string; ativa: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      replace
      scroll={false}
      className={cn(
        "flex-1 rounded-md px-3 py-2 text-center text-sm font-medium",
        ativa ? "bg-white text-stone-900 shadow-sm" : "text-stone-500 hover:text-stone-800",
      )}
    >
      {children}
    </Link>
  );
}

function Vazio({ texto }: { texto: string }) {
  return <p className="px-4 py-8 text-center text-sm text-stone-500">{texto}</p>;
}

function Numero({
  rotulo,
  valor,
  destaque,
  nota,
}: {
  rotulo: string;
  valor: string;
  destaque?: "vermelho" | "amarelo";
  nota?: string;
}) {
  return (
    <div className="rounded-lg border border-stone-200 bg-white px-4 py-3">
      <div
        className={cn(
          "text-lg font-semibold tabular-nums",
          destaque === "vermelho" && "text-red-700",
          destaque === "amarelo" && "text-amber-700",
        )}
      >
        {valor}
        {nota && <span className="ml-1 text-xs font-medium">({nota})</span>}
      </div>
      <div className="text-xs text-stone-500">{rotulo}</div>
    </div>
  );
}
