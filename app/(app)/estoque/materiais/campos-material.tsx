"use client";

import { Escolha, Passo } from "@/components/assistente";
import { Campo, Rotulo } from "@/components/ui";
import { quantidadeParaCampo } from "@/lib/estoque";
import type { Material } from "@/lib/types";

/** O passo do material — igual para incluir e para alterar. */
export function CamposMaterial({ material }: { material?: Material }) {
  return (
    <Passo titulo="Material">
      <Rotulo texto="Nome do material">
        <Campo name="nome" defaultValue={material?.nome} placeholder="Ex.: Luminária 100 watts" autoComplete="off" required />
      </Rotulo>
      <Escolha
        name="unidade"
        rotulo="Como é contado"
        inicial={material?.unidade ?? "un"}
        opcoes={[
          { valor: "un", texto: "Por peça", detalhe: "luminária, relé, poste…" },
          { valor: "m", texto: "Por metro", detalhe: "cabo" },
        ]}
      />
      <Rotulo texto="Estoque mínimo (opcional)">
        <Campo
          name="estoque_minimo"
          inputMode="decimal"
          defaultValue={quantidadeParaCampo(material?.estoque_minimo ?? 0)}
          placeholder="Ex.: 10"
          autoComplete="off"
          voz={false}
        />
        <span className="text-xs font-normal text-stone-500">
          Quando o saldo chegar nesse número, o estoque avisa que está acabando. Em branco, não avisa.
        </span>
      </Rotulo>
    </Passo>
  );
}
