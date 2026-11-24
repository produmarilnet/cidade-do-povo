"use client";

import { Atalhos } from "@/components/atalhos";
import { Passo } from "@/components/assistente";
import { AreaTexto, Campo, Rotulo } from "@/components/ui";
import { FUNCOES_COMUNS, mascaraCpf } from "@/lib/eletricistas";
import { mascaraTelefone } from "@/lib/iluminacao";
import type { Eletricista } from "@/lib/types";

/** Os passos do cadastro — iguais para eletricista novo e para corrigir. */
export function CamposEletricista({ eletricista, hoje }: { eletricista?: Eletricista; hoje: string }) {
  return (
    <>
      <Passo titulo="Nome">
        <Rotulo texto="Nome completo">
          <Campo name="nome" defaultValue={eletricista?.nome} autoComplete="off" required />
        </Rotulo>
        <Rotulo texto="Apelido (opcional)">
          <Campo name="apelido" defaultValue={eletricista?.apelido ?? ""} autoComplete="off" />
        </Rotulo>
      </Passo>

      <Passo titulo="Função" dica="Toque numa função ou escreva outra.">
        <Atalhos campo="funcao" opcoes={FUNCOES_COMUNS} />
        <Rotulo texto="Função (opcional)">
          <Campo name="funcao" defaultValue={eletricista?.funcao ?? ""} autoComplete="off" />
        </Rotulo>
      </Passo>

      <Passo titulo="Admissão">
        <Rotulo texto="Data de admissão">
          <Campo name="data_admissao" type="date" max={hoje} defaultValue={eletricista?.data_admissao ?? ""} required />
        </Rotulo>
      </Passo>

      <Passo titulo="Documento e telefone">
        <Rotulo texto="CPF (opcional)">
          <Campo
            name="cpf"
            inputMode="numeric"
            autoComplete="off"
            voz={false}
            placeholder="000.000.000-00"
            defaultValue={eletricista?.cpf ?? ""}
            onChange={(e) => {
              e.target.value = mascaraCpf(e.target.value);
            }}
          />
        </Rotulo>
        <Rotulo texto="Telefone (opcional)">
          <Campo
            name="telefone"
            type="tel"
            inputMode="tel"
            autoComplete="off"
            placeholder="(00) 00000-0000"
            defaultValue={eletricista?.telefone ?? ""}
            onChange={(e) => {
              e.target.value = mascaraTelefone(e.target.value);
            }}
          />
        </Rotulo>
      </Passo>

      <Passo titulo="Tamanhos" dica="Para separar o uniforme e a bota na hora de entregar. Pode deixar em branco.">
        <Rotulo texto="Camisa (opcional)">
          <Campo name="tamanho_camisa" defaultValue={eletricista?.tamanho_camisa ?? ""} placeholder="Ex.: M, G, GG" autoComplete="off" voz={false} />
        </Rotulo>
        <Rotulo texto="Calça (opcional)">
          <Campo name="tamanho_calca" defaultValue={eletricista?.tamanho_calca ?? ""} placeholder="Ex.: 42" autoComplete="off" voz={false} />
        </Rotulo>
        <Rotulo texto="Bota (opcional)">
          <Campo name="tamanho_bota" defaultValue={eletricista?.tamanho_bota ?? ""} placeholder="Ex.: 40" inputMode="numeric" autoComplete="off" voz={false} />
        </Rotulo>
      </Passo>

      <Passo titulo="Observações">
        <Rotulo texto="Observações (opcional)">
          <AreaTexto name="observacoes" rows={3} defaultValue={eletricista?.observacoes ?? ""} />
        </Rotulo>
      </Passo>
    </>
  );
}
