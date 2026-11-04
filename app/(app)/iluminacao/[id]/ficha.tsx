import { Marca } from "@/components/marca";
import { dataHoraDaFicha, numeroDaOrdem, quantidadeComUnidade } from "@/lib/iluminacao";
import type { MaterialDaOrdem, OrdemServico } from "@/lib/types";
import { cn, formatarData } from "@/lib/utils";

// ── Ficha de atendimento ───────────────────────────────────────────────────
//
// A mesma ficha aparece na tela e sai na impressão. Ela cabe em MEIA folha A4
// (o setor pediu: a folha inteira era papel demais) — sai na metade de cima,
// com a linha de corte embaixo. Em cima, o pedido. Embaixo, o espaço com linhas
// para o eletricista preencher na rua — se a execução já foi registrada, o que
// foi passado para o sistema sai no lugar das linhas em branco.

function Dado({ rotulo, valor, className }: { rotulo: string; valor: string | null; className?: string }) {
  return (
    <div className={cn("border-b border-stone-300 px-1.5 py-0.5", className)}>
      <div className="text-[9px] font-semibold uppercase leading-tight tracking-wide text-stone-500">{rotulo}</div>
      <div className="min-h-[1rem] whitespace-pre-line break-words text-[13px] font-medium leading-snug text-stone-900">
        {valor || "—"}
      </div>
    </div>
  );
}

function RotuloExecucao({ children }: { children: string }) {
  return <div className="text-[10px] font-semibold uppercase tracking-wide text-stone-600">{children}</div>;
}

/** Linhas para escrever à mão. Com valor, o texto sai escrito em cima delas. */
function Linhas({ rotulo, linhas, valor }: { rotulo: string; linhas: number; valor?: string | null }) {
  return (
    <div className="mt-1.5">
      <RotuloExecucao>{rotulo}</RotuloExecucao>
      {valor ? (
        <div className="whitespace-pre-line break-words border-b border-stone-400 text-[13px] leading-6">{valor}</div>
      ) : (
        Array.from({ length: linhas }, (_, i) => <div key={i} className="h-6 border-b border-stone-400" />)
      )}
    </div>
  );
}

/**
 * Material aplicado. Em branco: duas colunas de "Qtd | Material" para escrever.
 * Registrado: a lista do que foi usado, também em duas colunas.
 */
