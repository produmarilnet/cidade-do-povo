/**
 * O poste no SATÉLITE DO GOOGLE, com o alfinete em cima e o nome das ruas.
 * Em São Mateus a foto do Google é bem mais nítida que a da Esri dos mapas
 * grandes (lá ela só vai até o zoom 17): aqui dá para ver telhado por telhado.
 * É o quadro de "incorporar mapa" do próprio Google, sem chave e sem custo.
 */
export function SateliteGoogle({
  latitude,
  longitude,
  zoom = 19,
  className = "h-72 sm:h-96",
}: {
  latitude: number;
  longitude: number;
  zoom?: number;
  className?: string;
}) {
  const ponto = `${latitude.toFixed(7)},${longitude.toFixed(7)}`;
  return (
    <iframe
      title="Localização do poste no satélite"
      src={`https://maps.google.com/maps?q=${ponto}&t=k&z=${zoom}&hl=pt-BR&output=embed`}
      loading="lazy"
      referrerPolicy="no-referrer-when-downgrade"
      className={`block w-full rounded-xl border border-stone-200 bg-stone-100 ${className}`}
    />
  );
}
