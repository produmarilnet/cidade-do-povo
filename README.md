# Cidade do Povo

Sistema de gestão de serviços. Primeiro módulo: **iluminação pública — ordens de serviço**,
com a ficha de atendimento impressa para o eletricista levar para a rua.

## Rodar

1. Um Postgres qualquer e a variável `DATABASE_URL` (ver `.env.example`).
2. `npm install`
3. `npm run migrar` — cria as tabelas.
4. `npm run dev` e abra http://localhost:3000 — no primeiro acesso o sistema pede
   para criar o usuário administrador.

## Publicar (EasyPanel)

- Serviço app a partir do repositório, com o `Dockerfile` daqui (o site atende na porta 80).
- Serviço Postgres no mesmo projeto; a URL interna dele vai em `DATABASE_URL`, no Ambiente do app.
- As migrations rodam sozinhas a cada partida do container.
