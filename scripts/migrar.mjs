// Aplica as migrations de db/migrations que ainda não rodaram no banco.
//
// Roda sozinho a cada partida do container (ver Dockerfile), antes do site
// subir. Assim ninguém precisa lembrar de rodar SQL à mão depois do deploy.
// Cada arquivo roda numa transação: se der erro, nada dele fica pela metade e
// o site não sobe — o erro aparece nos logs do EasyPanel.

import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import postgres from "postgres";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("[migrar] DATABASE_URL não definida.");
  process.exit(1);
}

const pasta = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "db", "migrations");
const sql = postgres(url, { max: 1, onnotice: () => {} });

try {
  await sql`
    create table if not exists _migracoes (
      nome text primary key,
      aplicada_em timestamptz not null default now()
    )`;

  const feitas = new Set((await sql`select nome from _migracoes`).map((l) => l.nome));
  const arquivos = (await readdir(pasta)).filter((a) => a.endsWith(".sql")).sort();

  for (const arquivo of arquivos) {
    if (feitas.has(arquivo)) continue;
    const conteudo = await readFile(path.join(pasta, arquivo), "utf8");
    await sql.begin(async (tx) => {
      await tx.unsafe(conteudo);
      await tx`insert into _migracoes (nome) values (${arquivo})`;
    });
    console.log(`[migrar] aplicada ${arquivo}`);
  }
  console.log("[migrar] banco em dia.");
} catch (erro) {
  console.error("[migrar] falhou:", erro);
  process.exitCode = 1;
} finally {
  await sql.end();
}
