import type { Map as MapaLeaflet } from "leaflet";

type Leaflet = typeof import("leaflet");

/**
 * O fundo dos mapas: SATÉLITE (as casas e as ruas vistas de cima, da Esri), com
 * o nome das ruas por cima, e a opção de voltar ao mapa desenhado (OpenStreetMap).
 * Pedido do dono (25/11/2026): ver o poste "onde vejo as casas e a rua".
 * As duas fontes são gratuitas e não pedem chave.
 */
export function camadasDoMapa(L: Leaflet, mapa: MapaLeaflet, inicio: "satelite" | "ruas" = "satelite") {
  const esri = "https://server.arcgisonline.com/ArcGIS/rest/services";
  // em São Mateus a foto de satélite vai até o zoom 17 (no 18 a Esri manda "Map data not yet
  // available"); acima disso o Leaflet amplia a foto do 17
  const foto = L.tileLayer(`${esri}/World_Imagery/MapServer/tile/{z}/{y}/{x}`, {
    maxNativeZoom: 17,
    maxZoom: 20,
    attribution: "Imagem &copy; Esri",
  });
  const nomes = L.tileLayer(`${esri}/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}`, {
    maxNativeZoom: 17,
    maxZoom: 20,
  });
  const lugares = L.tileLayer(`${esri}/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}`, {
    maxNativeZoom: 17,
    maxZoom: 20,
  });
  const satelite = L.layerGroup([foto, nomes, lugares]);
  const ruas = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxNativeZoom: 19,
    maxZoom: 20,
    attribution: "&copy; OpenStreetMap",
  });

  (inicio === "satelite" ? satelite : ruas).addTo(mapa);
  L.control.layers({ "Satélite": satelite, "Mapa de ruas": ruas }, undefined, { position: "topright" }).addTo(mapa);
  mapa.setMaxZoom(20);
}
