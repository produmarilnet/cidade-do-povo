"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { LayoutDashboard, Lightbulb, LogOut, Menu, RefreshCw, UserCog, Users, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Marca } from "./marca";
import { atualizarSistema, textoDaVersao } from "./atualizacao";

export type ItemMenu = {
  href: string;
  texto: string;
  icone: keyof typeof ICONES;
  emBreve?: boolean;
};
export type GrupoMenu = { titulo?: string; itens: ItemMenu[] };

// Ícones por nome: o layout (servidor) monta a lista e não pode passar componentes.
const ICONES = {
  painel: LayoutDashboard,
  iluminacao: Lightbulb,
  usuarios: Users,
  minhaConta: UserCog,
};

export function MenuLateral({
  grupos,
  nomeUsuario,
  papel,
  sair,
}: {
  grupos: GrupoMenu[];
  nomeUsuario: string;
  papel: string;
  sair: () => Promise<void>;
}) {
  const [aberto, setAberto] = useState(false);
  const caminho = usePathname();

  const conteudo = (
    <nav className="flex h-full flex-col gap-4 p-4">
      <div className="hidden lg:block">
        <Marca />
      </div>
      <div className="flex flex-1 flex-col gap-4 overflow-y-auto">
        {grupos.map((grupo, i) => (
          <div key={i} className="flex flex-col gap-0.5">
            {grupo.titulo && (
              <div className="px-3 pb-1 text-xs font-semibold uppercase tracking-wide text-stone-400">
                {grupo.titulo}
              </div>
            )}
            {grupo.itens.map((item) => {
              const Icone = ICONES[item.icone];
              const ativo = item.href === "/" ? caminho === "/" : caminho.startsWith(item.href);
              if (item.emBreve) {
                return (
                  <span
                    key={item.href}
                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-stone-400"
                  >
                    <Icone className="h-4 w-4" />
                    {item.texto}
                    <span className="ml-auto rounded bg-stone-100 px-1.5 text-[10px]">em breve</span>
                  </span>
                );
              }
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setAberto(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm",
                    ativo ? "bg-marca-50 font-medium text-marca-800" : "text-stone-700 hover:bg-stone-100",
                  )}
                >
                  <Icone className="h-4 w-4" />
                  {item.texto}
                </Link>
              );
            })}
          </div>
        ))}
      </div>
      <div className="border-t border-stone-200 pt-3">
        <div className="px-3 text-sm font-medium">{nomeUsuario}</div>
        <div className="px-3 pb-2 text-xs text-stone-500">{papel}</div>
        <button
          onClick={atualizarSistema}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-stone-700 hover:bg-stone-100"
        >
          <RefreshCw className="h-4 w-4" />
          <span className="text-left">
            Atualizar sistema
            <span className="block text-[11px] text-stone-400">{textoDaVersao()}</span>
          </span>
        </button>
        <form action={sair}>
          <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-stone-700 hover:bg-stone-100">
            <LogOut className="h-4 w-4" />
            Sair
          </button>
        </form>
      </div>
    </nav>
  );

  return (
    <>
      {/* Celular: barra no topo com botão de menu */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-stone-200 bg-white px-4 py-2 lg:hidden print:hidden">
        <Marca />
        <button onClick={() => setAberto(true)} className="rounded-lg p-2 hover:bg-stone-100" aria-label="Abrir menu">
          <Menu className="h-6 w-6" />
        </button>
      </header>
      {aberto && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/30" onClick={() => setAberto(false)} />
          <div className="absolute inset-y-0 left-0 w-72 bg-white shadow-xl">
            <button
              onClick={() => setAberto(false)}
              className="absolute right-3 top-3 rounded-lg p-2 hover:bg-stone-100"
              aria-label="Fechar menu"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="h-full pt-10">{conteudo}</div>
          </div>
        </div>
      )}
      {/* Computador: menu fixo à esquerda */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-stone-200 bg-white lg:block print:hidden">{conteudo}</aside>
    </>
  );
}
