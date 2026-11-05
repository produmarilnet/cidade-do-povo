import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Pencil } from "lucide-react";
import { exigirUsuario } from "@/lib/auth";
import { sql } from "@/lib/db";
import { pode } from "@/lib/permissoes";
import { COR_SITUACAO, NOME_SITUACAO, numeroDaOrdem } from "@/lib/iluminacao";
import { numeroDoPoste } from "@/lib/postes";
import type { MaterialDaOrdem, OrdemServico, SaldoMaterial } from "@/lib/types";
import { hoje } from "@/lib/utils";
import { BotaoAcao } from "@/components/formulario";
import { BotaoImprimir } from "@/components/imprimir";
import { Aviso, Cartao, Etiqueta, classeBotao } from "@/components/ui";
import { cancelarOrdem, reabrirOrdem, registrarExecucao } from "../actions";
import { Ficha } from "./ficha";
import { FormExecucao } from "./form-execucao";

export default async function OrdemPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { nova?: string };
}) {
  const eu = await exigirUsuario("verIluminacao");
  // id que não é uuid faz o banco reclamar: trata como ordem que não existe.
  const [ordem] = await sql<(OrdemServico & { poste_numero: number | null })[]>`
    select o.*, p.numero as poste_numero
    from ordens_servico o left join postes p on p.id = o.poste_id
    where o.id = ${params.id}`.catch(() => []);
  if (!ordem) notFound();

  const podeAbrir = pode(eu.papel, "abrirOrdens");
  const podeRegistrar = pode(eu.papel, "registrarExecucao") && ordem.situacao !== "cancelada";

  const materiaisDaOrdem = await sql<MaterialDaOrdem[]>`
    select material_id, descricao, quantidade, unidade
    from ordem_materiais where ordem_id = ${ordem.id}
    order by posicao`;
  // o banco de materiais já com o saldo do estoque de cada um
  const materiais = podeRegistrar
    ? await sql<SaldoMaterial[]>`select * from v_estoque where ativo order by ordem, nome`
    : [];
  const saldos: Record<string, number> = Object.fromEntries(materiais.map((m) => [m.id, m.saldo]));
  // corrigindo a baixa: o que esta ordem já gastou está descontado do saldo e
  // volta para a conta (senão ela "não teria" o próprio material)
  if (ordem.situacao === "executada") {
    for (const m of materiaisDaOrdem) {
      if (m.material_id) saldos[m.material_id] = Math.round(((saldos[m.material_id] ?? 0) + m.quantidade) * 100) / 100;
    }
  }

  const eletricistas = podeRegistrar
    ? (
        await sql<{ nome: string }[]>`
          select nome from usuarios where papel = 'eletricista' and ativo
          union
          select distinct eletricista from ordens_servico where eletricista is not null
          order by 1`
      ).map((l) => l.nome)
    : [];
  const equipes = podeRegistrar
    ? (
        await sql<{ equipe: string }[]>`
          select equipe from ordens_servico where equipe is not null
          group by equipe order by count(*) desc, equipe`
      ).map((l) => l.equipe)
    : [];

  return (
    <>
      {/* Folha A4, sem o cabeçalho e o rodapé do navegador; a ficha ocupa a metade de cima. */}
      <style>{`@page { size: A4; margin: 8mm 10mm; }`}</style>

      <div className="print:hidden">
        <Link href="/iluminacao" className="mb-2 inline-flex items-center gap-1 text-sm text-stone-500 hover:text-stone-800">
          <ChevronLeft className="h-4 w-4" />
          Ordens de serviço
        </Link>
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <h1 className="mr-auto text-xl font-semibold">
            Ordem nº {numeroDaOrdem(ordem.numero)}{" "}
            <Etiqueta cor={COR_SITUACAO[ordem.situacao]}>{NOME_SITUACAO[ordem.situacao]}</Etiqueta>
          </h1>
          {ordem.poste_numero !== null && (
            <Link href={`/postes/${ordem.poste_numero}`} className={classeBotao("secundario")}>
              Poste {numeroDoPoste(ordem.poste_numero)}
            </Link>
          )}
          <BotaoImprimir texto="Imprimir ficha" />
          {podeAbrir && (
            <Link href={`/iluminacao/${ordem.id}/editar`} className={classeBotao("secundario")}>
              <Pencil className="h-4 w-4" />
              Corrigir pedido
            </Link>
          )}
        </div>
        {searchParams.nova && ordem.situacao === "aberta" && (
          <div className="mb-4">
            <Aviso tipo="ok">Ordem aberta. Imprima a ficha e entregue ao eletricista.</Aviso>
          </div>
        )}
      </div>

      <Cartao className="mb-6 p-6 print:border-0 print:p-0 print:shadow-none">
        <Ficha ordem={ordem} materiais={materiaisDaOrdem} posteNumero={ordem.poste_numero} />
      </Cartao>

      <div className="flex flex-col gap-4 print:hidden">
        {podeRegistrar && (
          <Cartao className="max-w-xl">
            <h2 className="mb-1 font-semibold">
              {ordem.situacao === "executada" ? "Serviço registrado" : "Registrar o serviço feito"}
            </h2>
            {ordem.situacao === "aberta" && (
              <p className="mb-3 text-sm text-stone-500">Quando a ficha voltar da rua, passe para cá o que o eletricista escreveu.</p>
            )}
            <FormExecucao
              key={ordem.situacao}
              ordem={ordem}
              acao={registrarExecucao.bind(null, ordem.id)}
              eletricistas={eletricistas}
              equipes={equipes}
              materiais={materiais}
              materiaisDaOrdem={materiaisDaOrdem}
              saldos={saldos}
              hoje={hoje()}
            />
          </Cartao>
        )}

        {podeAbrir && (
          <div className="flex flex-wrap gap-2">
            {ordem.situacao === "aberta" && (
              <BotaoAcao
                acao={cancelarOrdem.bind(null, ordem.id)}
                confirmar={`Cancelar a ordem nº ${numeroDaOrdem(ordem.numero)}?`}
                variante="fantasma"
                className="text-red-700"
              >
                Cancelar ordem
              </BotaoAcao>
            )}
            {ordem.situacao !== "aberta" && (
              <BotaoAcao
                acao={reabrirOrdem.bind(null, ordem.id)}
                confirmar={`Reabrir a ordem nº ${numeroDaOrdem(ordem.numero)}? Ela volta para a lista de abertas.`}
                variante="fantasma"
              >
                Reabrir ordem
              </BotaoAcao>
            )}
          </div>
        )}
      </div>
    </>
  );
}
