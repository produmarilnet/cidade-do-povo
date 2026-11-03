import Link from "next/link";
import { ArrowDownToLine, ClipboardList, Package, Search } from "lucide-react";
import { exigirUsuario } from "@/lib/auth";
import { sql } from "@/lib/db";
import { pode } from "@/lib/permissoes";
import { situacaoDoEstoque, type SituacaoEstoque } from "@/lib/estoque";
import { quantidadeComUnidade } from "@/lib/iluminacao";
import type { SaldoMaterial } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Cartao, Titulo, classeBotao } from "@/components/ui";

const FILTROS: { valor: SituacaoEstoque | "todos"; texto: string }[] = [
  { valor: "todos", texto: "Todos" },
  { valor: "baixo", texto: "Acabando" },
  { valor: "sem", texto: "Sem estoque" },
];

/**
 * O estoque: quanto tem de cada material. Entra pela nota ("Dar entrada"),
 * sai sozinho pela baixa das ordens de serviço executadas.
 */
export default async function EstoquePage({ searchParams }: { searchParams: { ver?: string; busca?: string } }) {
  const eu = await exigirUsuario("verEstoque");
  const podeMovimentar = pode(eu.papel, "movimentarEstoque");
  const ver = FILTROS.some((f) => f.valor === searchParams.ver) ? (searchParams.ver as SituacaoEstoque) : "todos";
  const busca = (searchParams.busca ?? "").trim();

  const todos = await sql<SaldoMaterial[]>`select * from v_estoque where ativo order by ordem, nome`;
  const quantos = (s: SituacaoEstoque | "todos") =>
    s === "todos" ? todos.length : todos.filter((m) => situacaoDoEstoque(m) === s).length;
  const semAcento = (t: string) => t.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
  const lista = todos
    .filter((m) => ver === "todos" || situacaoDoEstoque(m) === ver)
    .filter((m) => !busca || semAcento(m.nome).includes(semAcento(busca)));

  const link = (v: string) => `/estoque?ver=${v}${busca ? `&busca=${encodeURIComponent(busca)}` : ""}`;

  return (
    <>
      <Titulo
        acao={
          <div className="flex flex-wrap gap-2">
            <Link href="/estoque/entradas" className={classeBotao("secundario")}>
              <ClipboardList className="h-4 w-4" />
              Entradas
            </Link>
            {podeMovimentar && (
              <Link href="/estoque/entrada" className={classeBotao()}>
                <ArrowDownToLine className="h-4 w-4" />
                Dar entrada
              </Link>
            )}
          </div>
        }
      >
        Estoque de materiais
      </Titulo>
      <p className="-mt-2 mb-4 text-sm text-stone-500">
        O material entra pela nota e sai sozinho quando a ordem de serviço é dada como executada.
      </p>

      <div className="mb-3 flex flex-wrap gap-1">
        {FILTROS.map((f) => (
          <Link
            key={f.valor}
            href={link(f.valor)}
            className={cn(
              "rounded-full px-3 py-1.5 text-sm",
              ver === f.valor
                ? "bg-marca-600 font-medium text-white"
                : "bg-white text-stone-700 ring-1 ring-stone-200 hover:bg-stone-50",
            )}
          >
            {f.texto} <span className="opacity-70">{quantos(f.valor)}</span>
          </Link>
        ))}
      </div>

      <form className="mb-4 flex gap-2">
        <input type="hidden" name="ver" value={ver} />
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
          <input
            name="busca"
            defaultValue={busca}
            placeholder="Procurar material"
            className="h-10 w-full rounded-lg border border-stone-300 bg-white pl-9 pr-3 text-base text-stone-900 focus:border-marca-500 focus:outline-none focus:ring-2 focus:ring-marca-200 sm:text-sm"
          />
        </div>
        <button className={classeBotao("secundario")}>Buscar</button>
      </form>

      {lista.length === 0 ? (
        <Cartao className="text-center text-sm text-stone-500">
          {busca ? "Nenhum material com esse nome." : "Nenhum material aqui."}
        </Cartao>
      ) : (
        <Cartao className="p-0">
          <ul className="divide-y divide-stone-100">
            {lista.map((m) => {
              const s = situacaoDoEstoque(m);
              return (
                <li key={m.id}>
                  <Link href={`/estoque/${m.id}`} className="flex items-center gap-3 px-4 py-2.5 hover:bg-stone-50">
                    <Package className="h-4 w-4 shrink-0 text-stone-400" />
                    <div className="min-w-0 flex-1">
                      <div className="font-medium">{m.nome}</div>
                      {m.estoque_minimo > 0 && (
                        <div className="text-xs text-stone-500">
                          mínimo {quantidadeComUnidade(m.estoque_minimo, m.unidade)}
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <div
                        className={cn(
                          "font-semibold tabular-nums",
                          s === "sem" ? "text-red-700" : s === "baixo" ? "text-amber-700" : "text-stone-900",
                        )}
                      >
                        {quantidadeComUnidade(m.saldo, m.unidade)}
                      </div>
                      {s !== "ok" && (
                        <div className={cn("text-xs", s === "sem" ? "text-red-700" : "text-amber-700")}>
                          {s === "sem" ? (m.saldo < 0 ? "falta lançar entrada" : "sem estoque") : "acabando"}
                        </div>
                      )}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </Cartao>
      )}

      <p className="mt-4 text-sm text-stone-500">
        Falta algum material na lista?{" "}
        <Link href="/estoque/materiais" className="font-medium text-marca-700 hover:underline">
          Banco de materiais
        </Link>
      </p>
    </>
  );
}
