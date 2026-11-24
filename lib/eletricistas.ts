import type { TipoOcorrencia } from "./types";

/** Os materiais de segurança mais entregues — um toque marca o item na entrega. */
export const EPIS_COMUNS = [
  "Capacete com jugular",
  "Luva isolante de borracha",
  "Luva de cobertura (vaqueta)",
  "Luva de raspa",
  "Bota de segurança",
  "Óculos de proteção",
  "Cinto paraquedista",
  "Talabarte",
  "Uniforme (camisa)",
  "Uniforme (calça)",
  "Capa de chuva",
  "Protetor solar",
  "Detector de tensão",
] as const;

/** As funções da equipe, para preencher com um toque. */
export const FUNCOES_COMUNS = ["Eletricista", "Auxiliar de eletricista", "Motorista"] as const;

export const NOME_OCORRENCIA: Record<TipoOcorrencia, string> = {
  folga: "Folga",
  falta: "Falta",
  falta_justificada: "Falta justificada",
  atestado: "Atestado médico",
  ferias: "Férias",
  outro: "Outro",
};

export const COR_OCORRENCIA: Record<TipoOcorrencia, "verde" | "vermelho" | "amarelo" | "cinza"> = {
  folga: "verde",
  falta: "vermelho",
  falta_justificada: "amarelo",
  atestado: "amarelo",
  ferias: "verde",
  outro: "cinza",
};

/** Na lista dos eletricistas: por que a pessoa não está trabalhando hoje. */
export const HOJE_OCORRENCIA: Record<TipoOcorrencia, string> = {
  folga: "De folga hoje",
  falta: "Faltou hoje",
  falta_justificada: "Falta justificada hoje",
  atestado: "De atestado",
  ferias: "De férias",
  outro: "Ausente hoje",
};

function diaUtc(iso: string): number {
  const [a, m, d] = iso.slice(0, 10).split("-").map(Number);
  return Date.UTC(a, m - 1, d) / 86_400_000;
}

/** Quantos dias tem o período, contando o primeiro e o último: 01 a 03 → 3. */
export function diasDoPeriodo(inicio: string, fim: string): number {
  return diaUtc(fim) - diaUtc(inicio) + 1;
}

/** "3 anos e 2 meses", "5 meses", "12 dias" — o tempo de casa desde a admissão. */
export function tempoDeCasa(admissao: string, ate: string): string {
  const [a1, m1, d1] = admissao.split("-").map(Number);
  const [a2, m2, d2] = ate.split("-").map(Number);
  let meses = (a2 - a1) * 12 + (m2 - m1);
  if (d2 < d1) meses -= 1;
  if (meses < 0) return "ainda não começou";
  if (meses === 0) {
    const dias = diaUtc(ate) - diaUtc(admissao);
    return dias === 1 ? "1 dia" : `${dias} dias`;
  }
  const anos = Math.floor(meses / 12);
  const resto = meses % 12;
  const textoAnos = anos === 1 ? "1 ano" : `${anos} anos`;
  const textoMeses = resto === 1 ? "1 mês" : `${resto} meses`;
  if (anos === 0) return textoMeses;
  return resto === 0 ? textoAnos : `${textoAnos} e ${textoMeses}`;
}

/** CPF enquanto digita: "12345678901" → "123.456.789-01". */
export function mascaraCpf(texto: string): string {
  const d = texto.replace(/\D/g, "").slice(0, 11);
  return d
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d{1,2})$/, ".$1-$2");
}
