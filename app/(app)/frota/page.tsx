import Link from "next/link";
import { Car, ChevronRight, Plus } from "lucide-react";
import { exigirUsuario } from "@/lib/auth";
import { pode } from "@/lib/permissoes";
import { situacaoDaProxima, textoKm } from "@/lib/frota";
import { formatarData, hoje } from "@/lib/utils";
import { Cartao, Etiqueta, Titulo, classeBotao } from "@/components/ui";
import { veiculosComResumo } from "./resumo";

/** A frota: cada veículo com o km, a próxima manutenção e o último checklist. */
export default async function FrotaPage() {
  const eu = await exigirUsuario("verFrota");
  const dia = hoje();
  const veiculos = await veiculosComResumo();
  const ativos = veiculos.filter((v) => v.ativo);
  const vencidas = ativos.filter((v) => situacaoDaProxima(v, v.km_atual, dia) === "vencida").length;

  return (
    <>
      <Titulo
        acao={
          pode(eu.papel, "gerenciarFrota") && (
            <Link href="/frota/novo" className={classeBotao()}>
              <Plus className="h-4 w-4" />
              Novo veículo
            </Link>
          )
        }
      >
        Frota
      </Titulo>
      <p className="-mt-2 mb-4 text-sm text-stone-500">
        {ativos.length} {ativos.length === 1 ? "veículo" : "veículos"} em uso
        {vencidas > 0 && <span className="text-red-700"> · {vencidas} com manutenção vencida</span>}. Toque no veículo
        para ver as manutenções e os checklists.
      </p>

      <Cartao className="p-0">
        {veiculos.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-stone-500">Nenhum veículo cadastrado ainda.</p>
        ) : (
          <ul className="divide-y divide-stone-100">
            {veiculos.map((v) => {
              const proxima = v.ativo ? situacaoDaProxima(v, v.km_atual, dia) : null;
              return (
                <li key={v.id}>
                  <Link href={`/frota/${v.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-stone-50">
                    <Car className={v.ativo ? "h-5 w-5 shrink-0 text-marca-600" : "h-5 w-5 shrink-0 text-stone-300"} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={v.ativo ? "font-medium" : "text-stone-400"}>{v.modelo}</span>
                        <span className="rounded border border-stone-300 px-1.5 font-mono text-xs tracking-wide">
                          {v.placa}
                        </span>
                        {!v.ativo && <Etiqueta cor="cinza">Fora da frota</Etiqueta>}
                        {proxima === "vencida" && <Etiqueta cor="vermelho">Manutenção vencida</Etiqueta>}
                        {proxima === "perto" && <Etiqueta cor="amarelo">Manutenção chegando</Etiqueta>}
                        {v.ativo && (v.ultimo_checklist_problemas ?? 0) > 0 && (
                          <Etiqueta cor="vermelho">
                            Checklist: {v.ultimo_checklist_problemas}{" "}
                            {v.ultimo_checklist_problemas === 1 ? "problema" : "problemas"}
                          </Etiqueta>
                        )}
                      </div>
                      <div className="text-sm text-stone-500">
                        {[
                          v.tipo,
                          v.km_atual > 0 && textoKm(v.km_atual),
                          v.ultimo_checklist ? `checklist ${formatarData(v.ultimo_checklist)}` : "sem checklist",
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 shrink-0 text-stone-400" />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </Cartao>
    </>
  );
}
