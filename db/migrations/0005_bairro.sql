-- Bairro da ordem de serviço (pedido do dono, 05/11/2026), para o cadastro e
-- para o relatório por bairro.
--
-- É opcional: povoado nem sempre tem bairro. As ordens que já existem ficam sem
-- bairro ("não informado" no relatório); o que estiver escrito dentro do
-- endereço fica como está, nada é separado automaticamente.

alter table ordens_servico add column bairro text;
