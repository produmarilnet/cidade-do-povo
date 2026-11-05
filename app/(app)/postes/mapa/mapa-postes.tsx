"use client";

import { useEffect, useRef } from "react";
import type { Map as MapaLeaflet } from "leaflet";
import "leaflet/dist/leaflet.css";
import { numeroDoPoste } from "@/lib/postes";

export type PosteNoMapa = {
  numero: number;
  latitude: number;
  longitude: number;
  endereco: string;
  abertas: number;
};

/** O Leaflet mexe na janela do navegador: só pode ser carregado depois que a tela abre. */
export function MapaPostes({ postes }: { postes: PosteNoMapa[] }) {
  const caixa = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let mapa: MapaLeaflet | undefined;
    let saiu = false;
    import("leaflet").then(({ default: L }) => {
      if (saiu || !caixa.current) return;
      // canvas: com milhares de pontos, elementos soltos deixariam o celular lento
      mapa = L.map(caixa.current, { preferCanvas: true });
      mapa.attributionControl.setPrefix(false);
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "&copy; OpenStreetMap",
      }).addTo(mapa);

      for (const p of postes) {
        const cor = p.abertas > 0 ? "#dc2626" : "#214DB0";
        // popup montado com textContent: rua é texto digitado, não entra como HTML
        const link = document.createElement("a");
        link.href = `/postes/${p.numero}`;
        link.textContent = `Poste ${numeroDoPoste(p.numero)}`;
        const rua = document.createElement("div");
        rua.textContent = p.endereco;
        const popup = document.createElement("div");
        popup.append(link, rua);
        L.circleMarker([p.latitude, p.longitude], { radius: 7, color: "#fff", weight: 2, fillColor: cor, fillOpacity: 1 })
          .bindPopup(popup)
          .addTo(mapa);
      }
      mapa.fitBounds(
        postes.map((p) => [p.latitude, p.longitude] as [number, number]),
        { padding: [30, 30], maxZoom: 18 },
      );
    });
    return () => {
      saiu = true;
      mapa?.remove();
    };
  }, [postes]);

  // isolate: as camadas do mapa têm z-index alto e passariam por cima do menu do celular
  return <div ref={caixa} className="isolate h-[70vh] min-h-80 w-full rounded-xl border border-stone-200" />;
}
