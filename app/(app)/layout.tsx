import { exigirUsuario } from "@/lib/auth";
import { pode } from "@/lib/permissoes";
import { NOME_PAPEL } from "@/lib/types";
import { MenuLateral, type GrupoMenu } from "@/components/menu";
import { AvisoDeVersaoNova } from "@/components/atualizacao";
import { sair } from "../login/actions";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const usuario = await exigirUsuario();

  const grupos: GrupoMenu[] = [{ itens: [{ href: "/", texto: "Painel", icone: "painel" }] }];

  if (pode(usuario.papel, "verIluminacao")) {
    grupos.push({
      titulo: "Iluminação pública",
      itens: [{ href: "/iluminacao", texto: "Ordens de serviço", icone: "iluminacao" }],
    });
  }

  const conta: GrupoMenu = { titulo: "Conta", itens: [] };
  if (pode(usuario.papel, "gerenciarUsuarios")) {
    conta.itens.push({ href: "/usuarios", texto: "Usuários", icone: "usuarios" });
  }
  conta.itens.push({ href: "/minha-conta", texto: "Minha conta", icone: "minhaConta" });
  grupos.push(conta);

  return (
    <div className="min-h-screen">
      <MenuLateral grupos={grupos} nomeUsuario={usuario.nome} papel={NOME_PAPEL[usuario.papel]} sair={sair} />
      <main className="p-4 lg:ml-64 lg:p-8 print:ml-0 print:p-0">
        <div className="mx-auto max-w-5xl print:max-w-none">{children}</div>
      </main>
      <AvisoDeVersaoNova />
    </div>
  );
}
