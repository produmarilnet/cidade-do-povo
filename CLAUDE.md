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
- **Excluir ordem** (pedido de 16/11/2026, permissão `excluirOrdens`: admin e atendente):
  apaga de vez a ordem e o `ordem_materiais` dela, em qualquer situação, depois de uma
  confirmação que diz o que vai junto. Sai da lista e dos relatórios, e o material de
  ordem executada volta ao saldo do estoque. O nº não é reaproveitado. Cancelar continua
  existindo para o pedido que só não vai ser feito.
- **Usuários** (pedido do dono, 19/11/2026, igual ao PRODUMAR): a senha já vem sugerida
  (`gerarSenha` em `components/dados-de-acesso.tsx`) e, ao cadastrar ou trocar a senha,
  aparece o quadro com site, login e senha para "Copiar recado" ou mandar no WhatsApp
  (`wa.me/?text=`, a pessoa escolhe o contato). A ação devolve o `acesso` no `Resultado`.
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

- **Postes com QR Code** (`/postes`, `lib/postes.ts`, migration 0006, pedido de 05/11/2026).
  Cada poste tem um número, que é o da etiqueta, e o QR leva a `/p/<numero>`.
  - **O domínio vai gravado no QR** (`ENDERECO_DO_SITE`): mudar o domínio do sistema deixa
    as etiquetas que já estão na rua apontando para o lugar errado.
  - **Dois jeitos de nascer:** o lote de `/postes/etiquetas` cria só os números
    (`cadastrado_em` nulo). A etiqueta vai colada no poste e o cadastro se completa lendo o
    QR na rua. O `/postes/novo` já nasce com a localização, e a etiqueta sai depois pela ficha.
  - **`/p/<numero>` é a única tela aberta do sistema** (liberada no `middleware.ts`). Quem
    tem login cai na ficha; quem não tem vê só o número da etiqueta e o pedido de conserto
    (decisão do dono, 05/11/2026). Rua, GPS e ordens não aparecem ali.
  - **Pedido do morador** (`app/p/[numero]/actions.ts`): a única server action sem
    `exigirUsuario`. Vira ordem aberta com o endereço do cadastro do poste e o atendente
    `ATENDENTE_QR`, que é o que marca a ordem como vinda do QR (sem coluna nova). Freios:
    só poste cadastrado e ativo, um pedido aberto por poste, `PEDIDOS_QR_POR_HORA` para o
    sistema todo, telefone obrigatório. Não guarda IP.
  - **Etiqueta:** quadrado de 6 × 6 cm, 12 por folha A4, QR de 47 mm. Pedido do dono: só o QR
    e o nome da Prefeitura, sem logo, sem número e sem domínio escritos. Só sai etiqueta de
    número que existe. A quebra de folha fica antes da folha, nunca depois: depois da última
    sairia uma página em branco.
  - **GPS** (`components/leitura-gps.tsx`, `lib/gps.ts`): modelo do Medir cerca do PRODUMAR.
    No cadastro, quem segura o "Continuar" sem GPS é uma caixinha escondida com
    `setCustomValidity`. Ela não pode ser `readOnly`, porque o navegador deixa de conferir.
  - **Ordem:** `ordens_servico.poste_id`, pelo campo opcional "Nº do poste". A ficha do poste
    abre a ordem com o endereço preenchido. Na ficha impressa o poste sai na linha da data,
    para não crescer.
  - **Leitor no site** (`/postes/ler`): `jsqr`, porque o Safari não tem leitor de QR próprio.
    Mapa: Leaflet com OpenStreetMap, em canvas. Localidades e bairros sugeridos juntam
    ordens e postes.
  - Poste sai de uso desativado, nunca apagado: a etiqueta pode estar na rua.

