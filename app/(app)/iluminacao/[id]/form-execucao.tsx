"use client";

import { Assistente, Passo } from "@/components/assistente";
import { AreaTexto, Campo, Rotulo } from "@/components/ui";
import type { Resultado } from "@/lib/resultado";
import type { OrdemServico } from "@/lib/types";

/** Passa para o sistema o que o eletricista escreveu na ficha. */
export function FormExecucao({
  ordem,
  acao,
  eletricistas,
  hoje,
}: {
  ordem: OrdemServico;
  acao: (anterior: Resultado, dados: FormData) => Promise<Resultado>;
  /** Nomes já usados e usuários eletricistas — aparecem como sugestão no campo. */
  eletricistas: string[];
  hoje: string;
}) {
  const jaRegistrada = ordem.situacao === "executada";
  return (
    <Assistente acao={acao} textoBotao={jaRegistrada ? "Salvar correção" : "Dar como executada"} comecarNaConferencia={jaRegistrada}>
      <Passo titulo="Eletricista executor">
        <Rotulo texto="Eletricista executor">
          <Campo name="eletricista" list="eletricistas" defaultValue={ordem.eletricista ?? ""} autoComplete="off" required />
        </Rotulo>
        <datalist id="eletricistas">
          {eletricistas.map((n) => (
            <option key={n} value={n} />
          ))}
        </datalist>
      </Passo>
      <Passo titulo="Material aplicado" dica="O que foi usado: lâmpada, relé, reator, fio… Se não usou nada, deixe em branco.">
        <Rotulo texto="Material aplicado (opcional)">
          <AreaTexto name="material" rows={4} defaultValue={ordem.material ?? ""} />
        </Rotulo>
      </Passo>
      <Passo titulo="Data do serviço">
        <Rotulo texto="Data">
          <Campo name="data_execucao" type="date" max={hoje} defaultValue={ordem.data_execucao ?? hoje} required />
        </Rotulo>
      </Passo>
      <Passo titulo="Observações extras">
        <Rotulo texto="Observações extras (opcional)">
          <AreaTexto name="observacoes" rows={4} defaultValue={ordem.observacoes ?? ""} />
        </Rotulo>
      </Passo>
    </Assistente>
  );
}
