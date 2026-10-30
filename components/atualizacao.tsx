"use client";

import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";

// ── Versão nova do sistema ─────────────────────────────────────────────────
//
// O Safari do iPhone guarda a página aberta na memória: depois de um
// "Implantar", quem está com o app aberto continua na versão velha até
// recarregar. Aqui a tela pergunta ao servidor qual versão está no ar e, se
// mudou, mostra um aviso com o botão de atualizar.

const VERSAO_DESTA_TELA = process.env.VERSAO_DO_APP ?? "";

/** "Versão de 01/10 às 15:21" — quando esta versão foi publicada (horário de Brasília). */
export function textoDaVersao(): string {
  const n = Number(VERSAO_DESTA_TELA);
  if (!n) return "";
  const quando = new Date(n).toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
  return `Versão de ${quando.replace(",", " às")}`;
}

/** Recarrega a página do servidor (pega a versão nova). */
export function atualizarSistema() {
  window.location.reload();
}

export function AvisoDeVersaoNova() {
  const [temNova, setTemNova] = useState(false);

  useEffect(() => {
    let parado = false;

    async function conferir() {
      try {
        // O carimbo na URL impede qualquer cache no caminho (Safari incluído).
        const r = await fetch(`/api/versao?t=${Date.now()}`, { cache: "no-store" });
        if (!r.ok) return;
        const { versao } = (await r.json()) as { versao: string };
        if (!parado && versao && VERSAO_DESTA_TELA && versao !== VERSAO_DESTA_TELA) setTemNova(true);
      } catch {
        // sem internet agora: tenta de novo na próxima
      }
    }

    // Confere ao abrir, ao voltar para o app e a cada minuto. No iPhone, voltar
    // para o Safari nem sempre avisa pelo mesmo sinal: quando a página sai da
    // memória ("pageshow") ou só ganha foco, o visibilitychange pode não vir.
    conferir();
    const aoVoltar = () => document.visibilityState === "visible" && conferir();
    document.addEventListener("visibilitychange", aoVoltar);
    window.addEventListener("pageshow", conferir);
    window.addEventListener("focus", conferir);
    const relogio = setInterval(conferir, 60 * 1000);
    return () => {
      parado = true;
      document.removeEventListener("visibilitychange", aoVoltar);
      window.removeEventListener("pageshow", conferir);
      window.removeEventListener("focus", conferir);
      clearInterval(relogio);
    };
  }, []);

  if (!temNova) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 p-3 lg:left-64 print:hidden">
      <div className="mx-auto flex max-w-md items-center gap-3 rounded-xl bg-stone-900 px-4 py-3 text-sm text-white shadow-lg">
        <span className="flex-1">Saiu uma versão nova do sistema.</span>
        <button
          onClick={atualizarSistema}
          className="flex items-center gap-2 rounded-lg bg-marca-500 px-3 py-2 font-medium hover:bg-marca-400"
        >
          <RefreshCw className="h-4 w-4" />
          Atualizar
        </button>
      </div>
    </div>
  );
}
