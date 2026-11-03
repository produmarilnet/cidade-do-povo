/**
 * A marca do sistema: a logo da Prefeitura de São Mateus do Maranhão no
 * início, ao lado do nome. Sai no menu, no login e no cabeçalho da ficha
 * impressa.
 */
export function Marca({ grande = false }: { grande?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      {/* eslint-disable-next-line @next/next/no-img-element -- imagem pequena e fixa, sai igual na impressão */}
      <img
        src="/logo-prefeitura.png"
        alt="Prefeitura de São Mateus do Maranhão"
        width={272}
        height={115}
        className={grande ? "h-14 w-auto" : "h-9 w-auto"}
      />
      {/* o menu tem 224px de largura: o nome não pode quebrar em duas linhas */}
      <div className="whitespace-nowrap border-l border-stone-200 pl-2.5 leading-tight">
        <div className={grande ? "text-lg font-semibold" : "text-[15px] font-semibold"}>Cidade do Povo</div>
        <div className="text-xs text-stone-500">Gestão de serviços</div>
      </div>
    </div>
  );
}
