"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Minus, Plus, X } from "lucide-react";
import { Assistente, Passo } from "@/components/assistente";
import { Botao, Campo, Rotulo } from "@/components/ui";
import { EPIS_COMUNS } from "@/lib/eletricistas";
import type { Resultado } from "@/lib/resultado";
import { cn } from "@/lib/utils";

type Item = { item: string; quantidade: number };

/** Os materiais marcados: um toque marca o item, e dá para mudar a quantidade. */
function EscolherEpis({ itens, aoMudar }: { itens: Item[]; aoMudar: (itens: Item[]) => void }) {
  const [outro, setOutro] = useState("");

  // Caixinha escondida que segura o "Continuar" sem nenhum material marcado
  // (campo hidden o navegador não confere).
  const obrigatorio = useRef<HTMLInputElement>(null);
  useEffect(() => {
    obrigatorio.current?.setCustomValidity(itens.length ? "" : "Marque pelo menos um material entregue.");
  }, [itens]);

  const marcado = (nome: string) => itens.some((i) => i.item === nome);
  const alternar = (nome: string) =>
    aoMudar(marcado(nome) ? itens.filter((i) => i.item !== nome) : [...itens, { item: nome, quantidade: 1 }]);
  const mudarQuantidade = (nome: string, passo: number) =>
    aoMudar(itens.map((i) => (i.item === nome ? { ...i, quantidade: Math.max(1, i.quantidade + passo) } : i)));
  const incluirOutro = () => {
    const nome = outro.trim();
    if (nome.length < 2) return;
    if (!marcado(nome)) aoMudar([...itens, { item: nome, quantidade: 1 }]);
    setOutro("");
  };

  const resumo = itens.map((i) => `${i.quantidade} × ${i.item}`).join("\n");
  const outros = itens.filter((i) => !(EPIS_COMUNS as readonly string[]).includes(i.item));

  return (
    <>
      <input type="hidden" name="itens" value={JSON.stringify(itens)} />
      <input
        ref={obrigatorio}
        type="checkbox"
        checked={itens.length > 0}
        onChange={() => {}}
        tabIndex={-1}
        aria-hidden
        className="sr-only"
        data-conferir="Materiais"
        data-texto={resumo}
      />

      <div className="flex flex-wrap gap-2">
        {[...EPIS_COMUNS, ...outros.map((o) => o.item)].map((nome) => (
          <button
            key={nome}
            type="button"
            onClick={() => alternar(nome)}
            className={cn(
              "inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-sm",
              marcado(nome)
                ? "border-marca-600 bg-marca-50 font-medium text-marca-800"
                : "border-stone-300 bg-white text-stone-700 hover:bg-stone-50",
            )}
          >
            {marcado(nome) && <Check className="h-3.5 w-3.5" />}
            {nome}
          </button>
        ))}
      </div>

      <div className="flex items-end gap-2">
        <Rotulo texto="Outro material" className="flex-1">
          <Campo
            value={outro}
            onChange={(e) => setOutro(e.target.value)}
            onKeyDown={(e) => {
              // Enter inclui o item em vez de avançar o passo
              if (e.key === "Enter") {
                e.preventDefault();
                incluirOutro();
              }
            }}
            placeholder="Ex.: lanterna"
            autoComplete="off"
            data-conferir=""
          />
        </Rotulo>
        <Botao type="button" variante="secundario" onClick={incluirOutro}>
          Incluir
        </Botao>
      </div>

      {itens.length > 0 && (
        <ul className="divide-y divide-stone-100 rounded-lg border border-stone-200">
          {itens.map((i) => (
            <li key={i.item} className="flex items-center gap-2 px-3 py-2 text-sm">
              <span className="min-w-0 flex-1">{i.item}</span>
              <button
                type="button"
                onClick={() => mudarQuantidade(i.item, -1)}
                className="rounded-lg border border-stone-300 p-1.5 hover:bg-stone-50"
                aria-label="Menos um"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-8 text-center font-semibold tabular-nums">{i.quantidade}</span>
              <button
                type="button"
                onClick={() => mudarQuantidade(i.item, 1)}
                className="rounded-lg border border-stone-300 p-1.5 hover:bg-stone-50"
                aria-label="Mais um"
              >
                <Plus className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => alternar(i.item)}
                className="rounded-lg p-1.5 text-stone-500 hover:bg-stone-100"
                aria-label="Tirar"
              >
                <X className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

/**
 * Lança a entrega dos materiais de segurança: o que foi e quando. O nº do CA é
 * de cada material, então não entra aqui: a coluna sai em branco na ficha
 * impressa, para escrever à mão.
 */
export function FormEpi({
  acao,
  hoje,
}: {
  acao: (anterior: Resultado, dados: FormData) => Promise<Resultado>;
  hoje: string;
}) {
  const [itens, setItens] = useState<Item[]>([]);
  return (
    <Assistente acao={acao} textoBotao="Lançar entrega" limparAoSalvar aoSalvar={() => setItens([])}>
      <Passo titulo="O que foi entregue" dica="Toque nos materiais entregues. Use + e − para a quantidade.">
        <EscolherEpis itens={itens} aoMudar={setItens} />
      </Passo>
      <Passo titulo="Data da entrega">
        <Rotulo texto="Data da entrega">
          <Campo name="data" type="date" max={hoje} defaultValue={hoje} required />
        </Rotulo>
        <Rotulo texto="Observação (opcional)">
          <Campo name="observacao" autoComplete="off" placeholder="Ex.: troca da luva rasgada" />
        </Rotulo>
      </Passo>
    </Assistente>
  );
}
