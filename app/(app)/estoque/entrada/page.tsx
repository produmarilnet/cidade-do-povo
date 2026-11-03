import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { exigirUsuario } from "@/lib/auth";
import { sql } from "@/lib/db";
import type { SaldoMaterial } from "@/lib/types";
import { hoje } from "@/lib/utils";
import { Cartao, Titulo } from "@/components/ui";
import { darEntrada } from "../actions";
import { FormEntrada } from "./form-entrada";

export default async function DarEntradaPage() {
  await exigirUsuario("movimentarEstoque");
  const materiais = await sql<SaldoMaterial[]>`select * from v_estoque where ativo order by ordem, nome`;
  const fornecedores = (
    await sql<{ fornecedor: string }[]>`
      select distinct fornecedor from estoque_entradas where fornecedor is not null order by 1`
  ).map((l) => l.fornecedor);

  return (
    <>
      <Link href="/estoque" className="mb-2 inline-flex items-center gap-1 text-sm text-stone-500 hover:text-stone-800">
        <ChevronLeft className="h-4 w-4" />
        Estoque
      </Link>
      <Titulo>Dar entrada no estoque</Titulo>
      <Cartao className="max-w-xl">
        <FormEntrada
          acao={darEntrada}
          materiais={materiais}
          saldos={Object.fromEntries(materiais.map((m) => [m.id, m.saldo]))}
          fornecedores={fornecedores}
          hoje={hoje()}
        />
      </Cartao>
      <p className="mt-4 text-sm text-stone-500">
        O material não está na lista?{" "}
        <Link href="/estoque/materiais" className="font-medium text-marca-700 hover:underline">
          Inclua no banco de materiais
        </Link>{" "}
        e volte aqui.
      </p>
    </>
  );
}
