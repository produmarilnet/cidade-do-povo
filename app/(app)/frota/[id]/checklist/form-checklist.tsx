"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCheck } from "lucide-react";
import { Assistente, Passo } from "@/components/assistente";
import { AreaTexto, Botao, Campo, Rotulo } from "@/components/ui";
import { NOME_SITUACAO_ITEM } from "@/lib/frota";
import type { Resultado } from "@/lib/resultado";
import type { SituacaoItem } from "@/lib/types";
import { cn } from "@/lib/utils";

/** `indice`: a posição do grupo em CHECKLIST (o nome do campo leva números, não o texto). */
type Grupo = { grupo: string; itens: string[]; indice: number };

const BOTOES: { valor: SituacaoItem; texto: string; marcado: string }[] = [
  { valor: "ok", texto: "OK", marcado: "border-green-600 bg-green-50 text-green-800 ring-1 ring-green-600" },
  { valor: "problema", texto: "Problema", marcado: "border-red-600 bg-red-50 text-red-800 ring-1 ring-red-600" },
  { valor: "na", texto: "Não tem", marcado: "border-stone-500 bg-stone-100 text-stone-700 ring-1 ring-stone-500" },
];

/** Uma tela do checklist: os itens do grupo, cada um com OK / Problema / Não tem. */
function GrupoDoChecklist({
  g,
  situacoes,
  obs,
  marcar,
  escreverObs,
}: {
  g: Grupo;
  situacoes: Record<string, SituacaoItem>;
  obs: Record<string, string>;
  marcar: (chaves: string[], s: SituacaoItem) => void;
  escreverObs: (chave: string, texto: string) => void;
}) {
  const chaves = g.itens.map((_, i) => `${g.indice}-${i}`);
  const faltam = chaves.filter((c) => !situacoes[c]).length;

  // Caixinha escondida que segura o "Continuar" até todos os itens do grupo serem marcados.
  const obrigatorio = useRef<HTMLInputElement>(null);
  useEffect(() => {
    obrigatorio.current?.setCustomValidity(
      faltam === 0 ? "" : faltam === 1 ? "Falta marcar 1 item." : `Faltam marcar ${faltam} itens.`,
    );
  }, [faltam]);

  return (
    <Passo titulo={g.grupo}>
      <input
        ref={obrigatorio}
        type="checkbox"
        checked={faltam === 0}
        onChange={() => {}}
        tabIndex={-1}
        aria-hidden
        className="sr-only"
      />
      <Botao type="button" variante="secundario" className="self-start" onClick={() => marcar(chaves.filter((c) => !situacoes[c]), "ok")}>
        <CheckCheck className="h-4 w-4" />
        Marcar o resto como OK
      </Botao>
      {g.itens.map((item, i) => {
        const chave = chaves[i];
        const s = situacoes[chave];
        const texto = s ? NOME_SITUACAO_ITEM[s] + (s === "problema" && obs[chave]?.trim() ? `: ${obs[chave].trim()}` : "") : "";
        return (
          <div
            key={chave}
            className={cn("rounded-lg border p-3", s === "problema" ? "border-red-200 bg-red-50/40" : "border-stone-200")}
          >
            <input type="hidden" name={`item:${chave}`} value={s ?? ""} data-conferir={item} data-texto={texto} />
            <input type="hidden" name={`obs:${chave}`} value={s === "problema" ? (obs[chave] ?? "") : ""} />
            <div className="mb-2 text-sm font-medium text-stone-800">{item}</div>
            <div className="grid grid-cols-3 gap-2">
              {BOTOES.map((b) => (
                <button
                  key={b.valor}
                  type="button"
                  onClick={() => marcar([chave], b.valor)}
                  className={cn(
                    "rounded-lg border px-2 py-2.5 text-sm font-medium",
                    s === b.valor ? b.marcado : "border-stone-300 bg-white text-stone-600 hover:bg-stone-50",
                  )}
                >
                  {b.texto}
                </button>
              ))}
            </div>
            {s === "problema" && (
              <Campo
                className="mt-2"
                value={obs[chave] ?? ""}
                onChange={(e) => escreverObs(chave, e.target.value)}
                placeholder="O que tem? (opcional)"
                autoComplete="off"
                aria-label={`Problema em ${item}`}
              />
            )}
          </div>
        );
      })}
    </Passo>
  );
}

/** O checklist do veículo: quem, quando e km; depois um grupo de itens por tela. */
export function FormChecklist({
  acao,
  grupos,
  hoje,
  responsavel,
  kmAtual,
}: {
  acao: (anterior: Resultado, dados: FormData) => Promise<Resultado>;
  grupos: Grupo[];
  hoje: string;
  responsavel: string;
  kmAtual: number;
}) {
  const [situacoes, setSituacoes] = useState<Record<string, SituacaoItem>>({});
  const [obs, setObs] = useState<Record<string, string>>({});

  const marcar = (chaves: string[], s: SituacaoItem) =>
    setSituacoes((atual) => ({ ...atual, ...Object.fromEntries(chaves.map((c) => [c, s])) }));
  const escreverObs = (chave: string, texto: string) => setObs((atual) => ({ ...atual, [chave]: texto }));

  return (
    <Assistente acao={acao} textoBotao="Salvar checklist">
      <Passo titulo="Quem e quando">
        <Rotulo texto="Quem está conferindo">
          <Campo name="responsavel" defaultValue={responsavel} autoComplete="off" required />
        </Rotulo>
        <Rotulo texto="Data">
          <Campo name="data" type="date" max={hoje} defaultValue={hoje} required />
        </Rotulo>
        <Rotulo texto="Km no painel (opcional)">
          <Campo
            name="km"
            inputMode="numeric"
            placeholder={kmAtual > 0 ? `Último lançado: ${kmAtual}` : "Ex.: 85000"}
            autoComplete="off"
            voz={false}
          />
        </Rotulo>
      </Passo>

      {grupos.map((g) => (
        <GrupoDoChecklist key={g.grupo} g={g} situacoes={situacoes} obs={obs} marcar={marcar} escreverObs={escreverObs} />
      ))}

      <Passo titulo="Observação">
        <Rotulo texto="Observação (opcional)">
          <AreaTexto name="observacao" rows={3} placeholder="Algo mais sobre o veículo" />
        </Rotulo>
      </Passo>
    </Assistente>
  );
}
