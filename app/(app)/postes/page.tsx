import Link from "next/link";
import { Map as IconeMapa, Plus, Printer, ScanLine, Search } from "lucide-react";
import { exigirUsuario } from "@/lib/auth";
import { sql } from "@/lib/db";
import { pode } from "@/lib/permissoes";
import { numeroDoPoste } from "@/lib/postes";
import type { Poste } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Cartao, Etiqueta, Titulo, classeBotao } from "@/components/ui";

const FILTROS = [
  { valor: "cadastrados", texto: "Cadastrados" },
  { valor: "abertas", texto: "Com ordem aberta" },
  { valor: "sem-cadastro", texto: "Etiquetas sem cadastro" },
  { valor: "desativados", texto: "Desativados" },
] as const;
type Filtro = (typeof FILTROS)[number]["valor"];

export default async function PostesPage({ searchParams }: { searchParams: { ver?: string; busca?: string } }) {
  const eu = await exigirUsuario("verPostes");
  const busca = (searchParams.busca ?? "").trim();
  const padrao = `%${busca}%`;
  const ver: Filtro = FILTROS.find((f) => f.valor === searchParams.ver)?.valor ?? "cadastrados";

  // Quem busca quer achar o poste onde ele estiver: a busca ignora o filtro.
  const postes = await sql<(Poste & { abertas: number })[]>`
    select * from (
      select p.*,
        (select count(*)::int from ordens_servico o where o.poste_id = p.id and o.situacao = 'aberta') as abertas
      from postes p
    ) p
    where
      ${
        busca
          ? sql`(endereco ilike ${padrao} or bairro ilike ${padrao} or localidade ilike ${padrao}
                 or ponto_referencia ilike ${padrao} or numero::text = ${busca.replace(/^0+/, "")})`
          : ver === "sem-cadastro"
            ? sql`ativo and cadastrado_em is null`
            : ver === "desativados"
              ? sql`not ativo`
              : ver === "abertas"
                ? sql`ativo and abertas > 0`
                : sql`ativo and cadastrado_em is not null`
      }
    order by numero desc
    limit 200`;

  const [n] = await sql<Record<Filtro, number>[]>`
    select
      count(*) filter (where ativo and cadastrado_em is not null)::int as "cadastrados",
      count(*) filter (where ativo and cadastrado_em is null)::int as "sem-cadastro",
      count(*) filter (where not ativo)::int as "desativados",
      count(*) filter (where ativo and exists (
        select 1 from ordens_servico o where o.poste_id = postes.id and o.situacao = 'aberta'
      ))::int as "abertas"
    from postes`;

  return (
    <>
      <Titulo
        acao={
          <div className="flex flex-wrap gap-2">
            <Link href="/postes/ler" className={classeBotao()}>
              <ScanLine className="h-4 w-4" />
              Ler QR
            </Link>
            {pode(eu.papel, "cadastrarPostes") && (
              <Link href="/postes/novo" className={classeBotao("secundario")}>
                <Plus className="h-4 w-4" />
                Novo poste
              </Link>
            )}
            <Link href="/postes/mapa" className={classeBotao("secundario")}>
              <IconeMapa className="h-4 w-4" />
              Mapa
            </Link>
            <Link href="/postes/etiquetas" className={classeBotao("secundario")}>
              <Printer className="h-4 w-4" />
              Etiquetas
            </Link>
          </div>
        }
      >
        Postes
      </Titulo>

      <div className="mb-3 flex flex-wrap gap-1">
        {FILTROS.map((f) => (
          <Link
            key={f.valor}
            href={`/postes?ver=${f.valor}`}
            className={cn(
              "rounded-full px-3 py-1.5 text-sm",
              !busca && ver === f.valor
                ? "bg-marca-600 font-medium text-white"
                : "bg-white text-stone-700 ring-1 ring-stone-200 hover:bg-stone-50",
            )}
          >
            {f.texto} <span className="opacity-70">{n[f.valor]}</span>
          </Link>
        ))}
      </div>

      <form className="mb-4 flex gap-2">
        <input type="hidden" name="ver" value={ver} />
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
          <input
            name="busca"
            defaultValue={busca}
            placeholder="Buscar por nº, rua, bairro ou localidade"
            className="h-10 w-full rounded-lg border border-stone-300 bg-white pl-9 pr-3 text-base text-stone-900 focus:border-marca-500 focus:outline-none focus:ring-2 focus:ring-marca-200 sm:text-sm"
          />
        </div>
        <button className={classeBotao("secundario")}>Buscar</button>
      </form>

      {postes.length === 0 ? (
        <Cartao className="text-center text-sm text-stone-500">
          {busca ? "Nenhum poste encontrado com essa busca." : "Nenhum poste aqui."}
        </Cartao>
      ) : (
        <Cartao className="p-0">
          <ul className="divide-y divide-stone-100">
            {postes.map((p) => (
              <li key={p.id}>
                <Link href={`/postes/${p.numero}`} className="flex items-center gap-3 px-4 py-3 hover:bg-stone-50">
                  <div className="w-16 shrink-0 text-sm font-medium tabular-nums">{numeroDoPoste(p.numero)}</div>
                  <div className="min-w-0 flex-1">
                    {p.cadastrado_em ? (
                      <div className="truncate text-sm text-stone-600">
                        {p.endereco}
                        {p.bairro && ` · ${p.bairro}`}
                        <span className="text-stone-400"> · {p.localidade}</span>
                      </div>
                    ) : (
                      <div className="text-sm text-stone-400">Etiqueta ainda sem poste</div>
                    )}
                  </div>
                  {!p.ativo && <Etiqueta cor="cinza">Desativado</Etiqueta>}
                  {p.ativo && p.abertas > 0 && (
                    <Etiqueta cor="vermelho">{p.abertas === 1 ? "1 ordem aberta" : `${p.abertas} ordens abertas`}</Etiqueta>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </Cartao>
      )}
    </>
  );
}
