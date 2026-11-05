// O endereço que vai gravado no QR. A etiqueta fica anos na rua: mudar este
// domínio deixa todas as etiquetas impressas apontando para o lugar errado.
export const ENDERECO_DO_SITE = "https://cidadedopovo.ilnet.com.br";

/** Nº do poste como sai na etiqueta: 12 → "000012". */
export function numeroDoPoste(numero: number): string {
  return String(numero).padStart(6, "0");
}

/** O que vai dentro do QR: curto, para o desenho sair com quadradinhos grandes. */
export function enderecoDoQr(numero: number): string {
  return `${ENDERECO_DO_SITE}/p/${numero}`;
}

/** "000123" → 123. Qualquer outra coisa → null (o número precisa caber no banco). */
export function lerNumeroDoPoste(texto: string): number | null {
  const limpo = texto.trim();
  if (!/^\d{1,9}$/.test(limpo)) return null;
  const numero = Number(limpo);
  return numero > 0 ? numero : null;
}

/** O nº do poste de um QR lido, ou null se o QR não é de poste nosso. */
export function numeroDoQr(lido: string): number | null {
  const prefixo = `${ENDERECO_DO_SITE}/p/`;
  return lido.startsWith(prefixo) ? lerNumeroDoPoste(lido.slice(prefixo.length)) : null;
}

/** Abre o ponto no aplicativo de mapas do celular. */
export function linkDoMapa(latitude: number, longitude: number): string {
  return `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
}

/** "± 3,2 m" */
export function textoDaPrecisao(metros: number): string {
  return `± ${metros.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} m`;
}

/** Quantas etiquetas cabem numa folha A4 e num lote de impressão. */
export const ETIQUETAS_POR_FOLHA = 12;
export const ETIQUETAS_POR_LOTE = 120;
