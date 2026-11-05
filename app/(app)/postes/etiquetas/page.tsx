import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { exigirUsuario } from "@/lib/auth";
import { sql } from "@/lib/db";
import { pode } from "@/lib/permissoes";
import { ETIQUETAS_POR_FOLHA, ETIQUETAS_POR_LOTE, numeroDoPoste } from "@/lib/postes";
import { Formulario } from "@/components/formulario";
import { Campo, Cartao, Rotulo, Titulo, classeBotao } from "@/components/ui";
import { gerarEtiquetas } from "../actions";

/**
 * Etiquetas: gera um lote com números novos, para colar nos postes e cadastrar
 * lendo o QR na rua, ou reimprime uma faixa de números que já existem.
 */
export default async function EtiquetasPage() {
  const eu = await exigirUsuario("verPostes");
  const [n] = await sql<{ total: number; livres: number; menor: number | null; maior: number | null; ultimo: number | null }[]>`
    select
      count(*)::int as total,
      count(*) filter (where cadastrado_em is null and ativo)::int as livres,
      min(numero) filter (where cadastrado_em is null and ativo) as menor,
      max(numero) filter (where cadastrado_em is null and ativo) as maior,
      max(numero) as ultimo
    from postes`;

  return (
    <>
      <Link href="/postes" className="mb-2 inline-flex items-center gap-1 text-sm text-stone-500 hover:text-stone-800">
        <ChevronLeft className="h-4 w-4" />
        Postes
      </Link>
      <Titulo>Etiquetas</Titulo>

      <div className="flex max-w-xl flex-col gap-4">
        {pode(eu.papel, "gerenciarPostes") && (
          <Cartao>
            <h2 className="mb-1 font-semibold">Gerar etiquetas novas</h2>
            <p className="mb-3 text-sm text-stone-500">
              Cada etiqueta ganha um número novo. Cabem {ETIQUETAS_POR_FOLHA} por folha A4, em quadrados de 6 × 6 cm. Use
              folha de vinil adesivo: papel comum não aguenta sol e chuva.
            </p>
            <Formulario acao={gerarEtiquetas} textoBotao="Gerar e imprimir">
              <Rotulo texto="Quantas etiquetas">
                <Campo
                  name="quantidade"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={ETIQUETAS_POR_LOTE}
                  defaultValue={ETIQUETAS_POR_FOLHA}
                  required
                />
              </Rotulo>
            </Formulario>
          </Cartao>
        )}

        <Cartao>
          <h2 className="mb-1 font-semibold">Imprimir de novo</h2>
          <p className="mb-3 text-sm text-stone-500">
            {n.livres > 0 && n.menor !== null && n.maior !== null
              ? `${n.livres} ${n.livres === 1 ? "etiqueta ainda não tem poste" : "etiquetas ainda não têm poste"}, entre ${numeroDoPoste(n.menor)} e ${numeroDoPoste(n.maior)}.`
              : n.total > 0
                ? "Todas as etiquetas já têm poste."
                : "Nenhuma etiqueta gerada ainda."}
          </p>
          {n.ultimo !== null && (
            <form action="/postes/etiquetas/imprimir" className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-3">
                <Rotulo texto="Do número">
                  <Campo name="de" type="number" inputMode="numeric" min={1} defaultValue={n.menor ?? 1} required />
                </Rotulo>
                <Rotulo texto="Até o número">
                  <Campo name="ate" type="number" inputMode="numeric" min={1} defaultValue={n.maior ?? n.ultimo} required />
                </Rotulo>
              </div>
              <button className={classeBotao("secundario", "self-start")}>Ver as etiquetas</button>
            </form>
          )}
        </Cartao>
      </div>
    </>
  );
}
