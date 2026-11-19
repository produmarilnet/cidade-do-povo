"use client";

import { useEffect, useState } from "react";
import { Check, Copy, KeyRound, MessageCircle, X } from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// OS DADOS DE ACESSO DO USUÁRIO (o mesmo jeito do PRODUMAR)
// ─────────────────────────────────────────────────────────────────────────────
// Criou o usuário (ou trocou a senha dele), é preciso mandar para a pessoa onde
// entrar e com que senha. A senha já nasce sugerida no formulário (fácil de
// digitar no celular: uma palavra inventada e quatro números), e depois de
// salvar aparece o recado pronto — site, login e senha — para copiar ou mandar
// no WhatsApp.
//
// O endereço do site é o da própria tela (window.location.origin): é o mesmo que
// a pessoa vai abrir, e não depende de variável de ambiente.
// ─────────────────────────────────────────────────────────────────────────────

const CONSOANTES = "bcdfgjkmnprstvz";
const VOGAIS = "aeiou";

function sorteio(max: number): number {
  const a = new Uint32Array(1);
  crypto.getRandomValues(a);
  return a[0] % max;
}

/** Senha fácil de ditar e digitar: "Bomira4826" — sem letra que confunde (l/I, 0/O). */
export function gerarSenha(): string {
  let palavra = "";
  for (let i = 0; i < 3; i++) palavra += CONSOANTES[sorteio(CONSOANTES.length)] + VOGAIS[sorteio(VOGAIS.length)];
  const numeros = Array.from({ length: 4 }, () => String(2 + sorteio(8))).join("");
  return palavra[0].toUpperCase() + palavra.slice(1) + numeros;
}

export type Acesso = { nome: string; email: string; senha: string; papel: string };

function recado(a: Acesso, site: string): string {
  const primeiro = a.nome.trim().split(/\s+/)[0];
  return [
    `Olá${primeiro ? `, ${primeiro}` : ""}! Seu acesso ao sistema Cidade do Povo:`,
    "",
    `Site: ${site}`,
    `Login: ${a.email}`,
    `Senha: ${a.senha}`,
    "",
    "Abra o site e entre com o login e a senha acima. No celular, dá para colocar o site na tela de início para abrir como aplicativo. A senha pode ser trocada depois em Minha conta.",
  ].join("\n");
}

export function DadosDeAcesso({ acesso, titulo, onFechar }: { acesso: Acesso; titulo: string; onFechar: () => void }) {
  const [site, setSite] = useState("");
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    setSite(window.location.origin);
  }, []);

  const texto = recado(acesso, site);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(texto);
    } catch {
      // Safari antigo: copia pelo jeito velho, com um campo escondido
      const t = document.createElement("textarea");
      t.value = texto;
      t.style.position = "fixed";
      t.style.opacity = "0";
      document.body.appendChild(t);
      t.select();
      document.execCommand("copy");
      t.remove();
    }
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2500);
  }

  const linha = (rotulo: string, valor: string) => (
    <div className="flex items-baseline gap-3 px-3 py-2">
      <span className="w-12 shrink-0 text-xs text-stone-500">{rotulo}</span>
      <span className="min-w-0 flex-1 select-all break-all font-semibold text-stone-900">{valor}</span>
    </div>
  );

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-green-200 bg-green-50 p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="flex items-center gap-1.5 text-sm font-semibold text-green-800">
            <KeyRound className="h-4 w-4 shrink-0" />
            {titulo}
          </p>
          <p className="text-xs text-green-700">Papel: {acesso.papel}</p>
        </div>
        <button type="button" onClick={onFechar} aria-label="Fechar" className="rounded-md p-1 text-green-700 hover:bg-green-100">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="divide-y divide-green-100 rounded-lg border border-green-100 bg-white text-sm">
        {linha("Site", site)}
        {linha("Login", acesso.email)}
        {linha("Senha", acesso.senha)}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={copiar}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-green-300 bg-white text-sm font-medium text-green-800 hover:bg-green-50"
        >
          {copiado ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {copiado ? "Copiado" : "Copiar recado"}
        </button>
        <a
          href={`https://wa.me/?text=${encodeURIComponent(texto)}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-green-600 text-sm font-medium text-white hover:bg-green-700"
        >
          <MessageCircle className="h-4 w-4" />
          WhatsApp
        </a>
      </div>
      <p className="text-xs text-green-700">A senha só aparece agora — copie ou mande antes de fechar este quadro.</p>
    </div>
  );
}
