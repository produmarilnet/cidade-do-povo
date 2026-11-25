// O LEVANTAMENTO DA ILUMINAÇÃO PÚBLICA (migration 0009): os pontos do arquivo
// KMZ do cadastro feito no GlobalCAD. Só para consulta — achar o poste na rua.

export type PontoLevantamento = {
  id: number;
  formulario: number | null;
  ponto: number | null;
  latitude: number;
  longitude: number;
  logradouro: string | null;
  bairro: string | null;
  tipo_luminaria: string | null;
  tipo_lampada: string | null;
  potencia: number | null;
  lampadas: number | null;
  tipo_poste: string | null;
  chave: string | null;
  medidor: string | null;
  plaqueta: string | null;
  acesa_24h: boolean | null;
  medido: boolean | null;
  fotos: string[];
};

/** Como o ponto se chama no levantamento: formulário e nº do ponto ("4349573-3"). */
export function codigoDoPonto(p: Pick<PontoLevantamento, "formulario" | "ponto">): string {
  return [p.formulario, p.ponto].filter((v) => v != null).join("-") || "—";
}

/** "Led 30 W" */
export function lampadaDoPonto(p: Pick<PontoLevantamento, "tipo_lampada" | "potencia" | "lampadas">): string {
  const partes = [
    p.lampadas && p.lampadas > 1 ? `${p.lampadas}×` : null,
    p.tipo_lampada,
    p.potencia ? `${p.potencia} W` : null,
  ].filter(Boolean);
  return partes.join(" ") || "Sem informação da lâmpada";
}

/** A foto no GlobalCAD. `grande`: no tamanho original (para abrir ao tocar). */
export function fotoDoPonto(blob: string, grande = false): string {
  const nome = blob.split("/").pop() ?? blob;
  const tamanho = grande ? "W=-1&H=-1" : "W=-2&H=300";
  return `https://app2.globalcad.com.br/GetPhoto.ashx?CONTAINER=cadphotos-services&BLOB=${encodeURIComponent(blob)}&FNAME=${encodeURIComponent(nome)}&reload=true&${tamanho}`;
}

/** O caminho até o ponto no Google Maps (abre o aplicativo, se o celular tiver). */
export function caminhoNoGoogleMaps(latitude: number, longitude: number): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&travelmode=driving`;
}

/** O caminho até o ponto no Mapas do iPhone. */
export function caminhoNoAppleMapas(latitude: number, longitude: number): string {
  return `https://maps.apple.com/?daddr=${latitude},${longitude}&dirflg=d`;
}

/** "35 m" / "1,2 km" */
export function textoDaDistancia(metros: number): string {
  if (metros < 1000) return `${Math.round(metros)} m`;
  return `${(metros / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} km`;
}

/** Para a busca: minúsculo e sem acento — o SQL faz o mesmo com `translate`. */
export function textoDeBusca(texto: string): string {
  return texto.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
}
