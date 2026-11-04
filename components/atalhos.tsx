"use client";

import type { MouseEvent } from "react";
import { cn } from "@/lib/utils";

/**
 * Escreve no campo do formulário como se a pessoa tivesse digitado (o React e
 * o microfone do campo ficam sabendo da mudança).
 */
function escreverNoCampo(e: MouseEvent<HTMLButtonElement>, campo: string, texto: string) {
  const alvo = e.currentTarget.form?.elements.namedItem(campo);
  if (!(alvo instanceof HTMLTextAreaElement || alvo instanceof HTMLInputElement)) return;
  const prototipo = alvo instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(prototipo, "value")?.set?.call(alvo, texto);
  alvo.dispatchEvent(new Event("input", { bubbles: true }));
  alvo.focus();
}

/** Botões de preenchimento rápido: um toque escreve o texto no campo (dá para completar depois). */
export function Atalhos({ campo, opcoes, className }: { campo: string; opcoes: readonly string[]; className?: string }) {
  if (opcoes.length === 0) return null;
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {opcoes.map((s) => (
        <button
          key={s}
          type="button"
          onClick={(e) => escreverNoCampo(e, campo, s)}
          className="rounded-full border border-stone-300 bg-white px-3 py-1.5 text-sm text-stone-700 hover:border-marca-400 hover:bg-marca-50"
        >
          {s}
        </button>
      ))}
    </div>
  );
}
