"use client";

import type { MouseEvent } from "react";
import { Passo } from "@/components/assistente";
import { AreaTexto, Campo, Rotulo } from "@/components/ui";
import { mascaraTelefone, SERVICOS_COMUNS } from "@/lib/iluminacao";
import type { OrdemServico } from "@/lib/types";

/** Um toque no pedido comum escreve no "Serviço solicitado" (dá para completar depois). */
function preencherServico(e: MouseEvent<HTMLButtonElement>, texto: string) {
  const campo = e.currentTarget.form?.elements.namedItem("servico");
  if (!(campo instanceof HTMLTextAreaElement)) return;
  Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")?.set?.call(campo, texto);
  campo.dispatchEvent(new Event("input", { bubbles: true }));
  campo.focus();
}

/** Os passos do pedido — iguais para abrir e para corrigir a ordem. */
export function CamposOrdem({ ordem, atendente }: { ordem?: OrdemServico; atendente: string }) {
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
        <Rotulo texto="Endereço">
          <Campo name="endereco" defaultValue={ordem?.endereco} placeholder="Rua, travessa, bairro…" autoComplete="off" required />
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
        <div className="flex flex-wrap gap-2">
          {SERVICOS_COMUNS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={(e) => preencherServico(e, s)}
              className="rounded-full border border-stone-300 bg-white px-3 py-1.5 text-sm text-stone-700 hover:border-marca-400 hover:bg-marca-50"
            >
              {s}
            </button>
          ))}
        </div>
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
