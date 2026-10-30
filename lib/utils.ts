import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const moeda = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export function formatarDinheiro(valor: number): string {
  return moeda.format(valor);
}

/** "1.234,56" / "1234,56" / "1234.56" / "R$ 50" → número. Inválido → NaN. */
export function lerDinheiro(texto: string): number {
  let t = texto.replace(/[R$\s]/g, "");
  if (t.includes(",")) t = t.replace(/\./g, "").replace(",", ".");
  if (!/^-?\d+(\.\d+)?$/.test(t)) return NaN;
  return Math.round(Number(t) * 100) / 100;
}

/**
 * Máscara de dinheiro enquanto digita, como em app de banco: só os números
 * contam e os dois últimos são os centavos. "2000000" → "20.000,00".
 */
export function mascaraDinheiro(texto: string): string {
  const digitos = texto.replace(/\D/g, "").replace(/^0+/, "");
  if (!digitos) return "";
  const cheio = digitos.padStart(3, "0");
  const inteiro = cheio.slice(0, -2).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${inteiro},${cheio.slice(-2)}`;
}

/** Número → "1.234,56" para preencher campo de valor. */
export function dinheiroParaCampo(valor: number): string {
  return mascaraDinheiro(valor.toFixed(2));
}

/** "2026-10-01" → "01/10/2026". Trabalha no texto, sem fuso horário. */
export function formatarData(iso: string | null | undefined): string {
  if (!iso) return "";
  const [a, m, d] = iso.slice(0, 10).split("-");
  return `${d}/${m}/${a}`;
}

/** Hoje no horário de Brasília, como "AAAA-MM-DD". */
export function hoje(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());
}

/** "2026-10" → primeiro e último dia do mês. */
export function limitesDoMes(mes: string): { inicio: string; fim: string } {
  const [a, m] = mes.split("-").map(Number);
  const ultimo = new Date(Date.UTC(a, m, 0)).getUTCDate();
  return { inicio: `${mes}-01`, fim: `${mes}-${String(ultimo).padStart(2, "0")}` };
}

export function nomeDoMes(mes: string): string {
  const [a, m] = mes.split("-").map(Number);
  const nome = new Date(Date.UTC(a, m - 1, 1)).toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
  return nome.charAt(0).toUpperCase() + nome.slice(1);
}

export function mesVizinho(mes: string, passo: number): string {
  const [a, m] = mes.split("-").map(Number);
  const d = new Date(Date.UTC(a, m - 1 + passo, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}
