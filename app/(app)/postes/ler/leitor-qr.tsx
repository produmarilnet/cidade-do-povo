"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import jsQR from "jsqr";
import { lerNumeroDoPoste, numeroDoQr } from "@/lib/postes";
import { Aviso, Botao, Campo, Rotulo } from "@/components/ui";

/** Lê o QR pela câmera dentro do próprio sistema. Sem câmera, dá para digitar o número. */
export function LeitorQr() {
  const router = useRouter();
  const video = useRef<HTMLVideoElement>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [outroQr, setOutroQr] = useState(false);
  const [digitado, setDigitado] = useState("");

  useEffect(() => {
    let fluxo: MediaStream | undefined;
    let relogio: number | undefined;
    let saiu = false;
    const quadro = document.createElement("canvas");
    const pincel = quadro.getContext("2d", { willReadFrequently: true });

    function olhar() {
      const v = video.current;
      if (saiu || !v || !pincel) return;
      if (v.readyState >= v.HAVE_CURRENT_DATA && v.videoWidth > 0) {
        // reduz o quadro: o celular acha o QR mais rápido e sem esquentar
        const escala = Math.min(1, 720 / Math.max(v.videoWidth, v.videoHeight));
        quadro.width = Math.round(v.videoWidth * escala);
        quadro.height = Math.round(v.videoHeight * escala);
        pincel.drawImage(v, 0, 0, quadro.width, quadro.height);
        const imagem = pincel.getImageData(0, 0, quadro.width, quadro.height);
        const achou = jsQR(imagem.data, imagem.width, imagem.height, { inversionAttempts: "dontInvert" });
        if (achou) {
          const numero = numeroDoQr(achou.data);
          if (numero !== null) {
            router.push(`/postes/${numero}`);
            return;
          }
          setOutroQr(true);
        }
      }
      relogio = window.setTimeout(olhar, 200);
    }

    async function ligar() {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          setErro("Este navegador não abre a câmera aqui. Use a câmera do celular ou digite o número.");
          return;
        }
        fluxo = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false });
        if (saiu) {
          fluxo.getTracks().forEach((t) => t.stop());
          return;
        }
        const v = video.current;
        if (!v) return;
        v.srcObject = fluxo;
        await v.play();
        olhar();
      } catch (e) {
        setErro(
          e instanceof DOMException && e.name === "NotAllowedError"
            ? "A câmera foi bloqueada para o sistema. No iPhone: Ajustes → Safari → Câmera → Permitir. Também dá para ler com a câmera comum do celular."
            : "Não deu para abrir a câmera. Use a câmera comum do celular ou digite o número.",
        );
      }
    }

    ligar();
    return () => {
      saiu = true;
      window.clearTimeout(relogio);
      fluxo?.getTracks().forEach((t) => t.stop());
    };
  }, [router]);

  const numeroDigitado = lerNumeroDoPoste(digitado);

  return (
    <div className="flex max-w-md flex-col gap-4">
      {!erro && (
        <div className="relative aspect-square overflow-hidden rounded-xl bg-stone-900">
          {/* playsInline e muted: sem eles o iPhone abre o vídeo em tela cheia ou não toca */}
          <video ref={video} playsInline muted className="h-full w-full object-cover" />
          <div className="pointer-events-none absolute inset-[15%] rounded-xl border-2 border-white/80" />
        </div>
      )}
      {outroQr && !erro && <Aviso>Esse QR não é de um poste do sistema.</Aviso>}
      {erro && <Aviso>{erro}</Aviso>}
      <form
        className="flex items-end gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (numeroDigitado !== null) router.push(`/postes/${numeroDigitado}`);
        }}
      >
        <Rotulo texto="Ou digite o número do poste" className="flex-1">
          <Campo
            type="text"
            voz={false}
            inputMode="numeric"
            value={digitado}
            onChange={(e) => setDigitado(e.target.value)}
            placeholder="Ex.: 000123"
            autoComplete="off"
          />
        </Rotulo>
        <Botao type="submit" variante="secundario" disabled={numeroDigitado === null}>
          Abrir
        </Botao>
      </form>
    </div>
  );
}
