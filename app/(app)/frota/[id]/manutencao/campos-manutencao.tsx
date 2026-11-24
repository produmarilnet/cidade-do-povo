"use client";

import { Atalhos } from "@/components/atalhos";
import { Escolha, Passo } from "@/components/assistente";
import { AreaTexto, Campo, Rotulo } from "@/components/ui";
import { SERVICOS_MANUTENCAO } from "@/lib/frota";
import type { Manutencao } from "@/lib/types";
import { dinheiroParaCampo } from "@/lib/utils";

/** Os passos da manutenção — iguais para lançar e para corrigir. */
export function CamposManutencao({ m, hoje, kmAtual }: { m?: Manutencao; hoje: string; kmAtual: number }) {
  return (
    <>
      <Passo titulo="Tipo">
        <Escolha
          name="tipo"
          rotulo="Tipo"
          inicial={m?.tipo ?? "preventiva"}
          opcoes={[
            { valor: "preventiva", texto: "Preventiva", detalhe: "Revisão, troca de óleo, pneus…" },
            { valor: "corretiva", texto: "Corretiva", detalhe: "Quebrou e foi consertado" },
          ]}
        />
      </Passo>

      <Passo titulo="O que foi feito" dica="Toque num serviço ou escreva com suas palavras (peças trocadas, defeito…).">
        <Atalhos campo="servico" opcoes={SERVICOS_MANUTENCAO} />
        <Rotulo texto="O que foi feito">
          <AreaTexto name="servico" rows={3} defaultValue={m?.servico} required />
        </Rotulo>
      </Passo>

      <Passo titulo="Quando">
        <Rotulo texto="Data">
          <Campo name="data" type="date" max={hoje} defaultValue={m?.data ?? hoje} required />
        </Rotulo>
        <Rotulo texto="Km no painel (opcional)">
          <Campo
            name="km"
            inputMode="numeric"
            defaultValue={m?.km ?? ""}
            placeholder={kmAtual > 0 ? `Último lançado: ${kmAtual}` : "Ex.: 85000"}
            autoComplete="off"
            voz={false}
          />
        </Rotulo>
      </Passo>

      <Passo titulo="Onde e quanto custou">
        <Rotulo texto="Oficina (opcional)">
          <Campo name="oficina" defaultValue={m?.oficina ?? ""} autoComplete="off" />
        </Rotulo>
        <Rotulo texto="Valor (R$) (opcional)">
          <Campo
            name="valor"
            inputMode="decimal"
            defaultValue={m?.valor != null ? dinheiroParaCampo(m.valor) : ""}
            placeholder="0,00"
            autoComplete="off"
          />
        </Rotulo>
      </Passo>

      <Passo
        titulo="Próxima"
        dica="Quando fazer de novo (troca de óleo, revisão…). Pelo km, pela data ou pelos dois — o que chegar primeiro. A frota avisa quando vencer."
      >
        <Rotulo texto="No km (opcional)">
          <Campo
            name="proxima_km"
            inputMode="numeric"
            defaultValue={m?.proxima_km ?? ""}
            placeholder="Ex.: 90000"
            autoComplete="off"
            voz={false}
          />
        </Rotulo>
        <Rotulo texto="Na data (opcional)">
          <Campo name="proxima_data" type="date" defaultValue={m?.proxima_data ?? ""} />
        </Rotulo>
      </Passo>

      <Passo titulo="Observação">
        <Rotulo texto="Observação (opcional)">
          <Campo name="observacao" defaultValue={m?.observacao ?? ""} autoComplete="off" placeholder="Ex.: nº da nota, garantia" />
        </Rotulo>
      </Passo>
    </>
  );
}