function Materiais({ itens, texto }: { itens: MaterialDaOrdem[] | null; texto: string | null }) {
  // itens = null: a ordem ainda não foi baixada, vai com as linhas em branco
  const registrado = itens !== null;
  return (
    <div className="mt-1.5">
      <RotuloExecucao>Material aplicado</RotuloExecucao>
      {registrado ? (
        <>
          {itens.length === 0 && !texto && (
            <div className="border-b border-stone-400 text-[13px] leading-6 text-stone-500">Nenhum material</div>
          )}
          {itens.length > 0 && (
            <ul className="grid grid-cols-2 gap-x-4 border-b border-stone-400 text-[13px] leading-6">
              {itens.map((m, i) => (
                <li key={i} className="flex gap-2">
                  <span className="w-12 shrink-0 text-right tabular-nums">{quantidadeComUnidade(m.quantidade, m.unidade)}</span>
                  <span className="min-w-0 break-words">{m.descricao}</span>
                </li>
              ))}
            </ul>
          )}
          {texto && <div className="whitespace-pre-line break-words border-b border-stone-400 text-[13px] leading-6">{texto}</div>}
        </>
      ) : (
        <div className="grid grid-cols-2 gap-x-4">
          {[0, 1].map((coluna) => (
            <div key={coluna}>
              <div className="flex gap-2 text-[9px] uppercase text-stone-400">
                <span className="w-10">Qtd</span>
                <span>Material</span>
              </div>
              {Array.from({ length: 4 }, (_, i) => (
                <div key={i} className="flex h-6 gap-2">
                  <span className="w-10 border-b border-stone-400" />
                  <span className="flex-1 border-b border-stone-400" />
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function Ficha({ ordem, materiais }: { ordem: OrdemServico; materiais: MaterialDaOrdem[] }) {
  const executada = ordem.situacao === "executada";
  return (
    <article className="ficha bg-white text-stone-900">
      <header className="flex items-center justify-between gap-4 border-b-2 border-stone-800 pb-1.5">
        <div className="origin-left scale-90">
          <Marca />
        </div>
        <div className="text-right leading-tight">
          <div className="text-[10px] font-semibold uppercase tracking-wide text-stone-500">
            Iluminação pública · Ordem de serviço
          </div>
          <div className="text-lg font-bold tabular-nums">Nº {numeroDaOrdem(ordem.numero)}</div>
          <div className="text-xs">
            <span className="text-stone-500">Data: </span>
            <span className="font-medium">{dataHoraDaFicha(ordem.criado_em)}</span>
          </div>
        </div>
      </header>

      {ordem.situacao === "cancelada" && (
        <div className="mt-1 inline-block rounded border border-red-600 px-2 py-0.5 text-xs font-bold uppercase text-red-700">
          Cancelada
        </div>
      )}

      <section className="mt-1.5 rounded border border-stone-300">
        <div className="grid grid-cols-4">
          <Dado rotulo="Nome" valor={ordem.nome} className="col-span-2 border-r" />
          <Dado rotulo="Apelido" valor={ordem.apelido} className="border-r" />
          <Dado rotulo="Telefone" valor={ordem.telefone} />
          <Dado rotulo="Endereço" valor={ordem.endereco} className="col-span-2 border-r" />
          <Dado rotulo="Localidade" valor={ordem.localidade} className="border-r" />
          <Dado rotulo="Nº da casa" valor={ordem.numero_casa} />
          <Dado rotulo="Ponto de referência" valor={ordem.ponto_referencia} className="col-span-3 border-r" />
          <Dado rotulo="Atendente" valor={ordem.atendente} />
          <Dado rotulo="Serviço solicitado" valor={ordem.servico} className="col-span-4 border-b-0" />
        </div>
      </section>

      <section className="mt-2 rounded border-2 border-stone-800 px-2.5 pb-2 pt-1.5">
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="text-xs font-bold uppercase tracking-wide">Execução do serviço</h2>
          {!executada && <p className="text-[10px] text-stone-500">Preencher na rua e devolver a ficha.</p>}
        </div>

        <div className="grid grid-cols-4 gap-x-4">
          <div className="col-span-2">
            <Linhas rotulo="Eletricista executor" linhas={1} valor={ordem.eletricista} />
          </div>
          <Linhas rotulo="Equipe" linhas={1} valor={executada ? ordem.equipe || "—" : null} />
          <div className="mt-1.5">
            <RotuloExecucao>Data</RotuloExecucao>
            {executada && ordem.data_execucao ? (
              <div className="border-b border-stone-400 text-[13px] leading-6">{formatarData(ordem.data_execucao)}</div>
            ) : (
              <div className="flex h-6 items-end gap-1 border-b border-stone-400 text-stone-400">
                <span className="flex-1" />/<span className="flex-1" />/<span className="flex-[2]" />
              </div>
            )}
          </div>
        </div>
        <Materiais itens={executada ? materiais : null} texto={executada ? ordem.material : null} />
        <Linhas rotulo="Observações extras" linhas={2} valor={executada ? ordem.observacoes : null} />
      </section>

      {/* só no papel: onde passar a tesoura (ou dobrar) para ficar com meia folha */}
      <div className="mt-3 hidden items-center gap-2 text-[9px] uppercase tracking-widest text-stone-400 print:flex">
        <span className="flex-1 border-t border-dashed border-stone-400" />
        corte aqui
        <span className="flex-1 border-t border-dashed border-stone-400" />
      </div>
    </article>
  );
}
