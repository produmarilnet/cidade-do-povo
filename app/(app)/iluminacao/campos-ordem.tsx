"use client";

import { Atalhos } from "@/components/atalhos";
import { Passo } from "@/components/assistente";
import { CamposLugar } from "@/components/campos-lugar";
import { AreaTexto, Campo, Rotulo } from "@/components/ui";
import { mascaraTelefone, SERVICOS_COMUNS } from "@/lib/iluminacao";
import type { OrdemServico } from "@/lib/types";

/** Os passos do pedido — iguais para abrir e para corrigir a ordem. */
export function CamposOrdem({
  ordem,
  posteNumero,
  atendente,
  localidades,
  bairros,
}: {
  /** A ordem que está sendo corrigida, ou o endereço do poste na ordem nova. */
  ordem?: Partial<OrdemServico>;
  /** O nº do poste da ordem, ou o do poste de onde ela foi aberta. */
  posteNumero?: number | null;
  atendente: string;
  /** "Sede" e os povoados já usados, os mais pedidos primeiro. */
  localidades: string[];
  /** Os bairros já usados, os mais pedidos primeiro. */
  bairros: string[];
}) {
  return (
    <>
      <Passo titulo="Quem pediu">
        <Rotulo texto="Nome">
          <Campo name="nome" defaultValue={ordem?.nome} autoComplete="off" required />
        </Rotulo>
        <Rotulo texto="Apelido (opcional)">
          <Campo name="apelido" defaultValue={ordem?.apelido ?? ""} autoComplete="off" />
        </Rotulo>
        <Rotulo texto="Telefone (opcional)">
          <Campo
            name="telefone"
            type="tel"
            inputMode="tel"
            autoComplete="off"
            placeholder="(00) 00000-0000"
            defaultValue={ordem?.telefone ?? ""}
            onChange={(e) => {
              e.target.value = mascaraTelefone(e.target.value);
            }}
          />
        </Rotulo>
      </Passo>

      <Passo titulo="Onde é">
        <Rotulo texto="Nº do poste (opcional)">
          <Campo
            name="poste"
            inputMode="numeric"
            defaultValue={posteNumero ?? ""}
            placeholder="O número da etiqueta, se tiver"
            autoComplete="off"
            voz={false}
          />
        </Rotulo>
        <CamposLugar localidade={ordem?.localidade} bairro={ordem?.bairro} localidades={localidades} bairros={bairros} />
        {/* só a rua: o relatório por rua agrupa por este campo */}
        <Rotulo texto="Endereço">
          <Campo name="endereco" defaultValue={ordem?.endereco} placeholder="Rua, avenida, travessa…" autoComplete="off" required />
        </Rotulo>
        <Rotulo texto="Número da casa (opcional)">
          <Campo name="numero_casa" defaultValue={ordem?.numero_casa ?? ""} placeholder="Ex.: 120 ou S/N" autoComplete="off" />
        </Rotulo>
        <Rotulo texto="Ponto de referência (opcional)">
          <Campo
            name="ponto_referencia"
            defaultValue={ordem?.ponto_referencia ?? ""}
            placeholder="Ex.: em frente à escola, poste da esquina"
            autoComplete="off"
          />
        </Rotulo>
      </Passo>

      <Passo titulo="Serviço solicitado" dica="Toque num pedido comum ou escreva com suas palavras.">
        <Atalhos campo="servico" opcoes={SERVICOS_COMUNS} />
        <Rotulo texto="Serviço solicitado">
          <AreaTexto name="servico" rows={3} defaultValue={ordem?.servico} required />
        </Rotulo>
      </Passo>

      <Passo titulo="Atendente" dica="A data da ficha o sistema preenche sozinho, na hora de salvar.">
        <Rotulo texto="Atendente">
          <Campo name="atendente" defaultValue={ordem?.atendente ?? atendente} autoComplete="off" required />
        </Rotulo>
      </Passo>
    </>
  );
}
