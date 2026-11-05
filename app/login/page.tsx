import { redirect } from "next/navigation";
import { existeAlgumUsuario, usuarioAtual } from "@/lib/auth";
import { Formulario } from "@/components/formulario";
import { Campo, Cartao, Rotulo } from "@/components/ui";
import { Marca } from "@/components/marca";
import { entrar } from "./actions";

export const dynamic = "force-dynamic";

export default async function LoginPage({ searchParams }: { searchParams: { volta?: string } }) {
  if (!(await existeAlgumUsuario())) redirect("/primeiro-acesso");
  if (await usuarioAtual()) redirect("/");
  // quem veio do QR do poste volta para a ficha do poste depois de entrar
  const volta = searchParams.volta ?? "";

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <Cartao className="w-full max-w-sm p-6">
        <div className="mb-6">
          <Marca grande />
        </div>
        <Formulario acao={entrar} textoBotao="Entrar">
          <input type="hidden" name="volta" value={volta} />
          <Rotulo texto="Email">
            <Campo name="email" type="email" autoComplete="username" required autoFocus />
          </Rotulo>
          <Rotulo texto="Senha">
            <Campo name="senha" type="password" autoComplete="current-password" required />
          </Rotulo>
        </Formulario>
      </Cartao>
    </main>
  );
}
