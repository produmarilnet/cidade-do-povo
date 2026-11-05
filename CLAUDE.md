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
- A ficha impressa cabe em **meia folha A4** (pedido do setor, 03/11/2026): sai na
  metade de cima, com "corte aqui" embaixo. Mexeu na ficha, confira que continua
  cabendo (≤ ~140 mm de altura na largura de 190 mm).
- **Banco de materiais** (`materiais`, migration 0002): a lista que aparece na baixa
  para escolher com um toque; cada material é por peça (`un`) ou por metro (`m`).
  O que foi aplicado vai em `ordem_materiais` com quantidade, nome e unidade
  copiados. Material fora da lista entra só com a descrição (`material_id` nulo).
  Material sai de uso desativado, nunca apagado. A coluna antiga
  `ordens_servico.material` (texto) ficou só para as ordens baixadas antes disso.
- Os pedidos rápidos do "Serviço solicitado" ficam em `SERVICOS_COMUNS`
  (`lib/iluminacao.ts`).

- **Estoque** (`/estoque`, migration 0003). Saldo = entradas − saídas ± acertos,
  calculado na view `v_estoque`:
  - **Entrada:** a nota que chegou (`estoque_entradas`: data, fornecedor, documento)
    e os materiais dela (`estoque_entrada_itens`). Lançou errado: apaga a entrada.
  - **Saída:** ninguém lança. É o `ordem_materiais` das ordens **executadas**. Ordem
    reaberta deixa de contar até ser executada de novo. Material "outros" não conta.
  - **Acerto pela contagem** (`estoque_acertos`): a pessoa informa o que contou e o
    sistema grava a diferença com o motivo.
  - A baixa da ordem **não trava** sem estoque: avisa, e o saldo fica negativo
    ("falta lançar entrada").
  - `materiais.estoque_minimo`: no mínimo, o material aparece como "acabando".
  - O banco de materiais mora em `/estoque/materiais` (o `/iluminacao/materiais`
    redireciona). O seletor com quantidade (`components/escolher-materiais.tsx`)
    serve para a baixa e para a entrada.

- **Relatórios** (`/relatorios`, `lib/relatorios.ts`, migration 0004): 10 tipos, pedidos
  pelo setor em 04/11/2026 (por bairro e por rua vieram em 05/11/2026).
  - Os de **execução** (serviço executado, material usado, data de execução, equipe)
    olham só as ordens executadas, pela `data_execucao`.
  - Os de **pedido** (data de solicitação, localidade, bairro, rua, solicitante,
    concluídos e não concluídos) olham as ordens abertas no período, pela data da
    ficha, com filtro de situação.
  - Os grupos juntam o mesmo texto escrito diferente (maiúscula, acento, espaço).
  - Campos que vieram para isso: `localidade` (obrigatória ao abrir a ordem: "Sede" ou
    o povoado), `equipe` e `servico_executado` (na baixa). `lib/localidades.ts`
    reaproveita a grafia de uma localidade que já existe.
  - `bairro` (migration 0005) é opcional, porque povoado nem sempre tem bairro, e
    reaproveita a grafia igual à localidade. Ordem sem bairro cai em "Bairro não
    informado".
  - O relatório por rua agrupa pelo campo `endereco` junto com a localidade, porque
    a "Rua Principal" da sede e a do povoado são ruas diferentes. Bairro escrito
    dentro do endereço (ordens antigas) parte a rua em outro grupo: não separar
    automaticamente sem perguntar.

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
