-- Iluminação pública: banco de materiais e o material de cada ordem.
--
-- `materiais` é a lista que aparece na baixa da ordem para escolher com um
-- toque (a lista inicial veio do setor, em 03/11/2026). Material que sai de
-- uso é desativado, não apagado: as ordens antigas continuam apontando para ele.
--
-- `ordem_materiais` é o que foi aplicado em cada ordem, com a quantidade.
-- O nome e a unidade ficam copiados na linha: renomear o material depois não
-- muda o que já foi registrado. Material fora da lista ("outros") entra só
-- com a descrição, sem material_id.

create table materiais (
  id         uuid primary key default gen_random_uuid(),
  nome       text not null unique,
  unidade    text not null default 'un' check (unidade in ('un', 'm')),
  ordem      int not null default 0,       -- posição na lista
  ativo      boolean not null default true,
  criado_em  timestamptz not null default now()
);

create table ordem_materiais (
  id           uuid primary key default gen_random_uuid(),
  ordem_id     uuid not null references ordens_servico(id) on delete cascade,
  material_id  uuid references materiais(id),
  descricao    text not null,
  quantidade   numeric(10,2) not null check (quantidade > 0),
  unidade      text not null default 'un' check (unidade in ('un', 'm')),
  posicao      int not null default 0
);
create index ordem_materiais_ordem_idx on ordem_materiais(ordem_id, posicao);

insert into materiais (nome, unidade, ordem)
select v.nome, v.unidade, v.ordem
from (values
  ('Luminária 30 watts', 'un', 1),
  ('Luminária 50 watts', 'un', 2),
  ('Luminária 60 watts', 'un', 3),
  ('Luminária 75 watts', 'un', 4),
  ('Luminária 100 watts', 'un', 5),
  ('Luminária 120 watts', 'un', 6),
  ('Luminária 135 watts', 'un', 7),
  ('Luminária 150 watts', 'un', 8),
  ('Luminária 200 watts', 'un', 9),
  ('Lâmpada LED bulbo 30 watts', 'un', 10),
  ('Luminária de alumínio aberta', 'un', 11),
  ('Relé N.F.', 'un', 12),
  ('Relé N.A.', 'un', 13),
  ('Chave de I.P.', 'un', 14),
  ('Conector perfurante', 'un', 15),
  ('Base para relé', 'un', 16),
  ('Base para relé individual', 'un', 17),
  ('Bocal de louça', 'un', 18),
  ('Parafuso máquina', 'un', 19),
  ('Braço 1 metro', 'un', 20),
  ('Braço 2 metros', 'un', 21),
  ('Braço 3 metros', 'un', 22),
  ('Elo fusível', 'un', 23),
  ('Bomba 1 CV', 'un', 24),
  ('Bomba 2 CV', 'un', 25),
  ('Bomba 3 CV', 'un', 26),
  ('Bomba 5 CV', 'un', 27),
  ('Bomba 20 CV', 'un', 28),
  ('Quadro de comando para bomba submersa', 'un', 29),
  ('Poste de concreto', 'un', 30),
  ('Poste de ferro', 'un', 31),
  ('Poste de madeira', 'un', 32),
  ('Isolador roldana', 'un', 33),
  ('Armação B1 em aço', 'un', 34),
  ('Cabo duplex 10 mm alumínio', 'm', 35),
  ('Cabo PP 2x1,5 mm', 'm', 36),
  ('Cabo PP 2x2,5 mm', 'm', 37),
  ('Cabo PP 2x4,0 mm', 'm', 38),
  ('Cabo PP 2x6,0 mm', 'm', 39),
  ('Cabo PP 3x2,5 mm', 'm', 40),
  ('Cabo PP 3x4,0 mm', 'm', 41),
  ('Cabo cobre 1,5 mm', 'm', 42),
  ('Cabo cobre 2,5 mm', 'm', 43),
  ('Refletor de evento', 'un', 44),
  ('Disjuntor monofásico', 'un', 45),
  ('Disjuntor trifásico', 'un', 46)
) as v(nome, unidade, ordem);
