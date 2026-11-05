import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { exigirUsuario } from "@/lib/auth";
import { Titulo } from "@/components/ui";
import { LeitorQr } from "./leitor-qr";

export default async function LerQrPage() {
  await exigirUsuario("verPostes");
  return (
    <>
      <Link href="/postes" className="mb-2 inline-flex items-center gap-1 text-sm text-stone-500 hover:text-stone-800">
        <ChevronLeft className="h-4 w-4" />
        Postes
      </Link>
      <Titulo>Ler o QR do poste</Titulo>
      <p className="-mt-2 mb-3 text-sm text-stone-500">Aponte a câmera para a etiqueta. A ficha do poste abre sozinha.</p>
      <LeitorQr />
    </>
  );
}
