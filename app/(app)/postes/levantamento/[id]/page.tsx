import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Map as IconeMapa, Navigation, Plus } from "lucide-react";
import { exigirUsuario } from "@/lib/auth";
import { sql } from "@/lib/db";
import {
  caminhoNoAppleMapas,
  caminhoNoGoogleMaps,
  codigoDoPonto,
  fotoDoPonto,
  lampadaDoPonto,
  textoDaDistancia,
  type PontoLevantamento,
} from "@/lib/levantamento";
import { pode } from "@/lib/permissoes";
import { Cartao, classeBotao } from "@/components/ui";
import { SateliteGoogle } from "@/components/satelite-google";

function Dado({ rotulo, valor }: { rotulo: string; valor: string | null | undefined }) {
  return (
    <div className="flex gap-3 py-1.5 text-sm">
      <dt className="w-2/5 shrink-0 text-stone-500">{rotulo}</dt>
      <dd className="min-w-0 flex-1 break-words font-medium">{valor || "—"}</dd>
    </div>
  );
}

const simNao = (v: boolean | null) => (v === null ? null : v ? "Sim" : "Não");

/** A ficha de um ponto do levantamento: o que tem nele, as fotos e o caminho até lá. */
export default async function PontoDoLevantamentoPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { lat?: string; lng?: string };
}) {
  const eu = await exigirUsuario("verPostes");
  const id = Number(params.id);
  if (!Number.isInteger(id) || id <= 0) notFound();
  const [p] = await sql<PontoLevantamento[]>`select * from levantamento_ip where id = ${id}`;
  if (!p) notFound();

  // veio do "perto de mim": mostra a distância de onde a pessoa estava
  const lat = Number(searchParams.lat);
  const lng = Number(searchParams.lng);
  const distancia =
    searchParams.lat && searchParams.lng && Number.isFinite(lat) && Number.isFinite(lng)
      ? Math.hypot((p.latitude - lat) * 111320, (p.longitude - lng) * 111320 * Math.cos((lat * Math.PI) / 180))
      : null;
  const voltar = distancia !== null ? `/postes/levantamento?lat=${lat}&lng=${lng}` : "/postes/levantamento";

  return (
    <>
      <Link href={voltar} className="mb-2 inline-flex items-center gap-1 text-sm text-stone-500 hover:text-stone-800">
        <ChevronLeft className="h-4 w-4" />
        Levantamento
      </Link>
      <h1 className="text-xl font-semibold text-stone-900">{p.logradouro || "Rua não informada"}</h1>
      <p className="mb-4 text-sm text-stone-500">
        {lampadaDoPonto(p)} · ponto {codigoDoPonto(p)}
        {distancia !== null && (
          <span className="font-semibold text-marca-700"> · a {textoDaDistancia(distancia)} de você</span>
        )}
      </p>

      <div className="flex flex-col gap-4">
        {/* onde fica: satélite do Google bem de perto, com as casas, a rua e o alfinete no poste */}
        <SateliteGoogle latitude={p.latitude} longitude={p.longitude} />

        {/* ir até o poste: abre o aplicativo de mapas do celular */}
        <Cartao className="flex flex-col gap-2">
          <a
            href={caminhoNoGoogleMaps(p.latitude, p.longitude)}
            target="_blank"
            rel="noreferrer"
            className={classeBotao("primario", "h-12 text-base")}
          >
            <Navigation className="h-5 w-5" />
            Ir até o poste (Google Maps)
          </a>
          <div className="grid grid-cols-2 gap-2">
            <a
              href={caminhoNoAppleMapas(p.latitude, p.longitude)}
              target="_blank"
              rel="noreferrer"
              className={classeBotao("secundario")}
            >
              <Navigation className="h-4 w-4" />
              Mapas do iPhone
            </a>
            <Link href={`/postes/levantamento/mapa?ver=${p.id}`} className={classeBotao("secundario")}>
              <IconeMapa className="h-4 w-4" />
              No mapa daqui
            </Link>
          </div>
          {pode(eu.papel, "abrirOrdens") && (
            <Link href={`/iluminacao/nova?levantamento=${p.id}`} className={classeBotao("secundario")}>
              <Plus className="h-4 w-4" />
              Abrir ordem neste poste
            </Link>
          )}
        </Cartao>

        <Cartao>
          <dl className="divide-y divide-stone-100">
            <Dado rotulo="Rua" valor={p.logradouro} />
            <Dado rotulo="Bairro" valor={p.bairro} />
            <Dado rotulo="Lâmpada" valor={lampadaDoPonto(p)} />
            <Dado rotulo="Luminária" valor={p.tipo_luminaria} />
            <Dado rotulo="Tipo do poste" valor={p.tipo_poste} />
            <Dado rotulo="Chave" valor={p.chave} />
            <Dado rotulo="Acesa 24 horas?" valor={simNao(p.acesa_24h)} />
            <Dado rotulo="Medido?" valor={simNao(p.medido)} />
            {p.medidor && <Dado rotulo="Nº do medidor" valor={p.medidor} />}
            {p.plaqueta && <Dado rotulo="Plaqueta" valor={p.plaqueta} />}
            <Dado rotulo="Formulário / ponto" valor={codigoDoPonto(p)} />
            <Dado rotulo="GPS" valor={`${p.latitude.toFixed(6)}, ${p.longitude.toFixed(6)}`} />
          </dl>
        </Cartao>

        {p.fotos.length > 0 && (
          <Cartao>
            <h2 className="mb-2 font-semibold">Fotos do levantamento</h2>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {p.fotos.map((f) => (
                <a key={f} href={fotoDoPonto(f, true)} target="_blank" rel="noreferrer" className="block">
                  {/* eslint-disable-next-line @next/next/no-img-element -- a foto vem do GlobalCAD */}
                  <img
                    src={fotoDoPonto(f)}
                    alt="Foto do poste no levantamento"
                    loading="lazy"
                    className="aspect-[3/4] w-full rounded-lg border border-stone-200 bg-stone-100 object-cover"
                  />
                </a>
              ))}
            </div>
            <p className="mt-2 text-xs text-stone-400">Toque na foto para abrir grande.</p>
          </Cartao>
        )}
      </div>
    </>
  );
}
