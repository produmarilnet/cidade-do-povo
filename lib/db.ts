import postgres from "postgres";

// Uma conexão só para o processo inteiro. Em desenvolvimento o Next recarrega
// os módulos a cada alteração; guardar no globalThis evita abrir um pool novo
// a cada salvamento.
const global = globalThis as unknown as { sql?: postgres.Sql };

export const sql =
  global.sql ??
  postgres(process.env.DATABASE_URL ?? "", {
    max: Number(process.env.DB_MAX_CONEXOES ?? 10),
    idle_timeout: 30,
    onnotice: () => {},
    // numeric volta como texto por padrão; aqui vira número do JavaScript.
    // Valores em reais com 2 casas cabem sem perda.
    types: {
      numeric: {
        to: 1700,
        from: [1700],
        serialize: (v: number) => String(v),
        parse: (v: string) => Number(v),
      },
      // date volta como texto "AAAA-MM-DD", sem virar Date (que erraria o dia por causa do fuso).
      date: {
        to: 1082,
        from: [1082],
        serialize: (v: string) => v,
        parse: (v: string) => v,
      },
    },
  });

if (process.env.NODE_ENV !== "production") global.sql = sql;
