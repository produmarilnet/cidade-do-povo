"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LocateFixed, X } from "lucide-react";
import { Botao } from "@/components/ui";

/**
 * "Perto de mim": pega onde o celular está e a lista vem do ponto mais perto
 * para o mais longe. Uma leitura só, sem esperar o GPS assentar — para achar o
 * poste da rua, dezenas de metros de folga bastam.
 */
export function PertoDeMim({ busca, ativo }: { busca: string; ativo: boolean }) {
  const router = useRouter();
  const [lendo, setLendo] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  function ir(lat?: number, lng?: number) {
    const q = new URLSearchParams();
    if (busca) q.set("busca", busca);
    if (lat !== undefined && lng !== undefined) {
      q.set("lat", lat.toFixed(6));
      q.set("lng", lng.toFixed(6));
    }
    const texto = q.toString();
    router.push(`/postes/levantamento${texto ? `?${texto}` : ""}`);
  }

  function localizar() {
    if (!navigator.geolocation) {
      setErro("Este celular não deixa o site usar o GPS.");
      return;
    }
    setErro(null);
    setLendo(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLendo(false);
        ir(pos.coords.latitude, pos.coords.longitude);
      },
      (e) => {
        setLendo(false);
        setErro(
          e.code === e.PERMISSION_DENIED
            ? "O GPS foi negado. No iPhone: Ajustes → Privacidade → Serviços de Localização → Safari → Durante o Uso."
            : "Não deu para pegar o GPS agora. Tente de novo em lugar aberto.",
        );
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 10000 },
    );
  }

  return (
    <div className="mb-4">
      <div className="flex gap-2">
        <Botao type="button" onClick={localizar} disabled={lendo} className="h-11 flex-1 text-base">
          <LocateFixed className="h-5 w-5" />
          {lendo ? "Pegando o GPS..." : ativo ? "Atualizar onde estou" : "Perto de mim"}
        </Botao>
        {ativo && (
          <Botao type="button" variante="secundario" onClick={() => ir()} className="h-11" aria-label="Parar de usar onde estou">
            <X className="h-4 w-4" />
          </Botao>
        )}
      </div>
      {erro && <p className="mt-2 text-sm text-red-600">{erro}</p>}
    </div>
  );
}
