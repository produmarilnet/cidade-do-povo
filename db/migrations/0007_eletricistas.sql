-- Eletricistas (pedido do dono, 24/11/2026): o cadastro de cada eletricista da
-- iluminação, os materiais de segurança (EPI) entregues a ele e as folgas,
-- faltas, atestados e férias.
--
-- Não é o login do sistema: o eletricista pode não ter usuário. Quem sai da
-- equipe é desligado (ativo = false), nunca apagado — o histórico de EPI fica.

create table eletricistas (
  id              uuid primary key default gen_random_uuid(),
  nome            text not null,
  apelido         text,
  funcao          text,                 -- eletricista, auxiliar, motorista…
  cpf             text,
  telefone        text,
  data_admissao   date not null,
  -- tamanhos, para separar o uniforme e a bota na entrega
  tamanho_camisa  text,
  tamanho_calca   text,
  tamanho_bota    text,
  observacoes     text,
  ativo           boolean not null default true,
  criado_por      uuid references usuarios(id),
  criado_em       timestamptz not null default now(),
  atualizado_em   timestamptz not null default now()
);

-- Cada material de segurança entregue: uma linha por item. Os itens entregues
-- juntos levam a mesma data (é a "ficha de EPI" que o eletricista assina).
create table eletricista_epis (
  id              uuid primary key default gen_random_uuid(),
  eletricista_id  uuid not null references eletricistas(id) on delete cascade,
  data            date not null,
  item            text not null,
  quantidade      int not null default 1 check (quantidade > 0),
  ca              text,                 -- nº do Certificado de Aprovação, se tiver
  observacao      text,
  criado_por      uuid references usuarios(id),
  criado_em       timestamptz not null default now()
);
create index eletricista_epis_idx on eletricista_epis(eletricista_id, data desc);

-- Folga, falta, atestado, férias… de um dia ou de um período (inicio a fim).
create table eletricista_ocorrencias (
  id              uuid primary key default gen_random_uuid(),
  eletricista_id  uuid not null references eletricistas(id) on delete cascade,
  tipo            text not null check (tipo in ('folga', 'falta', 'falta_justificada', 'atestado', 'ferias', 'outro')),
  inicio          date not null,
  fim             date not null,
  observacao      text,
  criado_por      uuid references usuarios(id),
  criado_em       timestamptz not null default now(),
  check (fim >= inicio)
);
create index eletricista_ocorrencias_idx on eletricista_ocorrencias(eletricista_id, inicio desc);
