import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { AreaTextoComVoz, CampoComVoz } from "./ditado";

export function Cartao({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("rounded-xl border border-stone-200 bg-white p-4 shadow-sm", className)} {...props} />;
}

export function Titulo({ children, acao }: { children: ReactNode; acao?: ReactNode }) {
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <h1 className="text-xl font-semibold text-stone-900">{children}</h1>
      {acao}
    </div>
  );
}

const estilosBotao = {
  primario: "bg-marca-600 text-white hover:bg-marca-700",
  secundario: "border border-stone-300 bg-white text-stone-700 hover:bg-stone-50",
  perigo: "bg-red-600 text-white hover:bg-red-700",
  fantasma: "text-stone-600 hover:bg-stone-100",
};

export function classeBotao(variante: keyof typeof estilosBotao = "primario", className?: string) {
  return cn(
    "inline-flex h-10 items-center justify-center gap-2 rounded-lg px-4 text-sm font-medium transition-colors disabled:opacity-50",
    estilosBotao[variante],
    className,
  );
}

export function Botao({
  variante = "primario",
  className,
  ...props
}: ComponentProps<"button"> & { variante?: keyof typeof estilosBotao }) {
  return <button className={classeBotao(variante, className)} {...props} />;
}

// text-base (16px) no celular: abaixo disso o iPhone dá zoom ao tocar no campo.
const classeCampo =
  "h-10 w-full rounded-lg border border-stone-300 bg-white px-3 text-base sm:text-sm text-stone-900 focus:border-marca-500 focus:outline-none focus:ring-2 focus:ring-marca-200";

export function Rotulo({ texto, children, className }: { texto: string; children: ReactNode; className?: string }) {
  return (
    // data-rotulo: é o nome do campo na conferência do cadastro passo a passo.
    <label data-rotulo={texto} className={cn("flex flex-col gap-1 text-sm font-medium text-stone-700", className)}>
      {texto}
      {children}
    </label>
  );
}

/**
 * Campo de formulário. Campo de texto ganha microfone para ditar
 * (`voz={false}` desliga — ex.: senha digitada em campo de texto).
 * Email, senha, data e número ficam sem microfone.
 */
export function Campo({ className, voz, ...props }: ComponentProps<"input"> & { voz?: boolean }) {
  const deTexto = props.type === undefined || props.type === "text" || props.type === "search";
  if (voz ?? deTexto) {
    return <CampoComVoz className={className} valor={props.inputMode === "decimal"} {...props} />;
  }
  return <input className={cn(classeCampo, className)} {...props} />;
}

export function Selecao({ className, ...props }: ComponentProps<"select">) {
  return <select className={cn(classeCampo, className)} {...props} />;
}

export function AreaTexto(props: ComponentProps<"textarea">) {
  return <AreaTextoComVoz {...props} />;
}

export function Etiqueta({ cor, children }: { cor: "verde" | "vermelho" | "amarelo" | "cinza"; children: ReactNode }) {
  const cores = {
    verde: "bg-green-100 text-green-800",
    vermelho: "bg-red-100 text-red-800",
    amarelo: "bg-amber-100 text-amber-800",
    cinza: "bg-stone-100 text-stone-700",
  };
  return <span className={cn("inline-block rounded-full px-2 py-0.5 text-xs font-medium", cores[cor])}>{children}</span>;
}

export function Aviso({ tipo = "erro", children }: { tipo?: "erro" | "ok"; children: ReactNode }) {
  return (
    <p
      className={cn(
        "rounded-lg px-3 py-2 text-sm",
        tipo === "erro" ? "bg-red-50 text-red-700" : "bg-marca-50 text-marca-800",
      )}
    >
      {children}
    </p>
  );
}