- **Levantamento da iluminação** (`/postes/levantamento`, `lib/levantamento.ts`, migration 0009,
  pedido do dono em 25/11/2026). Os 5.252 pontos do arquivo "São Mateus do Maranhão_Kmz_Geral.kmz"
  do cadastro feito no **GlobalCAD**, para achar o poste na rua pelo celular.
  - Tabela à parte (`levantamento_ip`), só leitura: é a cidade como estava naquele cadastro,
    não se mistura com os postes de QR. Não tem nº de plaqueta: o ponto se chama
    "formulário-ponto" (`codigoDoPonto`), e o mesmo formulário-ponto pode aparecer 2 vezes
    (duas luminárias no mesmo poste).
  - **Busca** por rua, bairro, chave, tipo ou nº do formulário (sem acento, com `translate`);
    "4349573-3" acha o ponto exato. **Perto de mim**: uma leitura do GPS vai na URL
    (`lat`/`lng`) e a lista vem por distância (conta plana, serve na escala da cidade).
  - **Ficha** (`/postes/levantamento/[id]`): os dados, as fotos (ficam no GlobalCAD; o banco
    guarda só o caminho BLOB, `fotoDoPonto` monta o endereço — abrem sem login) e os botões
    que abrem o caminho no **Google Maps** ou no **Mapas do iPhone**. "Abrir ordem neste poste"
    leva à nova ordem com rua, bairro e o ponto/GPS no ponto de referência (`?levantamento=<id>`).
  - **Mapa** (`/postes/levantamento/mapa`): todos os pontos em canvas, os sem lâmpada ou com
    lâmpada quebrada em vermelho, "Onde estou" e `?ver=<id>` para abrir em cima de um.
  - **Fundo dos mapas = satélite** (`lib/camadas-mapa.ts`, pedido de 25/11/2026: ver o poste "onde
    vejo as casas e a rua"): foto da Esri (World_Imagery) com o nome das ruas por cima, sem chave;
    o botão de camadas volta ao OpenStreetMap. Em São Mateus a foto vai só até o **zoom 17**
    (no 18 vem "Map data not yet available"): `maxNativeZoom: 17` e acima disso amplia. Vale
    para o mapa dos postes de QR, o do levantamento e o mapinha da ficha do ponto.
  - Para trocar o levantamento por um arquivo novo: gerar outra migration a partir do KML
    (dentro do KMZ, que é um zip), lendo a tabela HTML da `description` de cada Placemark.

- **Eletricistas** (`/eletricistas`, `lib/eletricistas.ts`, migration 0007, pedido do dono
  em 24/11/2026). Menu "Equipe". Ver: admin, atendente, visualizador; mexer: admin e atendente.
  - **Cadastro** (`eletricistas`): nome, apelido, função, CPF, telefone, admissão e tamanhos
    (camisa, calça, bota, para separar o uniforme). Não é o login: o eletricista pode não
    ter usuário. Quem sai é **desligado** (`ativo = false`), nunca apagado.
  - **Materiais de segurança (EPI)** (`eletricista_epis`): uma linha por item, os entregues
    juntos com a mesma data. A tela marca vários de uma vez (`EPIS_COMUNS` + "outro") com
    quantidade. O nº do CA não é pedido na tela (é de cada material): a coluna sai em branco
    na **Ficha de EPI** impressa (`/eletricistas/[id]/ficha-epi`), uma A4 com a declaração e
    a coluna de assinatura de cada entrega, mais linhas em branco.
  - **Folgas, faltas…** (`eletricista_ocorrencias`): folga, falta, falta justificada, atestado,
    férias e outro, de um dia (`fim = inicio`) ou de um período. A ficha soma os dias de cada
    tipo no ano (período que vira o ano conta a parte de cada ano). A lista mostra quem está
    fora hoje e as faltas (só as sem justificativa) do ano.

- **Frota** (`/frota`, `lib/frota.ts`, migration 0008, pedido do dono em 24/11/2026). Menu
  "Equipe". Ver: todos; checklist: admin, atendente e eletricista (quem dirige); cadastro e
  manutenção: admin e atendente.
  - **Veículo** (`veiculos`): placa (única, com ou sem traço), modelo, tipo, marca, ano, cor,
    Renavam, chassi e o km do dia do cadastro. **Km atual = o maior km lançado** (cadastro,
    manutenção ou checklist), não se digita à parte. Sai da frota desativado, nunca apagado.
  - **Manutenção** (`veiculo_manutencoes`): preventiva ou corretiva, o que foi feito, data, km,
    oficina, valor e a **próxima** (km e/ou data). Vale a próxima da última manutenção lançada
    com próxima; vence pelo que chegar primeiro, "chegando" a 500 km ou 15 dias.
  - **Checklist** (`veiculo_checklists`): quem, data e km; depois um grupo de itens por tela
    (`CHECKLIST`), cada item OK / Problema / Não tem, com "Marcar o resto como OK". O grupo
    "Cesto aéreo" só aparece para veículo com cesto/munck no tipo ou no modelo (`temCesto`).
    Os itens ficam em jsonb (texto copiado) e `problemas` conta os com problema. A folha
    impressa cabe numa A4.
  - **Nome de campo com acento chega estragado na server action** (Next 14): os itens do
    checklist vão como `item:<grupo>-<item>` (posições em `CHECKLIST`). Mudar a ordem da
    lista não estraga os checklists antigos (guardam o texto), mas nunca usar texto com
    acento em `name` de campo.

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
