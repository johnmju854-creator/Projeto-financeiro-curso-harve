// Cliente do Supabase para o NAVEGADOR (componentes com "use client").
// Ainda não é usado: o login desta etapa roda no servidor (Server Actions).
import { createBrowserClient } from "@supabase/ssr";
import { supabaseKey, supabaseUrl } from "./env";

export function createClient() {
  return createBrowserClient(supabaseUrl(), supabaseKey());
}
