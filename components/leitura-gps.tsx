"use client";

import { useEffect, useRef, useState } from "react";
import { Crosshair, X } from "lucide-react";
import { pontoDasLeituras, type LeituraGps, type PontoGps } from "@/lib/gps";
import { textoDaPrecisao } from "@/lib/postes";
import { Botao } from "./ui";

// ── Leitura de um ponto pelo GPS ───────────────────────────────────────────
//
// Ouve o GPS por um tempo, tira a média das leituras boas e entrega o ponto.
// A tela fica acesa enquanto lê: com ela apagada, o iPhone corta o GPS do
// navegador. Modelo do Medir cerca do PRODUMAR, que já funciona no iPhone.

export const MODOS = {
  normal: {
    /** Leitura boa o bastante para marcar sozinho (metros). */
    precisaoBoa: 5,
    /** Ouve o GPS pelo menos isto antes de marcar sozinho (ms): as primeiras leituras pulam. */
    tempoMinimo: 6000,
    leiturasMinimas: 4,
    /** Passou disto, marca com a melhor que veio (ms). */
    tempoMaximo: 20000,
    /** Entram na média as leituras até tantos metros piores que a melhor. */
    folga: 2,
  },
  // Meio minuto parado no ponto. A média tira o "pulo" do GPS, mas não conserta
  // sombra de árvore ou telhado.
  preciso: {
    precisaoBoa: 3,
    tempoMinimo: 30000,
    leiturasMinimas: 15,
    tempoMaximo: 90000,
    folga: 1,
  },
} as const;

export type Modo = keyof typeof MODOS;

export type Leitura = { leituras: LeituraGps[]; inicio: number; agora: number; modo: Modo };

type Trava = { release: () => Promise<void> };

async function manterTelaAcesa(): Promise<Trava | null> {
  try {
    const wl = (navigator as Navigator & { wakeLock?: { request: (t: "screen") => Promise<Trava> } }).wakeLock;
    return wl ? await wl.request("screen") : null;
  } catch {
    // sem suporte ou negado: segue sem, é só não deixar a tela apagar
    return null;
  }
}

/**
 * `marcar(modo)` liga o GPS; quando o ponto fica bom (ou passa do tempo
 * máximo), `aoMarcar` recebe o ponto. `usarAgora` marca com o que já veio.
 */
export function useLeituraGps(aoMarcar: (p: PontoGps) => void) {
  const [lendo, setLendo] = useState<Leitura | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const vigia = useRef<number | null>(null);
  const trava = useRef<Trava | null>(null);
  const relogio = useRef<number | null>(null);
  const aoMarcarRef = useRef(aoMarcar);
  aoMarcarRef.current = aoMarcar;

  // saiu da tela no meio de uma leitura: desliga o GPS
  useEffect(() => () => pararGps(), []);

  function pararGps() {
    if (vigia.current !== null) navigator.geolocation.clearWatch(vigia.current);
    vigia.current = null;
    if (relogio.current !== null) window.clearInterval(relogio.current);
    relogio.current = null;
    trava.current?.release().catch(() => {});
    trava.current = null;
  }

  function concluir(leituras: LeituraGps[], modo: Modo) {
    pararGps();
    setLendo(null);
    const ponto = pontoDasLeituras(leituras, MODOS[modo].folga);
    if (ponto) aoMarcarRef.current(ponto);
  }

  function marcar(modo: Modo) {
    setErro(null);
    if (!("geolocation" in navigator)) {
      setErro("Este aparelho não tem GPS disponível para o navegador.");
      return;
    }
    const regra = MODOS[modo];
    const inicio = Date.now();
    const leituras: LeituraGps[] = [];
    setLendo({ leituras, inicio, agora: inicio, modo });
    manterTelaAcesa().then((t) => {
      // a leitura pode ter acabado antes da trava chegar
      if (vigia.current === null) t?.release().catch(() => {});
      else trava.current = t;
    });
    // o tempo anda na tela mesmo quando o GPS demora a mandar leitura
    relogio.current = window.setInterval(() => setLendo((l) => (l ? { ...l, agora: Date.now() } : l)), 500);
    vigia.current = navigator.geolocation.watchPosition(
      (pos) => {
        leituras.push({ lat: pos.coords.latitude, lng: pos.coords.longitude, precisao: pos.coords.accuracy });
        const agora = Date.now();
        const melhor = Math.min(...leituras.map((l) => l.precisao));
        const passou = agora - inicio;
        const pronto =
          passou >= regra.tempoMinimo && melhor <= regra.precisaoBoa && leituras.length >= regra.leiturasMinimas;
        if (pronto || passou >= regra.tempoMaximo) {
          concluir([...leituras], modo);
          return;
        }
        setLendo({ leituras: [...leituras], inicio, agora, modo });
      },
      (e) => {
        pararGps();
        setLendo(null);
        setErro(
          e.code === e.PERMISSION_DENIED
            ? 'O GPS foi bloqueado para o sistema. No iPhone: Ajustes → Privacidade → Serviços de Localização → Safari → "Durante o Uso", e toque em marcar de novo.'
            : e.code === e.TIMEOUT
              ? "O GPS não respondeu a tempo. Vá para um lugar aberto, longe de telhado e árvore, e tente de novo."
              : "Não deu para ler o GPS agora. Tente de novo.",
        );
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 30000 },
    );
  }

  function cancelar() {
    pararGps();
    setLendo(null);
  }

  function usarAgora() {
    if (lendo && lendo.leituras.length > 0) concluir(lendo.leituras, lendo.modo);
  }

  return { lendo, erro, marcar, cancelar, usarAgora };
}

