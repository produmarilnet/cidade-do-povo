"use client";

import { useEffect, useRef } from "react";
import type { Map as MapaLeaflet } from "leaflet";
import "leaflet/dist/leaflet.css";
import { camadasDoMapa } from "@/lib/camadas-mapa";

/**
 * O poste no satélite, bem de perto: dá para ver a casa da frente e a rua.
 * O dedo mexe no mapa; o ponto fica marcado com um alvo que aparece na foto.
 */
export function MapaDoPonto({ latitude, longitude }: { latitude: number; longitude: number }) {
  const caixa = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let mapa: MapaLeaflet | undefined;
    let saiu = false;
    import("leaflet").then(({ default: L }) => {
      if (saiu || !caixa.current) return;
      mapa = L.map(caixa.current, { preferCanvas: true }).setView([latitude, longitude], 18);
      mapa.attributionControl.setPrefix(false);
      camadasDoMapa(L, mapa);
      // anel largo + ponto: aparece por cima de telhado escuro e de rua clara
      L.circleMarker([latitude, longitude], { radius: 16, color: "#22d3ee", weight: 3, fill: false }).addTo(mapa);
      L.circleMarker([latitude, longitude], {
        radius: 6,
        color: "#fff",
        weight: 2,
        fillColor: "#22d3ee",
        fillOpacity: 1,
      }).addTo(mapa);
    });
    return () => {
      saiu = true;
      mapa?.remove();
    };
  }, [latitude, longitude]);

  // isolate: as camadas do mapa têm z-index alto e passariam por cima do menu do celular
  return <div ref={caixa} className="isolate h-72 w-full rounded-xl border border-stone-200 sm:h-96" />;
}
