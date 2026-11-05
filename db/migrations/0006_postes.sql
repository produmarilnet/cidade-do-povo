-- Postes com QR Code (pedido do dono, 05/11/2026): cada poste da cidade ganha um
-- número, uma etiqueta com QR e a localização marcada pelo GPS do celular.
--
-- A linha nasce de dois jeitos:
--   - no lote de etiquetas: só o número, sem localização (cadastrado_em nulo).
--     A etiqueta vai colada no poste e o cadastro se completa lendo o QR na rua;
--   - no "Novo poste": já com a localização.
--
-- Poste sai de uso desativado, nunca apagado: a etiqueta dele pode estar na rua.

create table postes (
  id                uuid primary key default gen_random_uuid(),
  numero            serial unique,            -- nº da etiqueta; o QR leva a /p/<numero>
  latitude          double precision,
  longitude         double precision,
  precisao          double precision,         -- ± metros do GPS na hora de marcar
  localidade        text,                     -- "Sede" ou o povoado, igual à ordem
  bairro            text,
  endereco          text,                     -- só a rua, igual à ordem
  ponto_referencia  text,
  ativo             boolean not null default true,
  criado_por        uuid references usuarios(id),
  criado_em         timestamptz not null default now(),
  cadastrado_por    uuid references usuarios(id),
  cadastrado_em     timestamptz,              -- nulo: etiqueta impressa, poste ainda não marcado
  atualizado_em     timestamptz not null default now(),
  -- cadastrado precisa ter dito onde fica
  check (cadastrado_em is null or (latitude is not null and longitude is not null and localidade is not null and endereco is not null))
);

-- A ordem pode dizer de qual poste é. As ordens que já existem ficam sem poste.
alter table ordens_servico add column poste_id uuid references postes(id);
create index ordens_servico_poste_idx on ordens_servico(poste_id) where poste_id is not null;
