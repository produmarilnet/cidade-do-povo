"use client";

import { Atalhos } from "@/components/atalhos";
import { Passo } from "@/components/assistente";
import { AreaTexto, Campo, Rotulo } from "@/components/ui";
import { formatarPlaca, TIPOS_VEICULO } from "@/lib/frota";
import type { Veiculo } from "@/lib/types";

/** Os passos do cadastro do veículo — iguais para novo e para corrigir. */
export function CamposVeiculo({ veiculo }: { veiculo?: Veiculo }) {
  return (
    <>
      <Passo titulo="Placa">
        <Rotulo texto="Placa">
          <Campo
            name="placa"
            defaultValue={veiculo?.placa}
            placeholder="ABC1D23"
            autoComplete="off"
            autoCapitalize="characters"
            voz={false}
            required
            onChange={(e) => {
              e.target.value = formatarPlaca(e.target.value);
            }}
          />
        </Rotulo>
      </Passo>

      <Passo titulo="Tipo" dica="Toque no tipo ou escreva outro. Caminhão com cesto ganha os itens do cesto no checklist.">
        <Atalhos campo="tipo" opcoes={TIPOS_VEICULO} />
        <Rotulo texto="Tipo (opcional)">
          <Campo name="tipo" defaultValue={veiculo?.tipo ?? ""} autoComplete="off" />
        </Rotulo>
      </Passo>

      <Passo titulo="Modelo">
        <Rotulo texto="Modelo">
          <Campo name="modelo" defaultValue={veiculo?.modelo} placeholder="Ex.: Hilux, Strada, Cargo 816" autoComplete="off" required />
        </Rotulo>
        <Rotulo texto="Marca (opcional)">
          <Campo name="marca" defaultValue={veiculo?.marca ?? ""} placeholder="Ex.: Toyota, Fiat, Ford" autoComplete="off" />
        </Rotulo>
        <Rotulo texto="Ano (opcional)">
          <Campo name="ano" inputMode="numeric" defaultValue={veiculo?.ano ?? ""} placeholder="Ex.: 2020" autoComplete="off" voz={false} />
        </Rotulo>
        <Rotulo texto="Cor (opcional)">
          <Campo name="cor" defaultValue={veiculo?.cor ?? ""} autoComplete="off" />
        </Rotulo>
      </Passo>

      <Passo titulo="Documentos" dica="Estão no documento do veículo (CRLV). Pode deixar em branco.">
        <Rotulo texto="Renavam (opcional)">
          <Campo name="renavam" inputMode="numeric" defaultValue={veiculo?.renavam ?? ""} autoComplete="off" voz={false} />
        </Rotulo>
        <Rotulo texto="Chassi (opcional)">
          <Campo name="chassi" defaultValue={veiculo?.chassi ?? ""} autoComplete="off" autoCapitalize="characters" voz={false} />
        </Rotulo>
      </Passo>

      <Passo titulo="Km de hoje" dica="O que marca o painel agora. Depois o km anda sozinho com as manutenções e os checklists.">
        <Rotulo texto="Km (opcional)">
          <Campo
            name="km_inicial"
            inputMode="numeric"
            defaultValue={veiculo?.km_inicial || ""}
            placeholder="Ex.: 85000"
            autoComplete="off"
            voz={false}
          />
        </Rotulo>
      </Passo>

      <Passo titulo="Observações">
        <Rotulo texto="Observações (opcional)">
          <AreaTexto name="observacoes" rows={3} defaultValue={veiculo?.observacoes ?? ""} />
        </Rotulo>
      </Passo>
    </>
  );
}
