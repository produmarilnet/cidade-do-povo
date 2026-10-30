import type { SituacaoOrdem } from "./types";

/** Nº da ordem como sai impresso: 12 → "000012". */
export function numeroDaOrdem(numero: number): string {
  return String(numero).padStart(6, "0");
}

/** Data e hora da ficha no horário de Brasília: "30/10/2026 às 14:32". */
export function dataHoraDaFicha(quando: Date): string {
  return quando
    .toLocaleString("pt-BR", {
      timeZone: "America/Sao_Paulo",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
    .replace(",", " às");
}

/** Só a data da ficha: "30/10/2026". */
export function dataDaFicha(quando: Date): string {
  return quando.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });
}

/** Telefone enquanto digita: "99981234567" → "(99) 98123-4567". */
export function mascaraTelefone(texto: string): string {
  const d = texto.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : "";
  const ddd = `(${d.slice(0, 2)}) `;
  const resto = d.slice(2);
  // Fixo tem 8 números depois do DDD, celular tem 9.
  const meio = resto.length > 8 ? 5 : 4;
  return resto.length <= meio ? ddd + resto : `${ddd}${resto.slice(0, meio)}-${resto.slice(meio)}`;
}

/** Pedidos que mais aparecem — um toque preenche o "Serviço solicitado". */
export const SERVICOS_COMUNS = [
  "Lâmpada apagada",
  "Lâmpada acesa durante o dia",
  "Lâmpada piscando",
  "Troca de relé",
  "Luminária ou braço quebrado",
  "Fiação solta ou caída",
  "Instalação de ponto novo",
] as const;

export const NOME_SITUACAO: Record<SituacaoOrdem, string> = {
  aberta: "Aberta",
  executada: "Executada",
  cancelada: "Cancelada",
};

export const COR_SITUACAO: Record<SituacaoOrdem, "amarelo" | "verde" | "cinza"> = {
  aberta: "amarelo",
  executada: "verde",
  cancelada: "cinza",
};
