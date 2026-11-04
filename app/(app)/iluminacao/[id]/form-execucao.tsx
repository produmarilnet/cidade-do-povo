"use client";

import { Atalhos } from "@/components/atalhos";
import { Assistente, Passo } from "@/components/assistente";
import { AreaTexto, Campo, Rotulo } from "@/components/ui";
import { SERVICOS_COMUNS } from "@/lib/iluminacao";
import type { Resultado } from "@/lib/resultado";
import type { Material, MaterialDaOrdem, OrdemServico } from "@/lib/types";
import { EscolherMateriais } from "@/components/escolher-materiais";

/** Passa para o sistema o que o eletricista escreveu na ficha. */
export function FormExecucao({
  ordem,
  acao,
  eletricistas,
  equipes,
  materiais,
  materiaisDaOrdem,
  saldos,
  hoje,
}: {
  ordem: OrdemServico;
  acao: (anterior: Resultado, dados: FormData) => Promise<Resultado>;
  /** Nomes já usados e usuários eletricistas — aparecem como sugestão no campo. */
  eletricistas: string[];
  /** Equipes já usadas, as mais frequentes primeiro. */
  equipes: string[];
  /** O banco de materiais (só os ativos). */
  materiais: Material[];
  /** O que já foi registrado nesta ordem — ao corrigir a baixa. */
  materiaisDaOrdem: MaterialDaOrdem[];
  /** Saldo do estoque de cada material, sem o que esta própria ordem já gastou. */
  saldos: Record<string, number>;
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
        <Rotulo texto="Equipe (opcional)">
          <Campo name="equipe" list="equipes" defaultValue={ordem.equipe ?? ""} placeholder="Ex.: Equipe 1" autoComplete="off" />
        </Rotulo>
        <datalist id="equipes">
          {equipes.map((n) => (
            <option key={n} value={n} />
          ))}
        </datalist>
        <Atalhos campo="equipe" opcoes={equipes.slice(0, 8)} className="-mt-1" />
      </Passo>
      <Passo
        titulo="Serviço executado"
        dica="O que foi feito de verdade — já vem o que foi pedido. Se foi outra coisa, toque ou escreva."
      >
        <Atalhos campo="servico_executado" opcoes={SERVICOS_COMUNS} />
        <Rotulo texto="Serviço executado">
          <AreaTexto name="servico_executado" rows={3} defaultValue={ordem.servico_executado ?? ordem.servico} required />
        </Rotulo>
      </Passo>
      <Passo
        titulo="Material aplicado"
        dica="Toque no material usado — cada toque soma mais um. Se não usou nada, é só continuar."
      >
        <EscolherMateriais materiais={materiais} inicial={materiaisDaOrdem} saldos={saldos} />
        {/* ordem baixada antes do banco de materiais: o texto antigo continua editável */}
        {ordem.material && (
          <Rotulo texto="Material escrito antes (opcional)">
            <AreaTexto name="material" rows={3} defaultValue={ordem.material} />
          </Rotulo>
        )}
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
