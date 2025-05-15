// middleware.ts
import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

// URL do Supabase e Chave Anon (lidas das variáveis de ambiente)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function middleware(request: NextRequest) {
  // Cria uma resposta inicial baseada na requisição recebida
  // Isso permite que modifiquemos os cookies da resposta posteriormente
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Cria um cliente Supabase específico para o contexto do middleware
  // Ele usa as funções get/set/remove para interagir com os cookies da requisição/resposta
  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        // Função para obter um cookie da requisição
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        // Função para definir um cookie na resposta
        set(name: string, value: string, options: CookieOptions) {
          // Adiciona o cookie à requisição interna para que esteja disponível
          // em Server Components que possam ser renderizados após o middleware
          request.cookies.set({
            name,
            value,
            ...options,
          })
          // Cria uma nova resposta baseada na requisição modificada
          // e define o cookie na resposta que será enviada ao navegador
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        // Função para remover um cookie na resposta
        remove(name: string, options: CookieOptions) {
          // Remove o cookie da requisição interna
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
           // Cria uma nova resposta baseada na requisição modificada
           // e define o cookie (com valor vazio e expirado) na resposta ao navegador
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  // ** Ponto Crítico: Atualiza a sessão **
  // Tenta obter o usuário (o que atualiza o token de sessão se necessário).
  // Isso garante que Server Components subsequentes tenham a sessão mais recente.
  // É ESSENCIAL para a consistência da autenticação.
  await supabase.auth.getUser()

  // Retorna a resposta (potencialmente com cookies atualizados)
  return response
}

// Configuração do Matcher: Define em quais rotas o middleware deve executar.
export const config = {
  matcher: [
    /*
     * Corresponde a todas as rotas de requisição, exceto para:
     * - /api/ : Rotas de API (incluindo /api/auth, /api/webhooks/*)
     * - _next/static : Arquivos estáticos
     * - _next/image : Otimização de imagem
     * - favicon.ico : Arquivo de favicon
     * Sinta-se à vontade para ajustar conforme necessário (ex: adicionar /auth/callback se usar confirmação de email)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
