import qrcode from "qrcode-generator";

/**
 * QR Code desenhado no servidor, em SVG: sai nítido em qualquer tamanho de
 * impressão. Correção "Q": ainda lê com cerca de 25% do desenho estragado, o
 * que conta para uma etiqueta que fica no sol e na chuva.
 */
export function QrCode({ texto, className }: { texto: string; className?: string }) {
  const qr = qrcode(0, "Q");
  qr.addData(texto);
  qr.make();
  const lado = qr.getModuleCount();
  let desenho = "";
  for (let linha = 0; linha < lado; linha++) {
    for (let coluna = 0; coluna < lado; coluna++) {
      if (qr.isDark(linha, coluna)) desenho += `M${coluna} ${linha}h1v1h-1z`;
    }
  }
  // a margem branca em volta faz parte do QR: sem ela a câmera não acha o desenho
  const margem = 2;
  return (
    <svg
      viewBox={`${-margem} ${-margem} ${lado + margem * 2} ${lado + margem * 2}`}
      shapeRendering="crispEdges"
      role="img"
      aria-label="QR Code"
      className={className}
    >
      <rect x={-margem} y={-margem} width={lado + margem * 2} height={lado + margem * 2} fill="#fff" />
      <path d={desenho} fill="#000" />
    </svg>
  );
}
