import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Crosshair, MapPin, Pencil, Plus, Printer, ScanLine } from "lucide-react";
import { exigirUsuario } from "@/lib/auth";
import { sql } from "@/lib/db";
import { COR_SITUACAO, dataDaFicha, NOME_SITUACAO, numeroDaOrdem } from "@/lib/iluminacao";
import { pode } from "@/lib/permissoes";
import { enderecoDoQr, lerNumeroDoPoste, linkDoMapa, numeroDoPoste, textoDaPrecisao } from "@/lib/postes";
import type { OrdemServico, Poste } from "@/lib/types";
import { BotaoAcao } from "@/components/formulario";
import { QrCode } from "@/components/qr-code";
import { Aviso, Cartao, Etiqueta, classeBotao } from "@/components/ui";
import { ativarPoste } from "../actions";

function Dado({ rotulo, valor }: { rotulo: string; valor: string | null }) {
  return (
    <div className="flex gap-3 py-1.5 text-sm">
      <dt className="w-2/5 shrink-0 text-stone-500">{rotulo}</dt>
      <dd className="min-w-0 flex-1 break-words font-medium">{valor || "—"}</dd>
    </div>
  );
}

export default async function PostePage({
  params,
  searchParams,
}: {
  params: { numero: string };
  searchParams: { salvo?: string };
}) {
  const eu = await exigirUsuario("verPostes");
  const numero = lerNumeroDoPoste(params.numero);
  if (numero === null) notFound();
  const [poste] = await sql<Poste[]>`select * from postes where numero = ${numero}`;
  if (!poste) notFound();

  const ordens = await sql<OrdemServico[]>`
    select * from ordens_servico where poste_id = ${poste.id}
    order by criado_em desc
    limit 50`;
  const abertas = ordens.filter((o) => o.situacao === "aberta").length;

  const cadastrado = poste.cadastrado_em !== null;
  const podeCadastrar = pode(eu.papel, "cadastrarPostes");

  return (
    <>
      <Link href="/postes" className="mb-2 inline-flex items-center gap-1 text-sm text-stone-500 hover:text-stone-800">
        <ChevronLeft className="h-4 w-4" />
        Postes
      </Link>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <h1 className="mr-auto text-xl font-semibold">
          Poste {numeroDoPoste(numero)}{" "}
          {!poste.ativo ? (
            <Etiqueta cor="cinza">Desativado</Etiqueta>
          ) : !cadastrado ? (
            <Etiqueta cor="amarelo">Sem cadastro</Etiqueta>
          ) : abertas > 0 ? (
            <Etiqueta cor="vermelho">{abertas === 1 ? "1 ordem aberta" : `${abertas} ordens abertas`}</Etiqueta>
          ) : (
            <Etiqueta cor="verde">Cadastrado</Etiqueta>
          )}
        </h1>
        {cadastrado && podeCadastrar && (
          <Link href={`/postes/${numero}/editar`} className={classeBotao("secundario")}>
            <Pencil className="h-4 w-4" />
            Corrigir cadastro
          </Link>
        )}
      </div>

      {searchParams.salvo && (
        <div className="mb-4 flex flex-col gap-2">
          <Aviso tipo="ok">Poste salvo.</Aviso>
          {podeCadastrar && (
            <div className="flex flex-wrap gap-2">
              <Link href="/postes/ler" className={classeBotao()}>
                <ScanLine className="h-4 w-4" />
                Ler o próximo QR
              </Link>
              <Link href="/postes/novo" className={classeBotao("secundario")}>
                <Plus className="h-4 w-4" />
                Poste sem etiqueta
              </Link>
            </div>
          )}
        </div>
      )}

      <div className="flex flex-col gap-4">
        {!cadastrado && (
          <Cartao className="max-w-xl">
            <p className="mb-3 text-sm text-stone-600">
              Esta etiqueta ainda não tem poste. Marque a localização com o celular ao lado do poste em que ela foi colada.
            </p>
            {podeCadastrar && (
              <Link href={`/postes/${numero}/editar`} className={classeBotao("primario", "h-12 w-full text-base")}>
                <Crosshair className="h-5 w-5" />
                Cadastrar este poste
              </Link>
            )}
          </Cartao>
        )}

        <div className="grid gap-4 md:grid-cols-[1fr_auto]">
          {cadastrado && (
            <Cartao>
              <dl className="divide-y divide-stone-100">
                <Dado rotulo="Rua" valor={poste.endereco} />
                <Dado rotulo="Bairro" valor={poste.bairro} />
                <Dado rotulo="Localidade" valor={poste.localidade} />
                <Dado rotulo="Ponto de referência" valor={poste.ponto_referencia} />
                <Dado
                  rotulo="GPS"
                  valor={`${poste.latitude?.toFixed(6)}, ${poste.longitude?.toFixed(6)}${
                    poste.precisao != null ? ` (${textoDaPrecisao(poste.precisao)})` : ""
                  }`}
                />
              </dl>
              {poste.latitude != null && poste.longitude != null && (
                <a
                  href={linkDoMapa(poste.latitude, poste.longitude)}
                  target="_blank"
                  rel="noreferrer"
                  className={classeBotao("secundario", "mt-3")}
                >
                  <MapPin className="h-4 w-4" />
                  Ver no mapa
                </a>
              )}
            </Cartao>
          )}

          <Cartao className="flex w-52 flex-col items-center gap-2 justify-self-start md:col-start-2">
            <QrCode texto={enderecoDoQr(numero)} className="h-40 w-40" />
            <Link href={`/postes/etiquetas/imprimir?de=${numero}&ate=${numero}`} className={classeBotao("secundario", "w-full")}>
              <Printer className="h-4 w-4" />
              Imprimir etiqueta
            </Link>
          </Cartao>
        </div>

        <Cartao className="p-0">
          <div className="flex flex-wrap items-center gap-2 border-b border-stone-100 px-4 py-3">
            <h2 className="mr-auto font-semibold">Ordens de serviço deste poste</h2>
            {cadastrado && poste.ativo && pode(eu.papel, "abrirOrdens") && (
              <Link href={`/iluminacao/nova?poste=${numero}`} className={classeBotao()}>
                <Plus className="h-4 w-4" />
                Abrir ordem
              </Link>
            )}
          </div>
          {ordens.length === 0 ? (
            <p className="px-4 py-3 text-sm text-stone-500">Nenhuma ordem ligada a este poste.</p>
          ) : (
            <ul className="divide-y divide-stone-100">
              {ordens.map((o) => (
                <li key={o.id}>
                  <Link href={`/iluminacao/${o.id}`} className="flex gap-3 px-4 py-3 hover:bg-stone-50">
                    <div className="w-16 shrink-0 pt-0.5 text-xs tabular-nums text-stone-500">
                      nº {numeroDaOrdem(o.numero)}
                      <div>{dataDaFicha(o.criado_em)}</div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <Etiqueta cor={COR_SITUACAO[o.situacao]}>{NOME_SITUACAO[o.situacao]}</Etiqueta>
                      <div className="truncate text-sm text-stone-600">{o.servico}</div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Cartao>

        {pode(eu.papel, "gerenciarPostes") && (
          <div>
            <BotaoAcao
              acao={ativarPoste.bind(null, numero, !poste.ativo)}
              variante="fantasma"
              className={poste.ativo ? "text-red-700" : undefined}
              confirmar={
                poste.ativo ? `Desativar o poste ${numeroDoPoste(numero)}? Ele sai do mapa e da lista de cadastrados.` : undefined
              }
            >
              {poste.ativo ? "Desativar poste" : "Ativar poste"}
            </BotaoAcao>
          </div>
        )}
      </div>
    </>
  );
}
