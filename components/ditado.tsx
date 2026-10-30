"use client";

import { useEffect, useRef, useState, type ComponentProps } from "react";
import { Mic } from "lucide-react";
import { cn, dinheiroParaCampo, lerDinheiro, mascaraDinheiro } from "@/lib/utils";

// ── Ditado por voz ─────────────────────────────────────────────────────────
//
// Botão de microfone dentro do campo: toca, fala, o texto entra no campo.
// Usa o reconhecimento de voz do próprio navegador (Safari no iPhone, Chrome).
// Onde o navegador não tem isso (Chrome do iPhone, app salvo na tela inicial,
// Firefox), o botão continua lá: abre o campo e lembra do 🎤 do teclado.

type Reconhecimento = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
};

function criarReconhecimento(): Reconhecimento | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: new () => Reconhecimento;
    webkitSpeechRecognition?: new () => Reconhecimento;
  };
  const Classe = w.SpeechRecognition ?? w.webkitSpeechRecognition;
  return Classe ? new Classe() : null;
}

// Só um microfone ligado por vez: abrir outro desliga o anterior.
let ativo: Reconhecimento | null = null;

/** "trezentos e cinquenta reais e 50 centavos" já vem do navegador como "350 reais e 50 centavos". */
export function falaParaValor(fala: string): string {
  const t = fala.toLowerCase().replace(/r\$\s*/g, "");
  const m = t.match(/(\d[\d.]*(?:,\d{1,2})?)(?:\s*rea(?:l|is))?(?:\s*e\s*(\d{1,2})\s*centavos?)?/);
  if (!m) return fala;
  const texto = m[2] ? `${m[1].replace(/,\d+$/, "")},${m[2].padStart(2, "0")}` : m[1];
  // Sempre com centavos ("1.200" → "1.200,00"), no formato da máscara do campo.
  const valor = lerDinheiro(texto);
  return Number.isNaN(valor) ? fala : dinheiroParaCampo(valor);
}

/**
 * Escreve no campo do jeito que o React percebe como digitação.
 * Os campos dos formulários são "soltos" (defaultValue); mesmo assim passa pelo
 * setter nativo e dispara `input`, para funcionar também em campo controlado.
 */
function escrever(el: HTMLInputElement | HTMLTextAreaElement, texto: string) {
  const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(proto, "value")?.set?.call(el, texto);
  el.dispatchEvent(new Event("input", { bubbles: true }));
}

function BotaoMicrofone({
  alvo,
  valor,
  className,
}: {
  alvo: React.RefObject<HTMLInputElement | HTMLTextAreaElement>;
  valor: boolean;
  className?: string;
}) {
  const [ouvindo, setOuvindo] = useState(false);
  const [dica, setDica] = useState(false);
  const rec = useRef<Reconhecimento | null>(null);

  useEffect(() => () => rec.current?.abort(), []);

  useEffect(() => {
    if (!dica) return;
    const t = setTimeout(() => setDica(false), 5000);
    return () => clearTimeout(t);
  }, [dica]);

  function alternar() {
    if (ouvindo) {
      rec.current?.stop();
      return;
    }
    ativo?.abort();
    const r = criarReconhecimento();
    if (!r) {
      // Sem voz no navegador: abre o teclado no campo; o ditado do teclado resolve.
      alvo.current?.focus();
      setDica(true);
      return;
    }
    r.lang = "pt-BR";
    r.interimResults = false;
    r.continuous = false;
    r.maxAlternatives = 1;

    r.onresult = (e) => {
      const el = alvo.current;
      const fala = e.results[0]?.[0]?.transcript?.trim();
      if (!el || !fala) return;
      if (valor) {
        escrever(el, falaParaValor(fala));
      } else {
        // Fala de novo num campo já preenchido: continua o texto.
        const antes = el.value.trim();
        const novo = antes ? `${antes} ${fala}` : fala.charAt(0).toUpperCase() + fala.slice(1);
        escrever(el, novo);
      }
      el.focus();
    };
    r.onerror = (e) => {
      if (e.error === "not-allowed" || e.error === "service-not-allowed") {
        window.alert("O microfone está bloqueado. Libere o microfone para este site nas configurações do navegador.");
      }
    };
    r.onend = () => {
      setOuvindo(false);
      if (ativo === r) ativo = null;
    };

    rec.current = r;
    ativo = r;
    setOuvindo(true);
    try {
      r.start();
    } catch {
      setOuvindo(false);
    }
  }

  return (
    <>
    {dica && (
      <span className="absolute right-0 top-full z-20 mt-1 w-56 rounded-lg bg-stone-900 px-3 py-2 text-xs font-normal text-white shadow-lg">
        Este navegador não ouve direto. Toque no 🎤 do teclado para falar.
      </span>
    )}
    <button
      type="button"
      onClick={alternar}
      aria-label={ouvindo ? "Parar de ouvir" : "Falar em vez de digitar"}
      title={ouvindo ? "Ouvindo… toque para parar" : "Falar em vez de digitar"}
      className={cn(
        "absolute right-1 flex h-8 w-8 items-center justify-center rounded-md transition-colors",
        ouvindo ? "animate-pulse bg-red-600 text-white" : "text-stone-400 hover:bg-stone-100 hover:text-marca-700",
        className,
      )}
    >
      <Mic className="h-4 w-4" />
    </button>
    </>
  );
}

const classePadraoCampo =
  "w-full rounded-lg border border-stone-300 bg-white px-3 text-base sm:text-sm text-stone-900 focus:border-marca-500 focus:outline-none focus:ring-2 focus:ring-marca-200";

/**
 * Campo de texto com microfone. `valor`: campo de dinheiro — máscara em reais
 * enquanto digita (20.000,00) e entende "350 reais e 50 centavos" → 350,50.
 */
export function CampoComVoz({ className, valor = false, ...props }: ComponentProps<"input"> & { valor?: boolean }) {
  const ref = useRef<HTMLInputElement>(null);
  const dinheiro: ComponentProps<"input"> = valor
    ? {
        inputMode: "numeric",
        defaultValue: props.defaultValue ? mascaraDinheiro(String(props.defaultValue)) : props.defaultValue,
        onChange: (e) => {
          // Campo solto (defaultValue): a máscara reescreve o texto direto.
          // Teclado só de números, sem corretor: reescrever aqui não atrapalha.
          e.target.value = mascaraDinheiro(e.target.value);
          props.onChange?.(e);
        },
      }
    : {};
  return (
    <div className="relative flex w-full items-center">
      <input
        ref={ref}
        className={cn(classePadraoCampo, "h-10 pr-10", className)}
        data-dinheiro={valor ? "" : undefined}
        {...props}
        {...dinheiro}
      />
      <BotaoMicrofone alvo={ref} valor={valor} />
    </div>
  );
}

export function AreaTextoComVoz({ className, ...props }: ComponentProps<"textarea">) {
  const ref = useRef<HTMLTextAreaElement>(null);
  return (
    <div className="relative w-full">
      <textarea ref={ref} className={cn(classePadraoCampo, "h-20 py-2 pr-10", className)} {...props} />
      <BotaoMicrofone alvo={ref} valor={false} className="top-1" />
    </div>
  );
}