/** O quadro de "lendo o GPS…", com a barra do modo preciso. */
export function PainelDaLeitura({
  lendo,
  aoCancelar,
  aoUsarAgora,
}: {
  lendo: Leitura;
  aoCancelar: () => void;
  aoUsarAgora: () => void;
}) {
  const regra = MODOS[lendo.modo];
  const melhor = lendo.leituras.length > 0 ? Math.min(...lendo.leituras.map((l) => l.precisao)) : null;
  const segundos = Math.floor((lendo.agora - lendo.inicio) / 1000);
  const minimo = regra.tempoMinimo / 1000;

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-stone-200 p-3">
      <div className="flex items-center gap-3">
        <Crosshair className="h-6 w-6 shrink-0 animate-pulse text-marca-600" />
        <div className="min-w-0">
          <p className="font-semibold text-stone-800">Lendo o GPS…</p>
          <p className="text-sm text-stone-500">
            {melhor === null
              ? "Esperando o GPS responder. Fique parado ao lado do poste."
              : `Precisão agora: ${textoDaPrecisao(melhor)} · ${lendo.leituras.length} ${lendo.leituras.length === 1 ? "leitura" : "leituras"}`}
          </p>
        </div>
      </div>
      {lendo.modo === "preciso" && (
        <div className="flex flex-col gap-1">
          <div className="h-2 overflow-hidden rounded-full bg-stone-100">
            <div
              className="h-full bg-marca-500 transition-all"
              style={{ width: `${Math.min(100, (segundos / minimo) * 100)}%` }}
            />
          </div>
          <p className="text-xs text-stone-500">
            {segundos < minimo
              ? `Modo preciso: ${segundos} de ${minimo} segundos. Não saia do lugar.`
              : melhor !== null && melhor > regra.precisaoBoa
                ? `Esperando o GPS chegar a ± ${regra.precisaoBoa} m (até ${regra.tempoMaximo / 1000} s).`
                : "Quase lá…"}
          </p>
        </div>
      )}
      {melhor !== null && melhor > 10 && (
        <p className="text-xs text-amber-700">GPS fraco aqui. Se puder, saia de baixo de árvore ou telhado.</p>
      )}
      <div className="flex gap-2">
        <Botao type="button" variante="secundario" className="flex-1" onClick={aoCancelar}>
          <X className="h-4 w-4" />
          Cancelar
        </Botao>
        <Botao type="button" className="flex-1" disabled={lendo.leituras.length === 0} onClick={aoUsarAgora}>
          Usar agora
        </Botao>
      </div>
    </div>
  );
}

/** A caixinha do modo preciso. */
export function OpcaoModoPreciso({ modo, aoMudar }: { modo: Modo; aoMudar: (m: Modo) => void }) {
  return (
    <label className="flex items-center gap-3 rounded-lg border border-stone-200 px-3 py-3">
      <input
        type="checkbox"
        checked={modo === "preciso"}
        onChange={(e) => aoMudar(e.target.checked ? "preciso" : "normal")}
        className="h-5 w-5 accent-marca-600"
      />
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-stone-800">Modo preciso</span>
        <span className="block text-xs text-stone-500">Fica 30 segundos lendo e só marca com ± 3 m. Demora mais, erra menos.</span>
      </span>
    </label>
  );
}
