import type { SituacaoItem } from "./types";

/** Os tipos de veículo, para escolher com um toque no cadastro. */
export const TIPOS_VEICULO = ["Carro", "Caminhonete", "Caminhão cesto aéreo", "Caminhão", "Moto"] as const;

/** Serviços de manutenção mais comuns — um toque preenche o "O que foi feito". */
export const SERVICOS_MANUTENCAO = [
  "Troca de óleo e filtro",
  "Revisão",
  "Pneus",
  "Alinhamento e balanceamento",
  "Freios",
  "Bateria",
  "Parte elétrica",
  "Suspensão",
  "Embreagem",
  "Lanternagem e pintura",
  "Cesto aéreo / hidráulico",
] as const;

/**
 * Os itens do checklist, em grupos: cada grupo é uma tela do passo a passo.
 * O grupo "Cesto aéreo" só aparece para o veículo que tem cesto.
 */
export const CHECKLIST: { grupo: string; itens: string[]; soCesto?: boolean }[] = [
  {
    grupo: "Pneus e rodas",
    itens: ["Pneus (calibragem e desgaste)", "Estepe", "Macaco e chave de roda"],
  },
  {
    grupo: "Luzes",
    itens: ["Faróis", "Lanternas", "Setas e pisca-alerta", "Luz de freio e de ré", "Giroflex"],
  },
  {
    grupo: "Motor e fluidos",
    itens: ["Óleo do motor", "Água do radiador", "Fluido de freio", "Combustível", "Vazamentos"],
  },
  {
    grupo: "Freios e direção",
    itens: ["Freio de serviço", "Freio de mão", "Direção", "Buzina"],
  },
  {
    grupo: "Segurança e documentos",
    itens: ["Cintos de segurança", "Extintor (validade)", "Triângulo", "Documento do veículo (CRLV)", "Cones de sinalização"],
  },
  {
    grupo: "Cabine e lataria",
    itens: ["Retrovisores", "Para-brisa e limpadores", "Painel sem luz de alerta", "Lataria e para-choques", "Limpeza"],
  },
  {
    grupo: "Cesto aéreo",
    itens: ["Cesto e lança", "Sapatas / patolas", "Óleo do hidráulico", "Comandos", "Cinto e trava do cesto"],
    soCesto: true,
  },
];

/** O veículo tem cesto aéreo (pelo tipo ou pelo modelo)? */
export function temCesto(v: { tipo: string | null; modelo: string }): boolean {
  return /cesto|munck|guindauto/i.test(`${v.tipo ?? ""} ${v.modelo}`);
}

export const NOME_SITUACAO_ITEM: Record<SituacaoItem, string> = {
  ok: "OK",
  problema: "Com problema",
  na: "Não tem",
};

/** Placa como se escreve: "abc1d23" → "ABC1D23", "abc1234" → "ABC-1234". */
export function formatarPlaca(texto: string): string {
  const t = texto.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 7);
  // placa antiga (3 letras + 4 números) leva o traço; a do Mercosul não
  return /^[A-Z]{3}\d{4}$/.test(t) ? `${t.slice(0, 3)}-${t.slice(3)}` : t;
}

/** 123456 → "123.456 km". */
export function textoKm(km: number | null | undefined): string {
  if (km === null || km === undefined) return "";
  return `${km.toLocaleString("pt-BR")} km`;
}

/** "12.345" / "12345 km" → 12345. Vazio → null. Inválido → NaN. */
export function lerKm(texto: string): number | null {
  const t = texto.replace(/km/i, "").replace(/[.\s]/g, "").trim();
  if (!t) return null;
  return /^\d+$/.test(t) ? Number(t) : NaN;
}

/** A próxima manutenção já venceu (pela data ou pelo km)? Ou está chegando? */
export function situacaoDaProxima(
  m: { proxima_km: number | null; proxima_data: string | null },
  kmAtual: number,
  hoje: string,
): "vencida" | "perto" | "ok" | null {
  if (m.proxima_km === null && m.proxima_data === null) return null;
  if ((m.proxima_km !== null && kmAtual >= m.proxima_km) || (m.proxima_data !== null && hoje >= m.proxima_data)) {
    return "vencida";
  }
  // perto: faltam até 500 km ou até 15 dias
  const daqui15 = new Date(`${hoje}T12:00:00Z`);
  daqui15.setUTCDate(daqui15.getUTCDate() + 15);
  const limite = daqui15.toISOString().slice(0, 10);
  if ((m.proxima_km !== null && m.proxima_km - kmAtual <= 500) || (m.proxima_data !== null && m.proxima_data <= limite)) {
    return "perto";
  }
  return "ok";
}
