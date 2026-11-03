-- Estoque de materiais.
--
-- O saldo de cada material do banco (`materiais`) é:
--
--   entradas  (o que chegou: nota, fornecedor — `estoque_entradas` + itens)
--   − saídas  (o que foi aplicado nas ordens de serviço EXECUTADAS — vem
--              sozinho de `ordem_materiais`, ninguém lança saída à mão)
--   ± acertos (a contagem da prateleira não bateu: `estoque_acertos`)
--
-- Ordem reaberta deixa de contar como saída até ser executada de novo.
-- Material "outros" da baixa (sem material_id) não entra no estoque.

alter table materiais
  add column estoque_minimo numeric(10,2) not null default 0 check (estoque_minimo >= 0);

-- A entrada é o cabeçalho (a nota que chegou); os itens são o que veio nela.
create table estoque_entradas (
  id          uuid primary key default gen_random_uuid(),
  data        date not null,
  fornecedor  text,                 -- de quem veio (loja, almoxarifado central…)
  documento   text,                 -- nº da nota fiscal, requisição, empenho…
  observacao  text,
  criado_por  uuid references usuarios(id),
  criado_em   timestamptz not null default now()
);
create index estoque_entradas_data_idx on estoque_entradas(data desc, criado_em desc);

create table estoque_entrada_itens (
  id           uuid primary key default gen_random_uuid(),
  entrada_id   uuid not null references estoque_entradas(id) on delete cascade,
  material_id  uuid not null references materiais(id),
  quantidade   numeric(10,2) not null check (quantidade > 0),
  posicao      int not null default 0
);
create index estoque_entrada_itens_material_idx on estoque_entrada_itens(material_id);
create index estoque_entrada_itens_entrada_idx on estoque_entrada_itens(entrada_id, posicao);

-- Acerto pela contagem: guarda o que foi contado e a diferença que isso deu
-- (positiva = sobrou, negativa = faltou) — o saldo soma só a diferença.
create table estoque_acertos (
  id           uuid primary key default gen_random_uuid(),
  material_id  uuid not null references materiais(id),
  data         date not null,
  contado      numeric(10,2) not null check (contado >= 0),
  diferenca    numeric(10,2) not null check (diferenca <> 0),
  motivo       text not null,
  criado_por   uuid references usuarios(id),
  criado_em    timestamptz not null default now()
);
create index estoque_acertos_material_idx on estoque_acertos(material_id, data);

-- O saldo de cada material, já com as três partes separadas.
create view v_estoque as
select
  m.id, m.nome, m.unidade, m.ordem, m.ativo, m.estoque_minimo,
  coalesce(e.total, 0)::numeric(12,2) as entradas,
  coalesce(s.total, 0)::numeric(12,2) as saidas,
  coalesce(a.total, 0)::numeric(12,2) as acertos,
  (coalesce(e.total, 0) - coalesce(s.total, 0) + coalesce(a.total, 0))::numeric(12,2) as saldo
from materiais m
left join (
  select material_id, sum(quantidade) as total from estoque_entrada_itens group by material_id
) e on e.material_id = m.id
left join (
  select om.material_id, sum(om.quantidade) as total
  from ordem_materiais om
  join ordens_servico o on o.id = om.ordem_id and o.situacao = 'executada'
  where om.material_id is not null
  group by om.material_id
) s on s.material_id = m.id
left join (
  select material_id, sum(diferenca) as total from estoque_acertos group by material_id
) a on a.material_id = m.id;
