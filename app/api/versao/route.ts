import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/** Versão que está rodando no servidor agora (ver next.config.js). */
export function GET() {
  return NextResponse.json(
    { versao: process.env.VERSAO_DO_APP ?? "" },
    { headers: { "Cache-Control": "no-store" } },
  );
}
