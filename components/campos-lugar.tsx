"use client";

import { Atalhos } from "./atalhos";
import { Campo, Rotulo } from "./ui";

/** Localidade e bairro, com a sugestão dos já usados: iguais na ordem e no poste. */
export function CamposLugar({
  localidade,
  bairro,
  localidades,
  bairros,
}: {
  localidade?: string | null;
  bairro?: string | null;
  /** "Sede" e os povoados já usados, os mais pedidos primeiro. */
  localidades: string[];
  /** Os bairros já usados, os mais pedidos primeiro. */
  bairros: string[];
}) {
  return (
    <>
      {/* a localidade é o que separa sede e povoados no relatório */}
      <Rotulo texto="Localidade">
        <Campo
          name="localidade"
          list="localidades"
          defaultValue={localidade ?? ""}
          placeholder="Sede ou nome do povoado"
          autoComplete="off"
          required
        />
      </Rotulo>
      <datalist id="localidades">
        {localidades.map((l) => (
          <option key={l} value={l} />
        ))}
      </datalist>
      <Atalhos campo="localidade" opcoes={localidades.slice(0, 12)} className="-mt-1" />
      <Rotulo texto="Bairro (opcional)">
        <Campo
          name="bairro"
          list="bairros"
          defaultValue={bairro ?? ""}
          placeholder="Em branco se o povoado não tiver bairro"
          autoComplete="off"
          maxLength={80}
        />
      </Rotulo>
      <datalist id="bairros">
        {bairros.map((b) => (
          <option key={b} value={b} />
        ))}
      </datalist>
      <Atalhos campo="bairro" opcoes={bairros.slice(0, 12)} className="-mt-1" />
    </>
  );
}
