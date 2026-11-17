import type { NextRequest } from "next/server";
import { atualizarSessao } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return atualizarSessao(request);
}

// Só as rotas privadas passam por aqui. "/" e "/login" continuam públicas.
export const config = {
  matcher: [
    "/lancamentos/:path*",
    "/categorias/:path*",
    "/categoria/:path*",
    "/dashboard/:path*",
  ],
};
