import Link from "next/link";
import { Lightbulb, Plus } from "lucide-react";
import { exigirUsuario } from "@/lib/auth";
import { sql } from "@/lib/db";
import { pode } from "@/lib/permissoes";
import { Aviso, Cartao, Titulo, classeBotao } from "@/components/ui";

export default async function PainelPage({ searchParams }: { searchParams: { "sem-permissao"?: string } }) {
  const eu = await exigirUsuario();
  const verIluminacao = pode(eu.papel, "verIluminacao");

  const [n] = verIluminacao
    ? await sql<{ abertas: number; atrasadas: number; executadas_mes: number }[]>`
        select
          count(*) filter (where situacao = 'aberta')::int as abertas,
          count(*) filter (where situacao = 'aberta' and criado_em < now() - interval '7 days')::int as atrasadas,
          count(*) filter (
            where situacao = 'executada'
              and date_trunc('month', data_execucao) = date_trunc('month', (now() at time zone 'America/Sao_Paulo')::date)
          )::int as executadas_mes
        from ordens_servico`
    : [];

  return (
    <>
      <Titulo>Olá, {eu.nome.split(" ")[0]}</Titulo>
      {searchParams["sem-permissao"] && (
        <div className="mb-4">
          <Aviso>Seu usuário não tem acesso a essa tela.</Aviso>
        </div>
      )}

      {n && (
        <Cartao>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <Lightbulb className="h-5 w-5 text-amber-500" />
            <h2 className="mr-auto font-semibold">Iluminação pública</h2>
            {pode(eu.papel, "abrirOrdens") && (
              <Link href="/iluminacao/nova" className={classeBotao()}>
                <Plus className="h-4 w-4" />
                Nova ordem
              </Link>
            )}
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Numero href="/iluminacao?situacao=aberta" valor={n.abertas} texto="ordens abertas" />
            <Numero
              href="/iluminacao?situacao=aberta"
              valor={n.atrasadas}
              texto="abertas há mais de 7 dias"
              alerta={n.atrasadas > 0}
            />
            <Numero href="/iluminacao?situacao=executada" valor={n.executadas_mes} texto="executadas este mês" />
          </div>
        </Cartao>
      )}
    </>
  );
}

function Numero({ href, valor, texto, alerta }: { href: string; valor: number; texto: string; alerta?: boolean }) {
  return (
    <Link href={href} className="rounded-lg border border-stone-200 px-4 py-3 hover:bg-stone-50">
      <div className={alerta ? "text-2xl font-semibold text-red-700" : "text-2xl font-semibold"}>{valor}</div>
      <div className="text-sm text-stone-500">{texto}</div>
    </Link>
  );
}
