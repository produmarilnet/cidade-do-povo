// A conta do ponto do GPS: várias leituras viram um ponto só. Modelo do Medir
// cerca do PRODUMAR, que já funciona no iPhone.

export type LeituraGps = { lat: number; lng: number; precisao: number };
export type PontoGps = LeituraGps & { leituras: number };

/**
 * Média das leituras boas, pesada pela precisão de cada uma. Entram só as que
 * ficaram até `folga` metros piores que a melhor: as primeiras leituras pulam.
 */
export function pontoDasLeituras(leituras: LeituraGps[], folga: number): PontoGps | null {
  if (leituras.length === 0) return null;
  const melhor = Math.min(...leituras.map((l) => l.precisao));
  const boas = leituras.filter((l) => l.precisao <= melhor + folga);
  let somaPeso = 0;
  let lat = 0;
  let lng = 0;
  for (const l of boas) {
    const peso = 1 / Math.max(1, l.precisao) ** 2;
    somaPeso += peso;
    lat += l.lat * peso;
    lng += l.lng * peso;
  }
  return { lat: lat / somaPeso, lng: lng / somaPeso, precisao: melhor, leituras: boas.length };
}
