-- Frota (pedido do dono, 24/11/2026): cada veículo da prefeitura com as
-- manutenções feitas e os checklists de saída/inspeção.
--
-- O km atual do veículo não é digitado à parte: é o maior km lançado (no
-- cadastro, numa manutenção ou num checklist). Veículo que sai da frota é
-- desativado, nunca apagado — o histórico fica.

create table veiculos (
  id            uuid primary key default gen_random_uuid(),
  placa         text not null,
  modelo        text not null,          -- "Hilux", "Caminhão cesto aéreo"…
  marca         text,
  ano           int,
  cor           text,
  tipo          text,                   -- carro, caminhonete, caminhão, moto…
  renavam       text,
  chassi        text,
  km_inicial    int not null default 0 check (km_inicial >= 0),  -- km no dia do cadastro
  observacoes   text,
  ativo         boolean not null default true,
  criado_por    uuid references usuarios(id),
  criado_em     timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);
create unique index veiculos_placa_idx on veiculos(upper(replace(placa, '-', '')));

create table veiculo_manutencoes (
  id              uuid primary key default gen_random_uuid(),
  veiculo_id      uuid not null references veiculos(id) on delete cascade,
  data            date not null,
  km              int check (km >= 0),
  tipo            text not null check (tipo in ('preventiva', 'corretiva')),
  servico         text not null,        -- o que foi feito
  oficina         text,
  valor           numeric(12,2) check (valor >= 0),
  -- a próxima (troca de óleo, revisão…): por km, por data ou pelos dois
  proxima_km      int check (proxima_km >= 0),
  proxima_data    date,
  observacao      text,
  criado_por      uuid references usuarios(id),
  criado_em       timestamptz not null default now()
);
create index veiculo_manutencoes_idx on veiculo_manutencoes(veiculo_id, data desc);

-- O checklist: cabeçalho (quando, km, quem) e os itens conferidos em jsonb:
-- [{ "grupo": "Pneus", "item": "Calibragem", "situacao": "ok"|"problema"|"na", "obs": "..." }]
create table veiculo_checklists (
  id            uuid primary key default gen_random_uuid(),
  veiculo_id    uuid not null references veiculos(id) on delete cascade,
  data          date not null,
  km            int check (km >= 0),
  responsavel   text not null,          -- quem conferiu / motorista
  itens         jsonb not null,
  problemas     int not null default 0, -- quantos itens com problema (para a lista)
  observacao    text,
  criado_por    uuid references usuarios(id),
  criado_em     timestamptz not null default now()
);
create index veiculo_checklists_idx on veiculo_checklists(veiculo_id, data desc, criado_em desc);
