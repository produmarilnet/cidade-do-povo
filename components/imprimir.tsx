"use client";

import { Printer } from "lucide-react";
import { classeBotao } from "./ui";

/** Abre a impressão do navegador (dá para salvar em PDF também). */
export function BotaoImprimir({ texto = "Imprimir" }: { texto?: string }) {
  return (
    <button type="button" onClick={() => window.print()} className={classeBotao("secundario", "print:hidden")}>
      <Printer className="h-4 w-4" />
      {texto}
    </button>
  );
}
