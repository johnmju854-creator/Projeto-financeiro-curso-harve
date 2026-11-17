// Lê a URL e a chave do Supabase de variáveis de ambiente (arquivo .env.local).
// Ficam em funções para dar um erro claro se faltar alguma, em vez de falhar misteriosamente.
// Importante: precisa escrever process.env.NEXT_PUBLIC_... por extenso (o Next troca pelo valor no build).

export function supabaseUrl(): string {
  const valor = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!valor) {
    throw new Error("Falta NEXT_PUBLIC_SUPABASE_URL no .env.local (veja o .env.example).");
  }
  return valor;
}

export function supabaseKey(): string {
  const valor = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!valor) {
    throw new Error("Falta NEXT_PUBLIC_SUPABASE_ANON_KEY no .env.local (veja o .env.example).");
  }
  return valor;
}
