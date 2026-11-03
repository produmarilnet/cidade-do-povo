"use client";

import { Assistente, Passo } from "@/components/assistente";
import { Campo, Rotulo } from "@/components/ui";
import type { Resultado } from "@/lib/resultado";
import type { UnidadeMaterial } from "@/lib/types";

/** A contagem da prateleira: quanto tem, quando contou e por que acertar. */
export function FormAcerto({
  acao,
  unidade,
  hoje,
}: {
  acao: (anterior: Resultado, dados: FormData) => Promise<Resultado>;
  unidade: UnidadeMaterial;
  hoje: string;
}) {
  return (
    <Assistente acao={acao} textoBotao="Acertar o saldo" limparAoSalvar>
      <Passo titulo="Contagem">
        <Rotulo texto={unidade === "m" ? "Quantos metros tem de verdade" : "Quantas peças tem de verdade"}>
          <Campo name="contado" inputMode="decimal" autoComplete="off" voz={false} required placeholder="Ex.: 12" />
        </Rotulo>
        <Rotulo texto="Data da contagem">
          <Campo name="data" type="date" max={hoje} defaultValue={hoje} required />
        </Rotulo>
        <Rotulo texto="Motivo">
          <Campo name="motivo" autoComplete="off" required placeholder="Ex.: contagem do mês, quebrou, perdeu" />
        </Rotulo>
      </Passo>
    </Assistente>
  );
}
