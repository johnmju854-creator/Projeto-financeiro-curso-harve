// Cliente do Supabase para o SERVIDOR (Server Components e Server Actions).
// Lê e grava a sessão nos cookies da requisição.
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { supabaseKey, supabaseUrl } from "./env";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(supabaseUrl(), supabaseKey(), {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Em Server Components não dá para gravar cookies; sem problema,
          // o middleware já renova a sessão a cada visita.
        }
      },
    },
  });
}
