"use client";

import { Atalhos } from "@/components/atalhos";
import { Passo } from "@/components/assistente";
import { AreaTexto, Campo, Rotulo } from "@/components/ui";
import { mascaraTelefone, PEDIDOS_DO_MORADOR } from "@/lib/iluminacao";

/** Os passos do pedido de conserto: o mínimo para a equipe atender e falar com quem pediu. */
export function CamposPedido() {
  return (
    <>
      <Passo titulo="Qual é o problema?" dica="Toque numa opção ou escreva com suas palavras.">
        <Atalhos campo="servico" opcoes={PEDIDOS_DO_MORADOR} />
        <Rotulo texto="Problema">
          <AreaTexto name="servico" rows={3} maxLength={300} required />
        </Rotulo>
      </Passo>

      <Passo titulo="Seus dados" dica="A equipe usa só para falar com você sobre este conserto.">
        <Rotulo texto="Seu nome">
          <Campo name="nome" autoComplete="name" maxLength={80} required />
        </Rotulo>
        <Rotulo texto="Telefone com DDD">
          <Campo
            name="telefone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="(00) 00000-0000"
            required
            onChange={(e) => {
              e.target.value = mascaraTelefone(e.target.value);
            }}
          />
        </Rotulo>
      </Passo>
    </>
  );
}
