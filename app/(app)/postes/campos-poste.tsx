"use client";

import { useEffect, useRef, useState } from "react";
import { Crosshair, MapPin } from "lucide-react";
import { Passo } from "@/components/assistente";
import { CamposLugar } from "@/components/campos-lugar";
import { OpcaoModoPreciso, PainelDaLeitura, useLeituraGps, type Modo } from "@/components/leitura-gps";
import { Aviso, Botao, Campo, Rotulo } from "@/components/ui";
import { linkDoMapa, textoDaPrecisao } from "@/lib/postes";

type Ponto = { lat: number; lng: number; precisao: number };

/** O que o cadastro já sabe: o próprio poste, ou a rua do último poste marcado. */
export type InicioDoPoste = {
  latitude?: number | null;
  longitude?: number | null;
  precisao?: number | null;
  localidade?: string | null;
  bairro?: string | null;
  endereco?: string | null;
  ponto_referencia?: string | null;
};

function MarcarGps({ inicio }: { inicio?: InicioDoPoste }) {
  const [ponto, setPonto] = useState<Ponto | null>(
    inicio?.latitude != null && inicio.longitude != null
      ? { lat: inicio.latitude, lng: inicio.longitude, precisao: inicio.precisao ?? 0 }
      : null,
  );
  const [modo, setModo] = useState<Modo>("normal");
  const { lendo, erro, marcar, cancelar, usarAgora } = useLeituraGps(setPonto);

  // Caixinha escondida: é ela que segura o "Continuar" enquanto o GPS não foi
  // marcado. Campo hidden o navegador não confere, e campo de texto abriria o
  // teclado do iPhone ao entrar no passo.
  const obrigatorio = useRef<HTMLInputElement>(null);
  useEffect(() => {
    obrigatorio.current?.setCustomValidity(ponto ? "" : "Marque a localização pelo GPS.");
  }, [ponto]);

  const resumo = ponto ? `${ponto.lat.toFixed(6)}, ${ponto.lng.toFixed(6)} (${textoDaPrecisao(ponto.precisao)})` : "";

  return (
    <>
      <input type="hidden" name="latitude" value={ponto?.lat ?? ""} />
      <input type="hidden" name="longitude" value={ponto?.lng ?? ""} />
      <input type="hidden" name="precisao" value={ponto?.precisao ?? ""} />
      <input
        ref={obrigatorio}
        type="checkbox"
        checked={ponto !== null}
        // readOnly não serve: o navegador deixa de conferir campo somente-leitura
        onChange={() => {}}
        tabIndex={-1}
        aria-hidden
        className="sr-only"
        data-conferir="Localização"
        data-texto={resumo}
      />

      {lendo ? (
        <PainelDaLeitura lendo={lendo} aoCancelar={cancelar} aoUsarAgora={usarAgora} />
      ) : (
        <>
          {ponto && (
            <div className="flex items-start gap-3 rounded-lg bg-marca-50 p-3 text-sm text-marca-800">
              <MapPin className="mt-0.5 h-5 w-5 shrink-0" />
              <div className="min-w-0">
                <p className="font-semibold">Localização marcada ({textoDaPrecisao(ponto.precisao)})</p>
                <p className="tabular-nums">
                  {ponto.lat.toFixed(6)}, {ponto.lng.toFixed(6)}
                </p>
                <a href={linkDoMapa(ponto.lat, ponto.lng)} target="_blank" rel="noreferrer" className="underline">
                  Ver no mapa
                </a>
              </div>
            </div>
          )}
          {ponto && ponto.precisao > 15 && (
            <Aviso>O GPS ficou fraco nesta marcação. Se puder, marque de novo num lugar mais aberto.</Aviso>
          )}
          <Botao
            type="button"
            variante={ponto ? "secundario" : "primario"}
            className="h-12 w-full text-base"
            onClick={() => marcar(modo)}
          >
            <Crosshair className="h-5 w-5" />
            {ponto ? "Marcar de novo" : "Marcar a localização"}
          </Botao>
          <OpcaoModoPreciso modo={modo} aoMudar={setModo} />
        </>
      )}
      {erro && <Aviso>{erro}</Aviso>}
    </>
  );
}

/** Os passos do cadastro: iguais para poste novo, etiqueta lida na rua e correção. */
export function CamposPoste({
  inicio,
  localidades,
  bairros,
}: {
  inicio?: InicioDoPoste;
  localidades: string[];
  bairros: string[];
}) {
  return (
    <>
      <Passo titulo="Localização" dica="Fique encostado no poste e toque para marcar.">
        <MarcarGps inicio={inicio} />
      </Passo>

      <Passo titulo="Onde fica">
        <CamposLugar localidade={inicio?.localidade} bairro={inicio?.bairro} localidades={localidades} bairros={bairros} />
        {/* só a rua, igual à ordem: é o que preenche a ordem aberta deste poste */}
        <Rotulo texto="Rua">
          <Campo name="endereco" defaultValue={inicio?.endereco ?? ""} placeholder="Rua, avenida, travessa…" autoComplete="off" required />
        </Rotulo>
        <Rotulo texto="Ponto de referência (opcional)">
          <Campo
            name="ponto_referencia"
            defaultValue={inicio?.ponto_referencia ?? ""}
            placeholder="Ex.: em frente à escola"
            autoComplete="off"
          />
        </Rotulo>
      </Passo>
    </>
  );
}
