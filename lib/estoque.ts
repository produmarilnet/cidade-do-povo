import type { SaldoMaterial } from "./types";

/** "1,5" ou "1.5" → 1.5 (duas casas). Vazio ou o que não for número vira 0. */
export function lerQuantidade(texto: string): number {
  const n = Number(texto.trim().replace(",", "."));
  return Number.isFinite(n) && n > 0 ? Math.round(n * 100) / 100 : 0;
}

/** Número → texto do campo: 1.5 → "1,5"; 0 → "". */
export function quantidadeParaCampo(n: number): string {
  return n ? String(n).replace(".", ",") : "";
}

export type SituacaoEstoque = "sem" | "baixo" | "ok";

/**
 * Como o material está: "sem" = acabou (ou ficou negativo: saiu mais do que
 * entrou, falta lançar entrada); "baixo" = chegou no mínimo; "ok" = tem.
 */
export function situacaoDoEstoque(m: Pick<SaldoMaterial, "saldo" | "estoque_minimo">): SituacaoEstoque {
  if (m.saldo <= 0) return "sem";
  if (m.estoque_minimo > 0 && m.saldo <= m.estoque_minimo) return "baixo";
  return "ok";
}
