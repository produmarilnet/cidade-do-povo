import Link from "next/link";
import { ChevronLeft, ChevronRight, Map as IconeMapa, Search } from "lucide-react";
import { exigirUsuario } from "@/lib/auth";
import { sql } from "@/lib/db";
import {
  codigoDoPonto,
  lampadaDoPonto,
  textoDaDistancia,
  textoDeBusca,
  type PontoLevantamento,
} from "@/lib/levantamento";
import { Cartao, Titulo, classeBotao } from "@/components/ui";
import { PertoDeMim } from "./perto-de-mim";

type PontoDaLista = Pick<
  PontoLevantamento,
  "id" | "formulario" | "ponto" | "logradouro" | "bairro" | "tipo_lampada" | "potencia" | "lampadas" | "tipo_poste" | "chave"
> & { distancia: number | null };

// acento fora nos dois lados: "sao pedro" acha "Rua São Pedro"
const SEM_ACENTO_DE = "áàâãäéèêëíìîïóòôõöúùûüç";
const SEM_ACENTO_PARA = "aaaaaeeeeiiiiooooouuuuc";

/** Lê a coordenada da URL; fora do mapa do mundo vira null. */
function coordenada(texto: string | undefined, limite: number): number | null {
  if (!texto) return null;
  const n = Number(texto);
  return Number.isFinite(n) && Math.abs(n) <= limite ? n : null;
}

/**
 * LEVANTAMENTO: os pontos de iluminação do arquivo do GlobalCAD. Acha o poste
 * pela rua, bairro, chave ou nº do formulário — ou pelos mais perto de quem
 * está com o celular na mão — e leva até ele pelo mapa do celular.
 */
export default async function LevantamentoPage({
  searchParams,
}: {
  searchParams: { busca?: string; lat?: string; lng?: string };
}) {
  await exigirUsuario("verPostes");
  const busca = (searchParams.busca ?? "").trim();
  const lat = coordenada(searchParams.lat, 90);
  const lng = coordenada(searchParams.lng, 180);
  const perto = lat !== null && lng !== null;

  // "4349573-3" é o formulário e o ponto; só números, o formulário
  const codigo = busca.match(/^(\d+)\s*[-/]\s*(\d+)$/);
  const padrao = `%${textoDeBusca(busca)}%`;
  const filtro = !busca
    ? sql`true`
    : codigo
      ? sql`formulario = ${Number(codigo[1])} and ponto = ${Number(codigo[2])}`
      : sql`translate(lower(concat_ws(' ', logradouro, bairro, chave, tipo_lampada, tipo_poste, tipo_luminaria, formulario::text, medidor)),
              ${SEM_ACENTO_DE}, ${SEM_ACENTO_PARA}) like ${padrao}`;

  // distância em metros, conta plana: na escala de uma cidade o erro é de centímetros
  const distancia = perto
    ? sql`sqrt(power((latitude - ${lat}) * 111320, 2) + power((longitude - ${lng}) * 111320 * cos(radians(${lat})), 2))`
    : sql`null::float8`;

  const pontos =
    busca || perto
      ? await sql<PontoDaLista[]>`
          select id, formulario, ponto, logradouro, bairro, tipo_lampada, potencia, lampadas, tipo_poste, chave,
            ${distancia} as distancia
          from levantamento_ip
          where ${filtro}
          order by ${perto ? sql`distancia` : sql`logradouro nulls last, formulario, ponto`}
          limit ${perto && !busca ? 30 : 150}`
      : [];

  const [{ total }] = await sql<{ total: number }[]>`select count(*)::int as total from levantamento_ip`;
  const ondeEstou = perto ? `&lat=${lat}&lng=${lng}` : "";

  return (
    <>
      <Link href="/postes" className="mb-2 inline-flex items-center gap-1 text-sm text-stone-500 hover:text-stone-800">
        <ChevronLeft className="h-4 w-4" />
        Postes
      </Link>
      <Titulo
        acao={
          <Link href="/postes/levantamento/mapa" className={classeBotao("secundario")}>
            <IconeMapa className="h-4 w-4" />
            Ver no mapa
          </Link>
        }
      >
        Levantamento da iluminação
      </Titulo>
      <p className="-mt-2 mb-3 text-sm text-stone-500">
        {total.toLocaleString("pt-BR")} pontos do cadastro do GlobalCAD. Busque pela rua, bairro, chave ou nº do
        formulário, ou veja os mais perto de você.
      </p>

      <form className="mb-3 flex gap-2">
        {perto && (
          <>
            <input type="hidden" name="lat" value={lat} />
            <input type="hidden" name="lng" value={lng} />
          </>
        )}
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
          <input
            name="busca"
            defaultValue={busca}
            placeholder="Rua, bairro, chave ou nº do formulário"
            className="h-11 w-full rounded-lg border border-stone-300 bg-white pl-9 pr-3 text-base text-stone-900 focus:border-marca-500 focus:outline-none focus:ring-2 focus:ring-marca-200 sm:text-sm"
          />
        </div>
        <button className={classeBotao("secundario", "h-11")}>Buscar</button>
      </form>

      <PertoDeMim busca={busca} ativo={perto} />

      {busca || perto ? (
        pontos.length === 0 ? (
          <Cartao className="text-center text-sm text-stone-500">Nenhum ponto encontrado com essa busca.</Cartao>
        ) : (
          <>
            <p className="mb-2 text-xs text-stone-500">
              {perto
                ? `${pontos.length} ${pontos.length === 1 ? "ponto" : "pontos"}, do mais perto para o mais longe`
                : `${pontos.length}${pontos.length === 150 ? " primeiros" : ""} ${pontos.length === 1 ? "ponto" : "pontos"}`}
            </p>
            <Cartao className="p-0">
              <ul className="divide-y divide-stone-100">
                {pontos.map((p) => (
                  <li key={p.id}>
                    <Link
                      href={`/postes/levantamento/${p.id}${ondeEstou ? `?${ondeEstou.slice(1)}` : ""}`}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-stone-50"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium text-stone-900">
                          {p.logradouro || "Rua não informada"}
                          {p.bairro && <span className="font-normal text-stone-500"> · {p.bairro}</span>}
                        </div>
                        <div className="truncate text-xs text-stone-500">
                          {lampadaDoPonto(p)}
                          {p.tipo_poste && ` · poste ${p.tipo_poste}`}
                          {p.chave && ` · chave ${p.chave}`}
                          <span className="text-stone-400"> · {codigoDoPonto(p)}</span>
                        </div>
                      </div>
                      {p.distancia != null && (
                        <span className="shrink-0 text-sm font-semibold tabular-nums text-marca-700">
                          {textoDaDistancia(p.distancia)}
                        </span>
                      )}
                      <ChevronRight className="h-4 w-4 shrink-0 text-stone-300" />
                    </Link>
                  </li>
                ))}
              </ul>
            </Cartao>
          </>
        )
      ) : null}
    </>
  );
}
