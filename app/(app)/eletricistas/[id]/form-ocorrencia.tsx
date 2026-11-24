"use client";

import { useState } from "react";
import { Assistente, Escolha, Passo } from "@/components/assistente";
import { Campo, Rotulo } from "@/components/ui";
import { NOME_OCORRENCIA } from "@/lib/eletricistas";
import type { Resultado } from "@/lib/resultado";
import { TIPOS_OCORRENCIA, type TipoOcorrencia } from "@/lib/types";

const OPCOES = TIPOS_OCORRENCIA.map((t) => ({ valor: t, texto: NOME_OCORRENCIA[t] }));

/** Lança folga, falta, atestado ou férias — de um dia ou de vários. */
export function FormOcorrencia({
  acao,
  hoje,
}: {
  acao: (anterior: Resultado, dados: FormData) => Promise<Resultado>;
  hoje: string;
}) {
  const [tipo, setTipo] = useState<TipoOcorrencia>("folga");
  const [periodo, setPeriodo] = useState<"um" | "varios">("um");
  const [inicio, setInicio] = useState(hoje);

  return (
    <Assistente
      acao={acao}
      textoBotao="Lançar"
      limparAoSalvar
      aoSalvar={() => {
        setTipo("folga");
        setPeriodo("um");
        setInicio(hoje);
      }}
    >
      <Passo titulo="O que foi">
        <Escolha name="tipo" rotulo="O que foi" opcoes={OPCOES} valor={tipo} aoMudar={setTipo} />
      </Passo>
      <Passo titulo="Quando">
        <Escolha
          name="periodo"
          rotulo="Quantos dias"
          opcoes={[
            { valor: "um", texto: "Um dia só" },
            { valor: "varios", texto: "Vários dias" },
          ]}
          valor={periodo}
          aoMudar={setPeriodo}
        />
        <Rotulo texto={periodo === "um" ? "Dia" : "Primeiro dia"}>
          <Campo name="inicio" type="date" value={inicio} onChange={(e) => setInicio(e.target.value)} required />
        </Rotulo>
        {periodo === "varios" && (
          <Rotulo texto="Último dia">
            <Campo name="fim" type="date" min={inicio} required />
          </Rotulo>
        )}
      </Passo>
      <Passo titulo="Observação">
        <Rotulo texto="Observação (opcional)">
          <Campo name="observacao" autoComplete="off" placeholder={tipo === "atestado" ? "Ex.: atestado de 3 dias, Dr. …" : "Ex.: trocou a folga com o colega"} />
        </Rotulo>
      </Passo>
    </Assistente>
  );
}
