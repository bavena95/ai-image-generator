// lib/supabase/server.ts
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies, type ReadonlyRequestCookies } from 'next/headers' // Importa o tipo ReadonlyRequestCookies

// Modifica a função para aceitar um cookieStore opcional
export function createClient(cookieStoreParam?: ReadonlyRequestCookies) {
  // Usa o cookieStore passado como parâmetro, ou obtém um novo se não for fornecido
  const cookieStore = cookieStoreParam || cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          // Usa o cookieStore (passado ou obtido localmente)
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          // --- CORREÇÃO: Remove try...catch ---
          // Tenta definir o cookie diretamente. Se falhar em Server Action,
          // o middleware ainda deve lidar com isso.
          cookieStore.set({ name, value, ...options })
          // ------------------------------------
        },
        remove(name: string, options: CookieOptions) {
          // --- CORREÇÃO: Remove try...catch ---
          // Tenta remover o cookie diretamente.
          cookieStore.set({ name, value: '', ...options })
          // ------------------------------------
        },
      },
    }
  )
}
