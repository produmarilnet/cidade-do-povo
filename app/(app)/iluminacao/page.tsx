import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { exigirUsuario } from "@/lib/auth";
import { sql } from "@/lib/db";
import { pode } from "@/lib/permissoes";
import { COR_SITUACAO, dataDaFicha, NOME_SITUACAO, numeroDaOrdem } from "@/lib/iluminacao";
import { SITUACOES_ORDEM, type OrdemServico, type SituacaoOrdem } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Cartao, Etiqueta, Titulo, classeBotao } from "@/components/ui";

const FILTROS: { valor: SituacaoOrdem | "todas"; texto: string }[] = [
  { valor: "aberta", texto: "Abertas" },
  { valor: "executada", texto: "Executadas" },
  { valor: "cancelada", texto: "Canceladas" },
  { valor: "todas", texto: "Todas" },
];

export default async function OrdensPage({ searchParams }: { searchParams: { situacao?: string; busca?: string } }) {
  const eu = await exigirUsuario("verIluminacao");
  const situacao = (SITUACOES_ORDEM as readonly string[]).includes(searchParams.situacao ?? "")
    ? (searchParams.situacao as SituacaoOrdem)
    : searchParams.situacao === "todas"
      ? "todas"
      : "aberta";
  const busca = (searchParams.busca ?? "").trim();
  const padrao = `%${busca}%`;

  const ordens = await sql<OrdemServico[]>`
    select * from ordens_servico
    where (${situacao} = 'todas' or situacao = ${situacao})
      and (${busca} = '' or nome ilike ${padrao} or apelido ilike ${padrao} or endereco ilike ${padrao}
           or ponto_referencia ilike ${padrao} or telefone ilike ${padrao} or localidade ilike ${padrao}
           or numero::text = ${busca.replace(/^0+/, "")})
    order by criado_em desc
    limit 200`;

  const contagem = await sql<{ situacao: SituacaoOrdem; n: number }[]>`
    select situacao, count(*)::int as n from ordens_servico group by situacao`;
  const quantas = (s: SituacaoOrdem | "todas") =>
    s === "todas" ? contagem.reduce((t, l) => t + l.n, 0) : (contagem.find((l) => l.situacao === s)?.n ?? 0);

  const link = (s: string) => `/iluminacao?situacao=${s}${busca ? `&busca=${encodeURIComponent(busca)}` : ""}`;

  return (
    <>
      <Titulo
        acao={
          pode(eu.papel, "abrirOrdens") && (
            <Link href="/iluminacao/nova" className={classeBotao()}>
              <Plus className="h-4 w-4" />
              Nova ordem
            </Link>
          )
        }
      >
        Iluminação pública
      </Titulo>

      <div className="mb-3 flex flex-wrap gap-1">
        {FILTROS.map((f) => (
          <Link
            key={f.valor}
            href={link(f.valor)}
            className={cn(
              "rounded-full px-3 py-1.5 text-sm",
              situacao === f.valor ? "bg-marca-600 font-medium text-white" : "bg-white text-stone-700 ring-1 ring-stone-200 hover:bg-stone-50",
            )}
          >
            {f.texto} <span className="opacity-70">{quantas(f.valor)}</span>
          </Link>
        ))}
      </div>

      <form className="mb-4 flex gap-2">
        <input type="hidden" name="situacao" value={situacao} />
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
          <input
            name="busca"
            defaultValue={busca}
            placeholder="Buscar por nome, apelido, endereço, telefone ou nº"
            className="h-10 w-full rounded-lg border border-stone-300 bg-white pl-9 pr-3 text-base text-stone-900 focus:border-marca-500 focus:outline-none focus:ring-2 focus:ring-marca-200 sm:text-sm"
          />
        </div>
        <button className={classeBotao("secundario")}>Buscar</button>
      </form>

      {ordens.length === 0 ? (
        <Cartao className="text-center text-sm text-stone-500">
          {busca ? "Nenhuma ordem encontrada com essa busca." : "Nenhuma ordem aqui."}
        </Cartao>
      ) : (
        <Cartao className="p-0">
          <ul className="divide-y divide-stone-100">
            {ordens.map((o) => (
              <li key={o.id}>
                <Link href={`/iluminacao/${o.id}`} className="flex gap-3 px-4 py-3 hover:bg-stone-50">
                  <div className="w-16 shrink-0 pt-0.5 text-xs tabular-nums text-stone-500">
                    nº {numeroDaOrdem(o.numero)}
                    <div>{dataDaFicha(o.criado_em)}</div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">
                        {o.nome}
                        {o.apelido && <span className="font-normal text-stone-500"> ({o.apelido})</span>}
                      </span>
                      <Etiqueta cor={COR_SITUACAO[o.situacao]}>{NOME_SITUACAO[o.situacao]}</Etiqueta>
                    </div>
                    <div className="truncate text-sm text-stone-600">
                      {o.endereco}
                      {o.numero_casa && `, ${o.numero_casa}`}
                      {o.localidade && <span className="text-stone-400"> · {o.localidade}</span>}
                    </div>
                    <div className="truncate text-sm text-stone-500">{o.servico}</div>
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
