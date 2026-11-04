-- Campos que os relatórios pedem (04/11/2026):
--
--   localidade        → "Sede" ou o nome do povoado. Preenchida ao abrir a ordem.
--   equipe            → a equipe que foi para a rua (o eletricista executor
--                       continua no campo dele). Preenchida na baixa.
--   servico_executado → o que foi feito de verdade, que pode ser diferente do
--                       pedido ("lâmpada queimada" que era relé). Na baixa.
--
-- As ordens que já existem ficam sem localidade e sem equipe ("não informada"
-- no relatório); as executadas ganham como serviço executado o próprio pedido.

alter table ordens_servico
  add column localidade text,
  add column equipe text,
  add column servico_executado text;

update ordens_servico set servico_executado = servico where situacao = 'executada';

create index ordens_servico_execucao_idx on ordens_servico(data_execucao) where situacao = 'executada';
