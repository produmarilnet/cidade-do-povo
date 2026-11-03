"use client";

import { useMemo, useRef, useState } from "react";
import { Minus, Plus, Search, X } from "lucide-react";
import { quantidadeComUnidade } from "@/lib/iluminacao";
import type { Material, MaterialDaOrdem, UnidadeMaterial } from "@/lib/types";
import { cn } from "@/lib/utils";

// ── Material aplicado ──────────────────────────────────────────────────────
//
// O banco de materiais aparece em botões: um toque põe o material na lista com
// 1 unidade (ou 1 metro), outro toque soma mais um. Na lista dá para acertar a
// quantidade e tirar. "Outro material" abre uma linha para escrever o que não
// está no banco.
//
// O que foi escolhido vai para a server action num campo escondido, em JSON.

type Linha = MaterialDaOrdem & { chave: number };

const semAcento = (t: string) =>
  t
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

/** "1,5" ou "1.5" → 1.5; o que não for número vira 0. */
function lerQuantidade(texto: string): number {
  const n = Number(texto.replace(",", "."));
  return Number.isFinite(n) && n > 0 ? Math.round(n * 100) / 100 : 0;
}

export function EscolherMateriais({
  materiais,
  inicial,
}: {
  materiais: Material[];
  inicial: MaterialDaOrdem[];
}) {
  const [linhas, setLinhas] = useState<Linha[]>(() => inicial.map((m, i) => ({ ...m, chave: i })));
  const proxima = useRef(inicial.length);
  const [busca, setBusca] = useState("");
  // o texto da quantidade enquanto digita ("1," ainda não é número)
  const [digitando, setDigitando] = useState<Record<number, string>>({});

  const visiveis = useMemo(() => {
    const q = semAcento(busca.trim());
    return q ? materiais.filter((m) => semAcento(m.nome).includes(q)) : materiais;
  }, [materiais, busca]);

  function tocar(m: Material) {
    const chave = proxima.current++;
    setLinhas((atual) => {
      const ja = atual.find((l) => l.material_id === m.id);
      if (ja) return atual.map((l) => (l === ja ? { ...l, quantidade: l.quantidade + 1 } : l));
      return [...atual, { chave, material_id: m.id, descricao: m.nome, quantidade: 1, unidade: m.unidade }];
    });
    setDigitando({});
  }

  function outro() {
    const chave = proxima.current++;
    setLinhas((atual) => [...atual, { chave, material_id: null, descricao: "", quantidade: 1, unidade: "un" }]);
  }

  function mudar(chave: number, mudanca: Partial<MaterialDaOrdem>) {
    setLinhas((atual) => atual.map((l) => (l.chave === chave ? { ...l, ...mudanca } : l)));
  }

  function somar(l: Linha, passo: number) {
    mudar(l.chave, { quantidade: Math.max(1, Math.round((l.quantidade + passo) * 100) / 100) });
    setDigitando(({ [l.chave]: _, ...resto }) => resto);
  }

  function tirar(chave: number) {
    setLinhas((atual) => atual.filter((l) => l.chave !== chave));
  }

  // "outro" sem descrição ou com quantidade zerada não vai para o banco
  const validas = linhas.filter((l) => l.descricao.trim() && l.quantidade > 0);
  const resumo = validas.map((l) => `${quantidadeComUnidade(l.quantidade, l.unidade)} · ${l.descricao.trim()}`).join("\n");
  const escolhidos = new Set(linhas.map((l) => l.material_id));

  return (
    <div className="flex flex-col gap-3">
      <input
        type="hidden"
        name="materiais"
        value={JSON.stringify(validas.map(({ chave: _, ...m }) => ({ ...m, descricao: m.descricao.trim() })))}
        data-conferir="Material aplicado"
        data-texto={resumo || "Nenhum material"}
      />

      {linhas.length > 0 && (
        <ul className="divide-y divide-stone-100 rounded-lg border border-stone-200">
          {linhas.map((l) => (
            <li key={l.chave} className="flex flex-wrap items-center gap-2 px-3 py-2">
              {l.material_id ? (
                <span className="min-w-0 flex-1 text-sm font-medium">{l.descricao}</span>
              ) : (
                <input
                  value={l.descricao}
                  onChange={(e) => mudar(l.chave, { descricao: e.target.value })}
                  placeholder="Qual material?"
                  autoFocus
                  className="h-9 min-w-[10rem] flex-1 rounded-md border border-stone-300 px-2 text-base sm:text-sm"
                />
              )}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => somar(l, -1)}
                  aria-label="Menos um"
                  className="flex h-9 w-9 items-center justify-center rounded-md border border-stone-300 text-stone-600 hover:bg-stone-50"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <input
                  value={digitando[l.chave] ?? String(l.quantidade).replace(".", ",")}
                  onChange={(e) => {
                    const texto = e.target.value.replace(/[^\d,.]/g, "");
                    setDigitando((d) => ({ ...d, [l.chave]: texto }));
                    mudar(l.chave, { quantidade: lerQuantidade(texto) });
                  }}
                  inputMode="decimal"
                  aria-label="Quantidade"
                  className="h-9 w-14 rounded-md border border-stone-300 text-center text-base tabular-nums sm:text-sm"
                />
                <button
                  type="button"
                  onClick={() => somar(l, 1)}
                  aria-label="Mais um"
                  className="flex h-9 w-9 items-center justify-center rounded-md border border-stone-300 text-stone-600 hover:bg-stone-50"
                >
                  <Plus className="h-4 w-4" />
                </button>
                {l.material_id ? (
                  <span className="w-6 text-xs text-stone-500">{l.unidade}</span>
                ) : (
                  // o material de fora da lista pode ser peça ou metro
                  <select
                    value={l.unidade}
                    onChange={(e) => mudar(l.chave, { unidade: e.target.value as UnidadeMaterial })}
                    aria-label="Unidade"
                    className="h-9 rounded-md border border-stone-300 bg-white px-1 text-base sm:text-sm"
                  >
                    <option value="un">un</option>
                    <option value="m">m</option>
                  </select>
                )}
              </div>
              <button
                type="button"
                onClick={() => tirar(l.chave)}
                aria-label="Tirar da lista"
                className="flex h-9 w-9 items-center justify-center rounded-md text-stone-400 hover:bg-red-50 hover:text-red-700"
              >
                <X className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
        <input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Procurar material (ex.: relé, cabo, 100)"
          className="h-10 w-full rounded-lg border border-stone-300 bg-white pl-9 pr-3 text-base text-stone-900 focus:border-marca-500 focus:outline-none focus:ring-2 focus:ring-marca-200 sm:text-sm"
        />
      </div>

      <div className="flex max-h-72 flex-wrap gap-2 overflow-y-auto">
        {visiveis.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => tocar(m)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-sm",
              escolhidos.has(m.id)
                ? "border-marca-600 bg-marca-50 font-medium text-marca-800"
                : "border-stone-300 bg-white text-stone-700 hover:border-marca-400 hover:bg-marca-50",
            )}
          >
            {m.nome}
          </button>
        ))}
        <button
          type="button"
          onClick={outro}
          className="rounded-full border border-dashed border-stone-400 bg-white px-3 py-1.5 text-sm font-medium text-stone-700 hover:bg-stone-50"
        >
          + Outro material (especificar)
        </button>
        {visiveis.length === 0 && <p className="w-full text-sm text-stone-500">Nenhum material com esse nome no banco.</p>}
      </div>
    </div>
  );
}
