"use client";

import { useEffect, useRef, useState } from "react";
import type { CircleMarker, Map as MapaLeaflet } from "leaflet";
import "leaflet/dist/leaflet.css";
import { camadasDoMapa } from "@/lib/camadas-mapa";
import { LocateFixed } from "lucide-react";
import { Botao } from "@/components/ui";

/** [id, latitude, longitude, 1 = sem lâmpada ou quebrada] — curto, são milhares. */
export type PontoNoMapa = readonly [number, number, number, number];

/** O Leaflet mexe na janela do navegador: só pode ser carregado depois que a tela abre. */
export function MapaLevantamento({ pontos, ver }: { pontos: readonly PontoNoMapa[]; ver: number | null }) {
  const caixa = useRef<HTMLDivElement>(null);
  const mapaRef = useRef<MapaLeaflet | null>(null);
  const euRef = useRef<CircleMarker | null>(null);
  const [lendo, setLendo] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    let mapa: MapaLeaflet | undefined;
    let saiu = false;
    import("leaflet").then(({ default: L }) => {
      if (saiu || !caixa.current) return;
      // canvas: com milhares de pontos, elementos soltos deixariam o celular lento
      mapa = L.map(caixa.current, { preferCanvas: true });
      mapaRef.current = mapa;
      mapa.attributionControl.setPrefix(false);
      // satélite (casas e ruas vistas de cima) com o nome das ruas; dá para trocar pelo mapa desenhado
      camadasDoMapa(L, mapa);

      const ficha = (id: number) => {
        const link = document.createElement("a");
        link.href = `/postes/levantamento/${id}`;
        link.textContent = "Ver a ficha (satélite nítido)";
        return link;
      };

      let escolhido: [number, number] | null = null;
      for (const [id, lat, lng, apagada] of pontos) {
        const destaque = id === ver;
        const marca = L.circleMarker([lat, lng], {
          radius: destaque ? 11 : 6,
          color: "#fff",
          weight: destaque ? 3 : 1.5,
          fillColor: destaque ? "#22d3ee" : apagada ? "#dc2626" : "#facc15",
          fillOpacity: 1,
        })
          .bindPopup(() => ficha(id))
          .addTo(mapa);
        if (destaque) {
          escolhido = [lat, lng];
          marca.bringToFront();
        }
      }

      if (escolhido) mapa.setView(escolhido, 18);
      else
        mapa.fitBounds(
          pontos.map(([, lat, lng]) => [lat, lng] as [number, number]),
          { padding: [20, 20] },
        );
    });
    return () => {
      saiu = true;
      mapa?.remove();
      mapaRef.current = null;
      euRef.current = null;
    };
  }, [pontos, ver]);

  /** Bolinha verde onde o celular está, e o mapa vai para lá. */
  function ondeEstou() {
    if (!navigator.geolocation) {
      setErro("Este celular não deixa o site usar o GPS.");
      return;
    }
    setErro(null);
    setLendo(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        setLendo(false);
        const mapa = mapaRef.current;
        if (!mapa) return;
        const { default: L } = await import("leaflet");
        const aqui: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        euRef.current?.remove();
        euRef.current = L.circleMarker(aqui, {
          radius: 9,
          color: "#fff",
          weight: 3,
          fillColor: "#16a34a",
          fillOpacity: 1,
        })
          .bindPopup("Você está aqui")
          .addTo(mapa);
        mapa.setView(aqui, 18);
      },
      (e) => {
        setLendo(false);
        setErro(
          e.code === e.PERMISSION_DENIED
            ? "O GPS foi negado. No iPhone: Ajustes → Privacidade → Serviços de Localização → Safari → Durante o Uso."
            : "Não deu para pegar o GPS agora. Tente de novo em lugar aberto.",
        );
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 10000 },
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <Botao type="button" onClick={ondeEstou} disabled={lendo} className="h-11 text-base">
        <LocateFixed className="h-5 w-5" />
        {lendo ? "Pegando o GPS..." : "Onde estou"}
      </Botao>
      {erro && <p className="text-sm text-red-600">{erro}</p>}
      {/* isolate: as camadas do mapa têm z-index alto e passariam por cima do menu do celular */}
      <div ref={caixa} className="isolate h-[70vh] min-h-80 w-full rounded-xl border border-stone-200" />
    </div>
  );
}
