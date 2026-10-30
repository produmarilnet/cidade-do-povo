-- Cidade do Povo — estrutura inicial: usuários, login e iluminação pública.

-- ── Usuários e login ───────────────────────────────────────────────────────
-- Papéis:
--   admin        → tudo, inclusive cadastrar usuários
--   atendente    → abre e corrige ordens de serviço
--   eletricista  → consulta as ordens e registra o que fez na rua
--   visualizador → só olha
create table usuarios (
  id          uuid primary key default gen_random_uuid(),
  nome        text not null,
  email       text not null unique,
  senha_hash  text not null,
  papel       text not null check (papel in ('admin', 'atendente', 'eletricista', 'visualizador')),
  ativo       boolean not null default true,
  criado_em   timestamptz not null default now()
);

-- O cookie guarda o token; aqui fica só o hash dele.
create table sessoes (
  token_hash  text primary key,
  usuario_id  uuid not null references usuarios(id) on delete cascade,
  expira_em   timestamptz not null,
  criado_em   timestamptz not null default now()
);
create index sessoes_usuario_idx on sessoes(usuario_id);

-- ── Iluminação pública: ordens de serviço ──────────────────────────────────
-- A parte de cima é o pedido (preenchido no atendimento). A de baixo é o que
-- o eletricista fez na rua: vai em branco na ficha impressa e é passada para
-- o sistema quando a ficha volta.
create table ordens_servico (
  id                uuid primary key default gen_random_uuid(),
  numero            serial unique,         -- nº impresso na ficha
  nome              text not null,
  apelido           text,
  telefone          text,
  endereco          text not null,
  numero_casa       text,                  -- texto: "S/N", "120-A"…
  ponto_referencia  text,
  servico           text not null,
  atendente         text not null,
  criado_por        uuid references usuarios(id),
  criado_em         timestamptz not null default now(),  -- a data da ficha
  situacao          text not null default 'aberta' check (situacao in ('aberta', 'executada', 'cancelada')),
  eletricista       text,
  material          text,
  data_execucao     date,
  observacoes       text,
  baixa_por         uuid references usuarios(id),
  atualizado_em     timestamptz not null default now(),
  -- executada precisa dizer quem fez e quando
  check (situacao <> 'executada' or (eletricista is not null and data_execucao is not null))
);
create index ordens_servico_situacao_idx on ordens_servico(situacao, criado_em desc);
