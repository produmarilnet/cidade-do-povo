"use client";

import {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { flushSync, useFormState, useFormStatus } from "react-dom";
import { Check, ChevronLeft, ChevronRight, Pencil } from "lucide-react";
import { Aviso, Botao } from "./ui";
import type { Resultado } from "@/lib/resultado";
import { cn, formatarData } from "@/lib/utils";

// ── Cadastro passo a passo ─────────────────────────────────────────────────
//
// Um formulário só, com os campos repartidos em <Passo>. Aparece um passo por
// vez; "Continuar" confere os campos do passo e vai para o próximo. No fim vem
// a conferência: tudo o que foi preenchido, passo por passo, com "Alterar".
// Os passos escondidos continuam no formulário, então a server action recebe
// todos os campos de uma vez, igual a antes.
//
// O resumo da conferência é lido dos próprios campos:
// - o nome do campo é o `texto` do <Rotulo> em volta (data-rotulo);
// - `data-conferir="Nome"` no campo troca o nome (e faz entrar campo escondido);
// - `data-texto="..."` troca o valor mostrado (ex.: escolha feita por botões).

type Acao = (anterior: Resultado, dados: FormData) => Promise<Resultado>;

const PassoAtivo = createContext<string | undefined>(undefined);

/** Um passo do cadastro. O título aparece no topo e na conferência. */
export function Passo({ titulo, dica, children }: { titulo: string; dica?: string; children: ReactNode }) {
  const ativo = useContext(PassoAtivo);
  return (
    <div data-passo={titulo} className={cn("flex flex-col gap-3", ativo !== titulo && "hidden")}>
      {dica && <p className="-mt-1 text-xs text-stone-500">{dica}</p>}
      {children}
    </div>
  );
}

/**
 * Escolha entre poucas opções com botões grandes (melhor que lista no celular).
 * Controlada (`valor` + `aoMudar`) ou solta (`inicial`).
 */
export function Escolha<T extends string>({
  name,
  rotulo,
  opcoes,
  valor,
  inicial,
  aoMudar,
}: {
  name: string;
  rotulo: string;
  opcoes: readonly { valor: T; texto: string; detalhe?: string }[];
  valor?: T;
  inicial?: T;
  aoMudar?: (v: T) => void;
}) {
  const [solto, setSolto] = useState<T>(inicial ?? opcoes[0].valor);
  const escolhido = valor ?? solto;
  const opcao = opcoes.find((o) => o.valor === escolhido);
  return (
    <div className="flex flex-col gap-1 text-sm font-medium text-stone-700">
      {rotulo}
      <input type="hidden" name={name} value={escolhido} data-conferir={rotulo} data-texto={opcao?.texto ?? ""} />
      <div className={cn("grid gap-2", opcoes.length === 2 ? "grid-cols-2" : "grid-cols-1 sm:grid-cols-2")}>
        {opcoes.map((o) => (
          <button
            key={o.valor}
            type="button"
            onClick={() => {
              setSolto(o.valor);
              aoMudar?.(o.valor);
            }}
            className={cn(
              "rounded-lg border px-3 py-3 text-left text-sm",
              escolhido === o.valor
                ? "border-marca-600 bg-marca-50 font-semibold text-marca-800 ring-1 ring-marca-600"
                : "border-stone-300 bg-white font-normal text-stone-700 hover:bg-stone-50",
            )}
          >
            {o.texto}
            {o.detalhe && <span className="mt-0.5 block text-xs font-normal text-stone-500">{o.detalhe}</span>}
          </button>
        ))}
      </div>
    </div>
  );
}

type ItemResumo = { rotulo: string; valor: string };
type BlocoResumo = { titulo: string; indice: number; itens: ItemResumo[] };

type Campo = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

function lerCampos(passo: HTMLElement): ItemResumo[] {
  const itens: ItemResumo[] = [];
  passo.querySelectorAll<Campo>("input, select, textarea").forEach((campo) => {
    const nomeExplicito = campo.dataset.conferir;
    if (!nomeExplicito && (campo.type === "hidden" || !campo.name)) return;
    if (campo.type === "radio" && !(campo as HTMLInputElement).checked) return;

    const rotulo = (nomeExplicito ?? campo.closest<HTMLElement>("[data-rotulo]")?.dataset.rotulo ?? campo.name)
      // O valor já vem com "R$" e campo vazio já aparece como "não preenchido".
      .replace(/\s*\((R\$|opcional)\)/g, "");
    let valor: string;
    if (campo.dataset.texto !== undefined) {
      valor = campo.dataset.texto;
    } else if (campo instanceof HTMLSelectElement) {
      valor = campo.selectedOptions[0]?.text ?? "";
    } else if (campo.type === "checkbox") {
      valor = (campo as HTMLInputElement).checked ? "Sim" : "Não";
    } else if (campo.type === "date") {
      valor = formatarData(campo.value);
    } else {
      valor = campo.value.trim();
    }
    if (valor && campo.dataset.dinheiro !== undefined) valor = `R$ ${valor}`;
    itens.push({ rotulo, valor });
  });
  return itens;
}

export function Assistente({
  acao,
  children,
  textoBotao = "Salvar",
  limparAoSalvar = false,
  aoSalvar,
  comecarNaConferencia = false,
}: {
  acao: Acao;
  children: ReactNode;
  textoBotao?: string;
  limparAoSalvar?: boolean;
  /** Chamado depois de salvar com sucesso (ex.: limpar campos controlados pela tela). */
  aoSalvar?: () => void;
  /** Editar: abre direto na conferência, e é só tocar em "Alterar" no que mudou. */
  comecarNaConferencia?: boolean;
}) {
  const [estado, enviar] = useFormState(acao, { ok: false });
  const form = useRef<HTMLFormElement>(null);
  const topo = useRef<HTMLDivElement>(null);
  const [passos, setPassos] = useState<string[]>([]);
  const [atual, setAtual] = useState(comecarNaConferencia ? Number.MAX_SAFE_INTEGER : 0);
  const [jaConferiu, setJaConferiu] = useState(comecarNaConferencia);
  const [resumo, setResumo] = useState<BlocoResumo[]>([]);
  // A mensagem de "salvo" fica até a pessoa começar o próximo cadastro.
  const [mostrarRetorno, setMostrarRetorno] = useState(false);

  const elementosDosPassos = () =>
    Array.from(form.current?.querySelectorAll<HTMLElement>("[data-passo]") ?? []);

  // Os passos são lidos da tela: um passo pode aparecer ou sumir conforme o que
  // foi escolhido antes (ex.: "obra" só existe para despesa).
  useLayoutEffect(() => {
    const titulos = elementosDosPassos().map((p) => p.dataset.passo ?? "");
    if (titulos.join("\n") !== passos.join("\n")) setPassos(titulos);
  });

  const total = passos.length;
  const indice = total === 0 ? 0 : Math.min(atual, total);
  const naConferencia = total > 0 && indice === total;

  useLayoutEffect(() => {
    if (!naConferencia) return;
    setResumo(
      elementosDosPassos().map((p, i) => ({ titulo: p.dataset.passo ?? "", indice: i, itens: lerCampos(p) })),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [naConferencia, passos]);

  useEffect(() => {
    if (estado.erro) {
      setMostrarRetorno(true);
      return;
    }
    if (!estado.ok) return;
    setMostrarRetorno(true);
    if (limparAoSalvar) {
      form.current?.reset();
      setAtual(0);
      setJaConferiu(false);
    }
    aoSalvar?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estado]);

  /** Muda de passo já na mesma batida do toque: assim o iPhone deixa abrir o teclado. */
  function irPara(novo: number) {
    flushSync(() => {
      setAtual(novo);
      setMostrarRetorno(false);
    });
    const caixa = topo.current;
    if (caixa && caixa.getBoundingClientRect().top < 0) caixa.scrollIntoView({ block: "start", behavior: "smooth" });
    const passo = elementosDosPassos()[novo];
    const primeiro = passo?.querySelector<HTMLInputElement | HTMLTextAreaElement>(
      'input:not([type=hidden]):not([type=checkbox]):not([type=radio]):not([type=date]), textarea',
    );
    // Só foca campo vazio: em campo já preenchido o teclado subindo atrapalha a leitura.
    if (primeiro && !primeiro.value) primeiro.focus({ preventScroll: true });
  }

  /** Confere os campos de um passo; no primeiro com problema, mostra o aviso do navegador. */
  function passoValido(i: number): boolean {
    const passo = elementosDosPassos()[i];
    if (!passo) return true;
    const invalido = Array.from(passo.querySelectorAll<Campo>("input, select, textarea")).find(
      (c) => !c.checkValidity(),
    );
    if (!invalido) return true;
    if (i !== indice) irPara(i);
    invalido.reportValidity();
    return false;
  }

  /** Vai até a conferência passando por todos os passos — para no primeiro que faltar algo. */
  function irParaConferencia() {
    for (let i = 0; i < total; i++) if (!passoValido(i)) return;
    setJaConferiu(true);
    irPara(total);
  }

  function aoEnviar(e: FormEvent<HTMLFormElement>) {
    if (naConferencia) {
      // Antes de salvar, garante que nada ficou para trás (ex.: alterou um passo e apagou um campo).
      for (let i = 0; i < total; i++) {
        if (!passoValido(i)) {
          e.preventDefault();
          return;
        }
      }
      return; // segue para a server action
    }
    // Enter / "Ir" do teclado ou "Continuar": avança em vez de salvar.
    e.preventDefault();
    if (!passoValido(indice)) return;
    if (indice + 1 >= total) irParaConferencia();
    else irPara(indice + 1);
  }

  return (
    <form ref={form} action={enviar} onSubmit={aoEnviar} noValidate className="flex flex-col gap-4">
      <div ref={topo} className="scroll-mt-4">
        <BarraDePassos total={total + 1} indice={indice} />
        <div className="mt-3 flex items-baseline justify-between gap-2">
          <h3 className="text-lg font-semibold text-stone-900">
            {naConferencia ? "Confira se está tudo certo" : passos[indice]}
          </h3>
          {total > 0 && (
            <span className="shrink-0 text-xs text-stone-500">
              Passo {indice + 1} de {total + 1}
            </span>
          )}
        </div>
      </div>

      {mostrarRetorno && estado.ok && estado.mensagem && !naConferencia && (
        <Aviso tipo="ok">{estado.mensagem}</Aviso>
      )}

      <PassoAtivo.Provider value={naConferencia ? undefined : passos[indice]}>{children}</PassoAtivo.Provider>

      {naConferencia && (
        <div className="flex flex-col gap-2">
          {resumo.map((bloco) => (
            <div key={bloco.titulo} className="rounded-lg border border-stone-200">
              <div className="flex items-center justify-between gap-2 border-b border-stone-100 bg-stone-50 px-3 py-1.5">
                <span className="text-xs font-semibold uppercase tracking-wide text-stone-500">{bloco.titulo}</span>
                <button
                  type="button"
                  onClick={() => irPara(bloco.indice)}
                  className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-marca-700 hover:bg-marca-50"
                >
                  <Pencil className="h-3 w-3" />
                  Alterar
                </button>
              </div>
              <dl className="divide-y divide-stone-100">
                {bloco.itens.map((item, i) => (
                  <div key={i} className="flex gap-3 px-3 py-2 text-sm">
                    {/* Nome igual ao título do passo ("Categoria" / "Categoria"): mostra só o valor. */}
                    {item.rotulo !== bloco.titulo && <dt className="w-2/5 shrink-0 text-stone-500">{item.rotulo}</dt>}
                    <dd className={cn("min-w-0 flex-1 whitespace-pre-line break-words font-medium", !item.valor && "font-normal text-stone-400")}>
                      {item.valor || "não preenchido"}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          ))}
        </div>
      )}

      {mostrarRetorno && estado.erro && naConferencia && <Aviso>{estado.erro}</Aviso>}
      {mostrarRetorno && estado.ok && estado.mensagem && naConferencia && <Aviso tipo="ok">{estado.mensagem}</Aviso>}

      <div className="flex flex-wrap items-center gap-2">
        {indice > 0 && (
          <Botao type="button" variante="secundario" onClick={() => irPara(indice - 1)}>
            <ChevronLeft className="h-4 w-4" />
            Voltar
          </Botao>
        )}
        <BotaoAvancar naConferencia={naConferencia} textoFinal={textoBotao} />
        {jaConferiu && !naConferencia && (
          <Botao type="button" variante="fantasma" onClick={irParaConferencia}>
            Ir para a conferência
          </Botao>
        )}
      </div>
    </form>
  );
}

function BarraDePassos({ total, indice }: { total: number; indice: number }) {
  return (
    <div className="flex gap-1" aria-hidden>
      {Array.from({ length: Math.max(total, 1) }, (_, i) => (
        <div
          key={i}
          className={cn("h-1.5 flex-1 rounded-full", i <= indice ? "bg-marca-600" : "bg-stone-200")}
        />
      ))}
    </div>
  );
}

function BotaoAvancar({ naConferencia, textoFinal }: { naConferencia: boolean; textoFinal: string }) {
  const { pending } = useFormStatus();
  if (naConferencia) {
    return (
      <Botao type="submit" disabled={pending} className="flex-1 sm:flex-none">
        <Check className="h-4 w-4" />
        {pending ? "Salvando…" : textoFinal}
      </Botao>
    );
  }
  return (
    <Botao type="submit" className="flex-1 sm:flex-none">
      Continuar
      <ChevronRight className="h-4 w-4" />
    </Botao>
  );
}
