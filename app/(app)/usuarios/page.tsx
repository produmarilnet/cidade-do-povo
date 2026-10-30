import { exigirUsuario } from "@/lib/auth";
import { sql } from "@/lib/db";
import { cn } from "@/lib/utils";
import { NOME_PAPEL, PAPEIS, type Usuario } from "@/lib/types";
import { BotaoAcao, Formulario } from "@/components/formulario";
import { Assistente, Escolha, Passo } from "@/components/assistente";
import { Campo, Cartao, Etiqueta, Rotulo, Selecao, Titulo } from "@/components/ui";
import { alternarAtivo, criarUsuario, mudarPapel, redefinirSenha } from "./actions";

const O_QUE_CADA_UM_FAZ: Record<string, string> = {
  admin: "Tudo, inclusive cadastrar usuários.",
  atendente: "Abre, corrige e imprime ordens de serviço.",
  eletricista: "Consulta as ordens e registra o serviço feito.",
  visualizador: "Só consulta, não altera nada.",
};

export default async function UsuariosPage() {
  const eu = await exigirUsuario("gerenciarUsuarios");
  const usuarios = await sql<Usuario[]>`
    select id, nome, email, papel, ativo from usuarios order by ativo desc, nome`;

  return (
    <>
      <Titulo>Usuários</Titulo>

      <Cartao className="mb-6 p-0">
        <ul className="divide-y divide-stone-100">
          {usuarios.map((u) => (
            <li key={u.id} className={cn("flex flex-col gap-2 px-4 py-3", !u.ativo && "opacity-60")}>
              <div className="flex flex-wrap items-center gap-2">
                <div className="min-w-0 flex-1">
                  <div className="font-medium">
                    {u.nome} {u.id === eu.id && <span className="text-xs text-stone-500">(você)</span>}
                  </div>
                  <div className="text-xs text-stone-500">{u.email}</div>
                </div>
                {!u.ativo && <Etiqueta cor="cinza">Desativado</Etiqueta>}
                <Etiqueta cor="verde">{NOME_PAPEL[u.papel]}</Etiqueta>
              </div>
              {u.id !== eu.id && (
                <details className="text-sm">
                  <summary className="cursor-pointer text-marca-700">Alterar</summary>
                  <div className="mt-3 flex flex-col gap-3 rounded-lg bg-stone-50 p-3">
                    <div className="flex flex-wrap gap-1">
                      {PAPEIS.map((p) => (
                        <BotaoAcao
                          key={p}
                          acao={mudarPapel.bind(null, u.id, p)}
                          variante={u.papel === p ? "primario" : "secundario"}
                          className="h-8 px-3 text-xs"
                        >
                          {NOME_PAPEL[p]}
                        </BotaoAcao>
                      ))}
                    </div>
                    <Formulario acao={redefinirSenha.bind(null, u.id)} limparAoSalvar textoBotao="Trocar senha" className="flex flex-wrap items-end gap-2">
                      <Rotulo texto="Nova senha" className="flex-1">
                        <Campo name="senha" type="text" minLength={6} autoComplete="off" voz={false} required />
                      </Rotulo>
                    </Formulario>
                    <BotaoAcao
                      acao={alternarAtivo.bind(null, u.id)}
                      confirmar={u.ativo ? `Desativar ${u.nome}? A pessoa perde o acesso na hora.` : undefined}
                      variante={u.ativo ? "perigo" : "secundario"}
                      className="h-8 px-3 text-xs"
                    >
                      {u.ativo ? "Desativar acesso" : "Reativar acesso"}
                    </BotaoAcao>
                  </div>
                </details>
              )}
            </li>
          ))}
        </ul>
      </Cartao>

      <Cartao>
        <h2 className="mb-3 font-semibold">Novo usuário</h2>
        <Assistente acao={criarUsuario} limparAoSalvar textoBotao="Cadastrar">
          <Passo titulo="Quem é">
            <Rotulo texto="Nome">
              <Campo name="nome" required />
            </Rotulo>
            <Rotulo texto="Email (é o login)">
              <Campo name="email" type="email" autoComplete="off" required />
            </Rotulo>
          </Passo>
          <Passo titulo="Senha inicial" dica="A pessoa entra com ela e pode trocar depois em Minha conta.">
            <Rotulo texto="Senha inicial (mínimo 6 letras ou números)">
              <Campo name="senha" type="text" minLength={6} autoComplete="off" voz={false} required />
            </Rotulo>
          </Passo>
          <Passo titulo="O que pode fazer">
            <Escolha
              name="papel"
              rotulo="Papel"
              inicial="atendente"
              opcoes={PAPEIS.map((p) => ({ valor: p, texto: NOME_PAPEL[p], detalhe: O_QUE_CADA_UM_FAZ[p] }))}
            />
          </Passo>
        </Assistente>
      </Cartao>
    </>
  );
}
