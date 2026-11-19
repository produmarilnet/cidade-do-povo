"use client";

import { useEffect, useState } from "react";
import { NOME_PAPEL, PAPEIS } from "@/lib/types";
import type { Resultado } from "@/lib/resultado";
import { Formulario } from "@/components/formulario";
import { Assistente, Escolha, Passo } from "@/components/assistente";
import { DadosDeAcesso, gerarSenha, type Acesso } from "@/components/dados-de-acesso";
import { Campo, Rotulo } from "@/components/ui";

type Acao = (anterior: Resultado, dados: FormData) => Promise<Resultado>;

/** A senha sugerida nasce no navegador (no servidor daria diferença na hidratação). */
function useSenhaSugerida() {
  const [senha, setSenha] = useState("");
  useEffect(() => setSenha(gerarSenha()), []);
  return [senha, () => setSenha(gerarSenha())] as const;
}

/** Cadastro passo a passo; no fim aparece o recado com o login e a senha para mandar no WhatsApp. */
export function NovoUsuario({ acao, oQueCadaUmFaz }: { acao: Acao; oQueCadaUmFaz: Record<string, string> }) {
  const [senha, novaSenha] = useSenhaSugerida();
  const [acesso, setAcesso] = useState<Acesso | null>(null);

  return (
    <div className="flex flex-col gap-4">
      {acesso && (
        <DadosDeAcesso
          acesso={acesso}
          titulo={`Usuário criado — mande o acesso para ${acesso.nome}`}
          onFechar={() => setAcesso(null)}
        />
      )}
      <Assistente
        acao={acao}
        limparAoSalvar
        textoBotao="Cadastrar"
        aoSalvar={(estado) => {
          if (estado.acesso) setAcesso(estado.acesso);
          novaSenha();
        }}
      >
        <Passo titulo="Quem é">
          <Rotulo texto="Nome">
            <Campo name="nome" required />
          </Rotulo>
          <Rotulo texto="Email (é o login)">
            <Campo name="email" type="email" autoComplete="off" autoCapitalize="none" required />
          </Rotulo>
        </Passo>
        <Passo titulo="Senha inicial" dica="Já vem uma sugerida, fácil de digitar. Pode trocar se quiser.">
          <Rotulo texto="Senha inicial (mínimo 6 letras ou números)">
            <Campo
              name="senha"
              type="text"
              minLength={6}
              defaultValue={senha}
              autoComplete="off"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              voz={false}
              required
            />
          </Rotulo>
        </Passo>
        <Passo titulo="O que pode fazer">
          <Escolha
            name="papel"
            rotulo="Papel"
            inicial="atendente"
            opcoes={PAPEIS.map((p) => ({ valor: p, texto: NOME_PAPEL[p], detalhe: oQueCadaUmFaz[p] }))}
          />
        </Passo>
      </Assistente>
    </div>
  );
}

/** Troca a senha de alguém (esqueceu) e mostra o recado para mandar de novo. */
export function TrocarSenha({ acao }: { acao: Acao }) {
  const [senha, novaSenha] = useSenhaSugerida();
  const [acesso, setAcesso] = useState<Acesso | null>(null);

  return (
    <div className="flex flex-col gap-3">
      <Formulario
        acao={acao}
        limparAoSalvar
        textoBotao="Trocar senha"
        className="flex flex-wrap items-end gap-2"
        aoSalvar={(estado) => {
          if (estado.acesso) setAcesso(estado.acesso);
          novaSenha();
        }}
      >
        <Rotulo texto="Nova senha" className="flex-1">
          <Campo
            name="senha"
            type="text"
            minLength={6}
            defaultValue={senha}
            autoComplete="off"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            voz={false}
            required
          />
        </Rotulo>
      </Formulario>
      {acesso && (
        <DadosDeAcesso
          acesso={acesso}
          titulo={`Senha trocada — mande o novo acesso para ${acesso.nome}`}
          onFechar={() => setAcesso(null)}
        />
      )}
    </div>
  );
}
