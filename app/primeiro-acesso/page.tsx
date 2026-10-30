import { redirect } from "next/navigation";
import { existeAlgumUsuario } from "@/lib/auth";
import { Formulario } from "@/components/formulario";
import { Campo, Cartao, Rotulo } from "@/components/ui";
import { Marca } from "@/components/marca";
import { criarPrimeiroAdmin } from "./actions";

export const dynamic = "force-dynamic";

export default async function PrimeiroAcessoPage() {
  if (await existeAlgumUsuario()) redirect("/login");

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <Cartao className="w-full max-w-sm p-6">
        <div className="mb-4">
          <Marca grande />
        </div>
        <h1 className="mb-1 font-semibold">Primeiro acesso</h1>
        <p className="mb-4 text-sm text-stone-600">
          Crie o usuário administrador. Os outros usuários você cadastra depois, lá dentro.
        </p>
        <Formulario acao={criarPrimeiroAdmin} textoBotao="Criar e entrar">
          <Rotulo texto="Nome">
            <Campo name="nome" required autoFocus />
          </Rotulo>
          <Rotulo texto="Email">
            <Campo name="email" type="email" autoComplete="username" required />
          </Rotulo>
          <Rotulo texto="Senha">
            <Campo name="senha" type="password" autoComplete="new-password" minLength={6} required />
          </Rotulo>
        </Formulario>
      </Cartao>
    </main>
  );
}
