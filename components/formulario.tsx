"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { Aviso, Botao } from "./ui";
import type { Resultado } from "@/lib/resultado";

type Acao = (anterior: Resultado, dados: FormData) => Promise<Resultado>;

/**
 * Formulário ligado a uma server action. Mostra o erro que a ação devolver e
 * trava o botão enquanto envia (evita lançamento em dobro com toque duplo).
 */
export function Formulario({
  acao,
  children,
  textoBotao = "Salvar",
  limparAoSalvar = false,
  aoSalvar,
  className,
}: {
  acao: Acao;
  children: ReactNode;
  textoBotao?: string;
  limparAoSalvar?: boolean;
  /** Chamado depois de salvar com sucesso (ex.: limpar campos controlados pela tela). */
  aoSalvar?: () => void;
  className?: string;
}) {
  const [estado, enviar] = useFormState(acao, { ok: false });
  const form = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!estado.ok) return;
    if (limparAoSalvar) form.current?.reset();
    aoSalvar?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estado]);

  return (
    <form ref={form} action={enviar} className={className ?? "flex flex-col gap-3"}>
      {children}
      {estado.erro && <Aviso>{estado.erro}</Aviso>}
      {estado.ok && estado.mensagem && <Aviso tipo="ok">{estado.mensagem}</Aviso>}
      <BotaoEnviar texto={textoBotao} />
    </form>
  );
}

function BotaoEnviar({ texto }: { texto: string }) {
  const { pending } = useFormStatus();
  return (
    <Botao type="submit" disabled={pending} className="self-start">
      {pending ? "Salvando…" : texto}
    </Botao>
  );
}

/** Botão solto que dispara uma ação (marcar pago, excluir…), com confirmação opcional. */
export function BotaoAcao({
  acao,
  children,
  confirmar,
  variante = "secundario",
  className,
}: {
  acao: () => Promise<void>;
  children: ReactNode;
  confirmar?: string;
  variante?: "primario" | "secundario" | "perigo" | "fantasma";
  className?: string;
}) {
  return (
    <form
      action={acao}
      onSubmit={(e) => {
        if (confirmar && !window.confirm(confirmar)) e.preventDefault();
      }}
    >
      <BotaoPendente variante={variante} className={className}>
        {children}
      </BotaoPendente>
    </form>
  );
}

function BotaoPendente({
  children,
  variante,
  className,
}: {
  children: ReactNode;
  variante: "primario" | "secundario" | "perigo" | "fantasma";
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <Botao type="submit" variante={variante} disabled={pending} className={className}>
      {children}
    </Botao>
  );
}
