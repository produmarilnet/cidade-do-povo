import Link from "next/link";
import { ChevronLeft, Pencil } from "lucide-react";
import { exigirUsuario } from "@/lib/auth";
import { sql } from "@/lib/db";
import { pode } from "@/lib/permissoes";
import type { Material } from "@/lib/types";
import { Assistente } from "@/components/assistente";
import { BotaoAcao } from "@/components/formulario";
import { Cartao, Etiqueta, Titulo } from "@/components/ui";
import { ativarMaterial, incluirMaterial } from "./actions";
import { CamposMaterial } from "./campos-material";

/**
 * O banco de materiais: a lista que aparece na baixa da ordem de serviço para
 * escolher com um toque. Quem atende inclui o que faltar e desativa o que
 * saiu de uso.
 */
export default async function MateriaisPage() {
  const eu = await exigirUsuario("verIluminacao");
  const podeMexer = pode(eu.papel, "gerenciarMateriais");

  const materiais = await sql<(Material & { usos: number })[]>`
    select m.*, (select count(*)::int from ordem_materiais o where o.material_id = m.id) as usos
    from materiais m
    order by m.ativo desc, m.ordem, m.nome`;
  const ativos = materiais.filter((m) => m.ativo).length;

  return (
    <>
      <Link href="/iluminacao" className="mb-2 inline-flex items-center gap-1 text-sm text-stone-500 hover:text-stone-800">
        <ChevronLeft className="h-4 w-4" />
        Ordens de serviço
      </Link>
      <Titulo>Banco de materiais</Titulo>
      <p className="-mt-2 mb-4 text-sm text-stone-500">
        É a lista que aparece na baixa da ordem, quando a ficha volta da rua. {ativos} materiais em uso.
      </p>

      <div className="flex flex-col gap-4">
        {podeMexer && (
          <Cartao className="max-w-xl">
            <h2 className="mb-3 font-semibold">Incluir material</h2>
            <Assistente acao={incluirMaterial} textoBotao="Incluir no banco" limparAoSalvar>
              <CamposMaterial />
            </Assistente>
          </Cartao>
        )}

        <Cartao className="p-0">
          <ul className="divide-y divide-stone-100">
            {materiais.map((m) => (
              <li key={m.id} className="flex flex-wrap items-center gap-2 px-4 py-2.5">
                <div className="min-w-0 flex-1">
                  <span className={m.ativo ? "font-medium" : "text-stone-400 line-through"}>{m.nome}</span>
                  <span className="ml-2 text-xs text-stone-500">{m.unidade === "m" ? "por metro" : "por peça"}</span>
                  {m.usos > 0 && (
                    <span className="ml-2 text-xs text-stone-400">
                      · em {m.usos} {m.usos === 1 ? "ordem" : "ordens"}
                    </span>
                  )}
                </div>
                {!m.ativo && <Etiqueta cor="cinza">Desativado</Etiqueta>}
                {podeMexer && (
                  <>
                    <Link
                      href={`/iluminacao/materiais/${m.id}`}
                      className="inline-flex h-9 items-center gap-1 rounded-lg px-3 text-sm text-stone-600 hover:bg-stone-100"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Alterar
                    </Link>
                    <BotaoAcao
                      acao={ativarMaterial.bind(null, m.id, !m.ativo)}
                      variante="fantasma"
                      className="h-9"
                      confirmar={m.ativo ? `Desativar "${m.nome}"? Ele some da baixa das ordens.` : undefined}
                    >
                      {m.ativo ? "Desativar" : "Ativar"}
                    </BotaoAcao>
                  </>
                )}
              </li>
            ))}
          </ul>
        </Cartao>
      </div>
    </>
  );
}
