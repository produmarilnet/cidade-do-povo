import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { exigirUsuario } from "@/lib/auth";
import { sql } from "@/lib/db";
import { Titulo } from "@/components/ui";
import { MapaLevantamento } from "./mapa-levantamento";

/** Todos os pontos do levantamento no mapa. `?ver=<id>` abre já em cima de um. */
export default async function MapaDoLevantamentoPage({ searchParams }: { searchParams: { ver?: string } }) {
  await exigirUsuario("verPostes");
  // só o necessário para o ponto: são milhares, e o celular baixa tudo de uma vez
  const linhas = await sql<{ id: number; latitude: number; longitude: number; apagada: boolean }[]>`
    select id, latitude, longitude,
      coalesce(tipo_lampada in ('Sem Lâmpada', 'Lâmpada Quebrada'), false) as apagada
    from levantamento_ip`;
  const pontos = linhas.map((l) => [l.id, Number(l.latitude.toFixed(6)), Number(l.longitude.toFixed(6)), l.apagada ? 1 : 0] as const);
  const ver = Number(searchParams.ver);

  return (
    <>
      <Link href="/postes/levantamento" className="mb-2 inline-flex items-center gap-1 text-sm text-stone-500 hover:text-stone-800">
        <ChevronLeft className="h-4 w-4" />
        Levantamento
      </Link>
      <Titulo>Mapa do levantamento</Titulo>
      <p className="-mt-2 mb-3 text-sm text-stone-500">
        {pontos.length.toLocaleString("pt-BR")} pontos, em amarelo; em vermelho, os que estavam sem lâmpada ou com ela quebrada.
        O mapa abre no satélite (as casas e as ruas vistas de cima) — o botão de camadas, no canto, troca para o mapa de ruas.
        Toque num ponto para abrir a ficha, que mostra o poste no satélite do Google, bem nítido; "Onde estou" mostra você no mapa.
      </p>
      <MapaLevantamento pontos={pontos} ver={Number.isInteger(ver) ? ver : null} />
    </>
  );
}
