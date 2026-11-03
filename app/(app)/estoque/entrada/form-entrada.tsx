"use client";

import { Assistente, Passo } from "@/components/assistente";
import { EscolherMateriais } from "@/components/escolher-materiais";
import { AreaTexto, Campo, Rotulo } from "@/components/ui";
import type { Resultado } from "@/lib/resultado";
import type { Material } from "@/lib/types";

/** Dar entrada no estoque: a nota que chegou e os materiais dela. */
export function FormEntrada({
  acao,
  materiais,
  saldos,
  fornecedores,
  hoje,
}: {
  acao: (anterior: Resultado, dados: FormData) => Promise<Resultado>;
  materiais: Material[];
  saldos: Record<string, number>;
  /** Fornecedores já usados — aparecem como sugestão no campo. */
  fornecedores: string[];
  hoje: string;
}) {
  return (
    <Assistente acao={acao} textoBotao="Dar entrada no estoque">
      <Passo titulo="De onde veio" dica="A data é a do dia em que o material chegou.">
        <Rotulo texto="Data da entrada">
          <Campo name="data" type="date" max={hoje} defaultValue={hoje} required />
        </Rotulo>
        <Rotulo texto="Fornecedor (opcional)">
          <Campo name="fornecedor" list="fornecedores" autoComplete="off" placeholder="Ex.: loja, almoxarifado da prefeitura" />
        </Rotulo>
        <datalist id="fornecedores">
          {fornecedores.map((f) => (
            <option key={f} value={f} />
          ))}
        </datalist>
        <Rotulo texto="Nº da nota fiscal ou documento (opcional)">
          <Campo name="documento" autoComplete="off" voz={false} placeholder="Ex.: NF 1234, requisição 56" />
        </Rotulo>
      </Passo>

      <Passo titulo="Materiais que chegaram" dica="Toque no material — cada toque soma mais um. Acerte a quantidade na lista.">
        <EscolherMateriais
          materiais={materiais}
          inicial={[]}
          name="itens"
          rotulo="Materiais"
          permitirOutro={false}
          saldos={saldos}
          entrada
        />
      </Passo>

      <Passo titulo="Observação">
        <Rotulo texto="Observação (opcional)">
          <AreaTexto name="observacao" rows={3} />
        </Rotulo>
      </Passo>
    </Assistente>
  );
}
