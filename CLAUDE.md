# Instruções do projeto

## Regra principal: sempre commitar e pushar

Terminou a tarefa: `git status` (conferir que nada com senha entra), `git add -A`,
`git commit -m "tipo(escopo): descrição em português"`, `git push`.

## O que é

**Cidade do Povo** — sistema de gestão de serviços. Sistema próprio, separado do
PRODUMAR e do Recanto (a base — login, menu, cadastro passo a passo — veio do
Recanto). Módulos entram aos poucos; o primeiro é o de iluminação pública.

- **Iluminação pública → ordens de serviço** (`ordens_servico`): o atendente abre a
  ordem com o pedido (nome, apelido, telefone, endereço, nº da casa, ponto de
  referência, serviço, atendente). A data da ficha é preenchida pelo sistema
  (`criado_em`) e o nº é sequencial (`numero`). A ficha impressa (A4) leva, embaixo,
  linhas em branco para o eletricista preencher na rua: eletricista executor,
  material aplicado, data e observações. Quando a ficha volta, isso é passado para
  o sistema em "Registrar o serviço feito" e a ordem fica executada.
- Situações: `aberta` → `executada` (ou `cancelada`); dá para reabrir.

## Stack e decisões

- Next.js 14 App Router · TypeScript · Tailwind · Postgres puro com o driver `postgres`.
- **Sem Supabase.** Login/sessão em `lib/auth.ts`; permissões por papel em
  `lib/permissoes.ts` (cada módulo novo ganha linhas lá). Papéis: admin, atendente,
  eletricista, visualizador. Toda server action começa com `exigirUsuario("permissao")`.
- Migrations em `db/migrations/NNNN_nome.sql`, aplicadas sozinhas na partida do
  container. Nunca editar uma migration já publicada: criar outra.
- Colunas `date` voltam como texto `AAAA-MM-DD`; `numeric` volta como número
  (ver `lib/db.ts`). Datas e dinheiro: helpers de `lib/utils.ts`.
- Nada de `NEXT_PUBLIC_*`: no EasyPanel o build roda antes das variáveis existirem.
- **Todo cadastro é passo a passo**: `Assistente` + `Passo` de
  `components/assistente.tsx` — um passo por vez e, no fim, a conferência com
  "Alterar" em cada passo. Editar abre direto na conferência (`comecarNaConferencia`).
- Interface, código e commits em português. Dono testa no iPhone: campos com
  `text-base` no celular (abaixo de 16px o Safari dá zoom).

## Checagem antes de commitar

`npx tsc --noEmit` precisa passar.
