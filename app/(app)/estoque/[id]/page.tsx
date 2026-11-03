import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Pencil } from "lucide-react";
import { exigirUsuario } from "@/lib/auth";
import { sql } from "@/lib/db";
import { pode } from "@/lib/permissoes";
import { situacaoDoEstoque } from "@/lib/estoque";
import { numeroDaOrdem, quantidadeComUnidade } from "@/lib/iluminacao";
import type { SaldoMaterial } from "@/lib/types";
import { cn, formatarData, hoje } from "@/lib/utils";
import { Cartao, Etiqueta } from "@/components/ui";
import { acertarEstoque } from "../actions";
import { FormAcerto } from "./form-acerto";

type Movimento = {
  tipo: "entrada" | "saida" | "acerto";
  data: string;
  quantidade: number; // com sinal: entrada +, saída −, acerto ±
  ref: string; // id da entrada, da ordem ou do acerto
  numero: number | null; // nº da ordem
  texto: string | null; // fornecedor / endereço da ordem / motivo
  documento: string | null; // nº da nota
  contado: number | null;
  criado_em: Date;
};

/** O extrato do material: tudo o que entrou, saiu e foi acertado, com o saldo. */
export default async function MaterialEstoquePage({ params }: { params: { id: string } }) {
  const eu = await exigirUsuario("verEstoque");
  const [m] = await sql<SaldoMaterial[]>`select * from v_estoque where id = ${params.id}`.catch(() => []);
  if (!m) notFound();

  const movimentos = await sql<Movimento[]>`
    select 'entrada' as tipo, e.data, i.quantidade, e.id as ref, null::int as numero,
           e.fornecedor as texto, e.documento, null::numeric as contado, e.criado_em
    from estoque_entrada_itens i join estoque_entradas e on e.id = i.entrada_id
    where i.material_id = ${m.id}
    union all
    select 'saida', o.data_execucao, -om.quantidade, o.id, o.numero,
           o.endereco, null, null, o.atualizado_em
    from ordem_materiais om join ordens_servico o on o.id = om.ordem_id and o.situacao = 'executada'
    where om.material_id = ${m.id}
    union all
    select 'acerto', a.data, a.diferenca, a.id, null, a.motivo, null, a.contado, a.criado_em
    from estoque_acertos a
    where a.material_id = ${m.id}
    order by data, criado_em`;

  // o saldo depois de cada movimento, do mais antigo ao mais novo
  let corrente = 0;
  const linhas = movimentos.map((mv) => {
    corrente = Math.round((corrente + mv.quantidade) * 100) / 100;
    return { ...mv, saldo: corrente };
  });
  linhas.reverse(); // na tela, o mais novo em cima

  const s = situacaoDoEstoque(m);
  const q = (n: number) => quantidadeComUnidade(n, m.unidade);

  return (
    <>
      <Link href="/estoque" className="mb-2 inline-flex items-center gap-1 text-sm text-stone-500 hover:text-stone-800">
        <ChevronLeft className="h-4 w-4" />
        Estoque
      </Link>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <h1 className="mr-auto text-xl font-semibold">
          {m.nome} {!m.ativo && <Etiqueta cor="cinza">Desativado</Etiqueta>}
        </h1>
        {pode(eu.papel, "gerenciarMateriais") && (
          <Link
            href={`/estoque/materiais/${m.id}`}
            className="inline-flex h-9 items-center gap-1 rounded-lg px-3 text-sm text-stone-600 hover:bg-stone-100"
          >
            <Pencil className="h-3.5 w-3.5" />
            Alterar material
          </Link>
        )}
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Numero rotulo="Saldo" valor={q(m.saldo)} destaque={s === "sem" ? "vermelho" : s === "baixo" ? "amarelo" : undefined} />
        <Numero rotulo="Entrou" valor={q(m.entradas)} />
        <Numero rotulo="Saiu nas ordens" valor={q(m.saidas)} />
        <Numero rotulo="Acertos" valor={`${m.acertos > 0 ? "+" : ""}${q(m.acertos)}`} />
      </div>
      {m.saldo < 0 && (
        <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          Saiu mais do que entrou: falta lançar alguma entrada (ou acertar pela contagem).
        </p>
      )}
      {s === "baixo" && (
        <p className="mb-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Está acabando: o mínimo deste material é {q(m.estoque_minimo)}.
        </p>
      )}

      <div className="flex flex-col gap-4">
        {pode(eu.papel, "movimentarEstoque") && (
          <Cartao className="max-w-xl">
            <h2 className="mb-1 font-semibold">Acertar pela contagem</h2>
            <p className="mb-3 text-sm text-stone-500">
              Contou na prateleira e não bateu? Informe quanto tem de verdade: o sistema lança a diferença e o saldo
              fica igual ao contado.
            </p>
            <FormAcerto acao={acertarEstoque.bind(null, m.id)} unidade={m.unidade} hoje={hoje()} />
          </Cartao>
        )}

        <Cartao className="p-0">
          <h2 className="border-b border-stone-100 px-4 py-3 font-semibold">Movimentos</h2>
          {linhas.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-stone-500">Nada entrou nem saiu ainda.</p>
          ) : (
            <ul className="divide-y divide-stone-100">
              {linhas.map((l, i) => (
                <li key={`${l.tipo}-${l.ref}-${i}`} className="flex gap-3 px-4 py-2.5 text-sm">
                  <div className="w-20 shrink-0 tabular-nums text-stone-500">{formatarData(l.data)}</div>
                  <div className="min-w-0 flex-1">
                    {l.tipo === "entrada" && (
                      <Link href={`/estoque/entradas/${l.ref}`} className="hover:underline">
                        <span className="font-medium text-green-800">Entrada</span>
                        {l.texto && ` · ${l.texto}`}
                        {l.documento && <span className="text-stone-500"> · doc. {l.documento}</span>}
                      </Link>
                    )}
                    {l.tipo === "saida" && (
                      <Link href={`/iluminacao/${l.ref}`} className="hover:underline">
                        <span className="font-medium text-stone-800">Ordem nº {numeroDaOrdem(l.numero ?? 0)}</span>
                        {l.texto && <span className="text-stone-500"> · {l.texto}</span>}
                      </Link>
                    )}
                    {l.tipo === "acerto" && (
                      <span>
                        <span className="font-medium text-amber-800">Acerto pela contagem</span>
                        <span className="text-stone-500">
                          {" "}
                          · contado {q(l.contado ?? 0)} · {l.texto}
                        </span>
                      </span>
                    )}
                  </div>
                  <div className="w-20 shrink-0 text-right tabular-nums">
                    <div className={cn("font-medium", l.quantidade > 0 ? "text-green-800" : "text-stone-800")}>
                      {l.quantidade > 0 ? "+" : "−"}
                      {q(Math.abs(l.quantidade))}
                    </div>
                    <div className="text-xs text-stone-500">fica {q(l.saldo)}</div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Cartao>
      </div>
    </>
  );
}

function Numero({ rotulo, valor, destaque }: { rotulo: string; valor: string; destaque?: "vermelho" | "amarelo" }) {
  return (
    <div className="rounded-lg border border-stone-200 bg-white px-4 py-3">
      <div
        className={cn(
          "text-xl font-semibold tabular-nums",
          destaque === "vermelho" && "text-red-700",
          destaque === "amarelo" && "text-amber-700",
        )}
      >
        {valor}
      </div>
      <div className="text-sm text-stone-500">{rotulo}</div>
    </div>
  );
}
