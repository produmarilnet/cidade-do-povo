import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { exigirUsuario } from "@/lib/auth";
import { sql } from "@/lib/db";
import { enderecoDoQr, ETIQUETAS_POR_FOLHA, ETIQUETAS_POR_LOTE, lerNumeroDoPoste, numeroDoPoste } from "@/lib/postes";
import { cn } from "@/lib/utils";
import { BotaoImprimir } from "@/components/imprimir";
import { QrCode } from "@/components/qr-code";
import { Aviso, Cartao, Titulo } from "@/components/ui";

/**
 * Quadrado de 6 × 6 cm, que é o que o dono escolheu (12 por folha A4). O QR de
 * 4 cm lê a menos de 1 metro. A linha tracejada é a do corte.
 */
function EtiquetaDoPoste({ numero }: { numero: number }) {
  return (
    <div className="flex h-[60mm] w-[60mm] flex-col items-center justify-between bg-white px-[2mm] py-[1.5mm] text-black outline-dashed outline-[0.2mm] outline-stone-400">
      <div className="flex h-[7mm] items-center gap-[2mm]">
        {/* eslint-disable-next-line @next/next/no-img-element -- imagem pequena e fixa, sai igual na impressão */}
        <img src="/logo-prefeitura.png" alt="" className="h-[7mm] w-auto" />
        <span className="text-[8pt] font-semibold leading-tight">
          Luz com defeito?
          <br />
          Aponte a câmera
        </span>
      </div>
      <QrCode texto={enderecoDoQr(numero)} className="h-[42mm] w-[42mm]" />
      <div className="text-[13pt] font-bold leading-none tabular-nums">Poste {numeroDoPoste(numero)}</div>
    </div>
  );
}

export default async function ImprimirEtiquetasPage({ searchParams }: { searchParams: { de?: string; ate?: string } }) {
  await exigirUsuario("verPostes");
  const de = lerNumeroDoPoste(searchParams.de ?? "");
  const ate = lerNumeroDoPoste(searchParams.ate ?? "");

  // só sai etiqueta de número que existe: QR de número solto não abre nada na rua
  const postes =
    de !== null && ate !== null
      ? await sql<{ numero: number }[]>`
          select numero from postes where numero between ${de} and ${ate}
          order by numero
          limit ${ETIQUETAS_POR_LOTE}`
      : [];
  const numeros = postes.map((p) => p.numero);
  const folhas = Array.from({ length: Math.ceil(numeros.length / ETIQUETAS_POR_FOLHA) }, (_, i) =>
    numeros.slice(i * ETIQUETAS_POR_FOLHA, (i + 1) * ETIQUETAS_POR_FOLHA),
  );

  return (
    <>
      <style>{`@page { size: A4; margin: 8mm; }`}</style>

      <div className="print:hidden">
        <Link
          href="/postes/etiquetas"
          className="mb-2 inline-flex items-center gap-1 text-sm text-stone-500 hover:text-stone-800"
        >
          <ChevronLeft className="h-4 w-4" />
          Etiquetas
        </Link>
        <Titulo acao={numeros.length > 0 && <BotaoImprimir texto="Imprimir" />}>
          {numeros.length === 1 ? "1 etiqueta" : `${numeros.length} etiquetas`}
        </Titulo>
        {numeros.length > 0 ? (
          <p className="-mt-2 mb-4 text-sm text-stone-500">
            Imprima em tamanho real (100%, sem "ajustar à página"). {folhas.length === 1 ? "1 folha" : `${folhas.length} folhas`} A4.
          </p>
        ) : (
          <Aviso>Nenhuma etiqueta nessa faixa de números.</Aviso>
        )}
      </div>

      <div className="flex flex-col gap-4 overflow-x-auto print:block print:overflow-visible">
        {folhas.map((folha, i) => (
          <Cartao
            key={i}
            // quebra antes de cada folha, nunca depois: depois da última sairia uma folha de vinil em branco
            className={cn(
              "w-fit rounded-none p-[4mm] print:border-0 print:p-0 print:shadow-none",
              i > 0 && "break-before-page",
            )}
          >
            <div className="grid grid-cols-[repeat(3,60mm)] auto-rows-[60mm] gap-[5mm]">
              {folha.map((numero) => (
                <EtiquetaDoPoste key={numero} numero={numero} />
              ))}
            </div>
          </Cartao>
        ))}
      </div>
    </>
  );
}
