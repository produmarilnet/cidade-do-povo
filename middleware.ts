import { NextResponse, type NextRequest } from "next/server";

// Barreira rápida: sem o cookie de sessão nem adianta abrir a tela.
// A conferência de verdade (sessão válida, usuário ativo) é feita no servidor,
// em lib/auth.ts — o middleware não fala com o banco.
export function middleware(req: NextRequest) {
  if (!req.cookies.has("cidade_sessao")) {
    return NextResponse.redirect(new URL("/login", req.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!login|primeiro-acesso|api/versao|_next|favicon.ico|icon.svg).*)"],
};
