import { Marca } from "@/components/marca";
import { dataHoraDaFicha, numeroDaOrdem } from "@/lib/iluminacao";
import type { OrdemServico } from "@/lib/types";
import { cn, formatarData } from "@/lib/utils";

// ── Ficha de atendimento ───────────────────────────────────────────────────
//
// A mesma ficha aparece na tela e sai na impressão (A4). Em cima, o pedido.
// Embaixo, o espaço com linhas para o eletricista preencher na rua — se a
// execução já foi registrada, o que foi passado para o sistema sai no lugar
// das linhas em branco.

function Dado({ rotulo, valor, className }: { rotulo: string; valor: string | null; className?: string }) {
  return (
    <div className={cn("border-b border-stone-300 px-2 py-1.5", className)}>
      <div className="text-[11px] font-semibold uppercase tracking-wide text-stone-500">{rotulo}</div>
      <div className="min-h-[1.25rem] whitespace-pre-line break-words text-sm font-medium text-stone-900">
        {valor || "—"}
      </div>
    </div>
  );
}

/** Linhas para escrever à mão. Com valor, o texto sai escrito em cima delas. */
function Linhas({ rotulo, linhas, valor }: { rotulo: string; linhas: number; valor?: string | null }) {
  return (
    <div className="mt-3">
      <div className="text-xs font-semibold uppercase tracking-wide text-stone-600">{rotulo}</div>
      {valor ? (
        <div className="mt-1 whitespace-pre-line break-words border-b border-stone-400 pb-1 text-sm leading-8">{valor}</div>
      ) : (
        Array.from({ length: linhas }, (_, i) => <div key={i} className="h-8 border-b border-stone-400" />)
      )}
    </div>
  );
}

export function Ficha({ ordem }: { ordem: OrdemServico }) {
  const executada = ordem.situacao === "executada";
  return (
    <article className="ficha bg-white text-stone-900">
      <header className="flex items-start justify-between gap-4 border-b-2 border-stone-800 pb-3">
        <Marca />
        <div className="text-right">
          <div className="text-xs font-semibold uppercase tracking-wide text-stone-500">Iluminação pública</div>
          <div className="text-lg font-bold leading-tight">Ordem de serviço</div>
          <div className="text-xl font-bold tabular-nums">Nº {numeroDaOrdem(ordem.numero)}</div>
        </div>
      </header>

      <div className="mt-2 text-sm">
        <span className="text-stone-500">Data: </span>
        <span className="font-medium">{dataHoraDaFicha(ordem.criado_em)}</span>
        {ordem.situacao === "cancelada" && (
          <span className="ml-3 rounded border border-red-600 px-2 py-0.5 text-xs font-bold uppercase text-red-700">
            Cancelada
          </span>
        )}
      </div>

      <section className="mt-3 rounded border border-stone-300">
        <div className="grid grid-cols-3">
          <Dado rotulo="Nome" valor={ordem.nome} className="col-span-2 border-r" />
          <Dado rotulo="Apelido" valor={ordem.apelido} />
          <Dado rotulo="Endereço" valor={ordem.endereco} className="col-span-2 border-r" />
          <Dado rotulo="Número da casa" valor={ordem.numero_casa} />
          <Dado rotulo="Ponto de referência" valor={ordem.ponto_referencia} className="col-span-2 border-r" />
          <Dado rotulo="Telefone" valor={ordem.telefone} />
          <Dado rotulo="Serviço solicitado" valor={ordem.servico} className="col-span-3" />
          <Dado rotulo="Atendente" valor={ordem.atendente} className="col-span-3 border-b-0" />
        </div>
      </section>

      <section className="mt-5 rounded border-2 border-stone-800 p-3">
        <h2 className="text-sm font-bold uppercase tracking-wide">Execução do serviço</h2>
        {!executada && <p className="text-xs text-stone-500">Preencher na rua e devolver a ficha.</p>}

        <div className="grid grid-cols-3 gap-x-6">
          <div className="col-span-2">
            <Linhas rotulo="Eletricista executor" linhas={1} valor={ordem.eletricista} />
          </div>
          <div>
            <div className="mt-3 text-xs font-semibold uppercase tracking-wide text-stone-600">Data</div>
            {executada && ordem.data_execucao ? (
              <div className="border-b border-stone-400 pb-1 text-sm leading-8">{formatarData(ordem.data_execucao)}</div>
            ) : (
              <div className="flex h-8 items-end gap-1 border-b border-stone-400 pb-0.5 text-stone-400">
                <span className="flex-1" />/<span className="flex-1" />/<span className="flex-[2]" />
              </div>
            )}
          </div>
        </div>
        <Linhas rotulo="Material aplicado" linhas={5} valor={executada ? ordem.material : null} />
        <Linhas rotulo="Observações extras" linhas={4} valor={executada ? ordem.observacoes : null} />
      </section>
    </article>
  );
}
