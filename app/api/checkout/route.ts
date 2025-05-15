import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import Stripe from 'stripe';

// Inicializa o cliente Stripe com a chave secreta (do .env.local)
// Certifique-se de que STRIPE_SECRET_KEY está definida!
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set in environment variables');
}
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20', // Use a versão mais recente da API ou a que preferir
});

// Função para criar o cliente Supabase dentro da API Route
function createSupabaseClient() {
    const cookieStore = cookies();
    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) { return cookieStore.get(name)?.value },
                set(name: string, value: string, options: CookieOptions) {
                     try { cookieStore.set({ name, value, ...options }) } catch (error) { console.warn('Failed to set cookie') }
                },
                remove(name: string, options: CookieOptions) {
                     try { cookieStore.set({ name, value: '', ...options }) } catch (error) { console.warn('Failed to remove cookie') }
                },
            },
        }
    );
}

export async function POST(request: Request) {
  const supabase = createSupabaseClient();

  try {
    // 1. Verificar Autenticação do Usuário
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('Checkout - Erro de autenticação:', authError);
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    const userId = user.id;
    const userEmail = user.email; // Pegar o email para associar ao cliente Stripe
    console.log(`Checkout iniciado por usuário: ${userId}`);

    // 2. Obter o ID do Preço do corpo da requisição
    const { priceId } = await request.json();
    if (!priceId) {
      return NextResponse.json({ error: 'ID do Preço (priceId) é obrigatório' }, { status: 400 });
    }
    console.log(`Checkout para priceId: ${priceId}`);

    // 3. Obter ou Criar Cliente Stripe associado ao Usuário Supabase
    // Verificamos se já temos um stripe_customer_id no perfil do usuário
    let customerId: string | undefined;
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', userId)
      .single();

    if (profileError && profileError.code !== 'PGRST116') { // PGRST116 = 'No rows found' (não é um erro crítico aqui)
        console.error(`Checkout - Erro ao buscar perfil (${userId}):`, profileError);
        // Poderíamos continuar sem customerId ou retornar erro, dependendo da estratégia
    }

    customerId = profileData?.stripe_customer_id;

    // Se não existir um ID de cliente Stripe, cria um novo
    if (!customerId) {
        console.log(`Criando novo cliente Stripe para usuário ${userId}`);
        try {
            const customer = await stripe.customers.create({
                email: userEmail, // Usa o email do usuário Supabase
                metadata: {
                    supabaseUUID: userId, // Link para o ID do usuário Supabase
                },
            });
            customerId = customer.id;
            console.log(`Cliente Stripe ${customerId} criado. Atualizando perfil...`);

            // Salva o novo customerId no perfil do usuário no Supabase
            const { error: updateError } = await supabase
                .from('profiles')
                .update({ stripe_customer_id: customerId })
                .eq('id', userId);

            if (updateError) {
                console.error(`Checkout - Falha ao salvar stripe_customer_id para ${userId}:`, updateError);
                // Não é um erro fatal para o checkout, mas deve ser logado/monitorado
            }
        } catch (stripeError) {
             console.error("Checkout - Erro ao criar cliente Stripe:", stripeError);
             // Considerar se deve parar o checkout ou continuar sem associar cliente
             return NextResponse.json({ error: 'Erro ao configurar dados de pagamento.' }, { status: 500 });
        }
    } else {
        console.log(`Usando cliente Stripe existente: ${customerId} para usuário ${userId}`);
    }


    // 4. Definir URLs de Sucesso e Cancelamento
    // Use as variáveis de ambiente ou defina as URLs completas
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'; // Garanta que esta variável exista ou defina a URL base
    const successUrl = `${baseUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`; // Stripe substitui {CHECKOUT_SESSION_ID}
    const cancelUrl = `${baseUrl}/payment/cancelled`; // Página para onde o usuário vai se cancelar

    // 5. Criar a Sessão de Checkout do Stripe
    console.log("Criando sessão de checkout Stripe...");
    try {
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'], // Métodos de pagamento aceitos
            line_items: [
                {
                    price: priceId, // O ID do preço do produto selecionado
                    quantity: 1, // Quantidade (geralmente 1 para pacotes de crédito)
                },
            ],
            mode: 'payment', // Pagamento único ('subscription' para assinaturas)
            success_url: successUrl,
            cancel_url: cancelUrl,
            customer: customerId, // Associa a sessão ao cliente Stripe (se existir)
            // IMPORTANTE: Passa o ID do usuário Supabase nos metadados
            // para que o webhook saiba quem fez a compra!
            metadata: {
                supabaseUUID: userId,
                priceId: priceId, // Pode ser útil guardar o priceId também
            },
            // Opcional: Coletar endereço de cobrança se necessário
            // billing_address_collection: 'required',
        });

        console.log(`Sessão de checkout ${session.id} criada.`);

        // 6. Retornar a URL da sessão de checkout para o frontend
        if (session.url) {
            return NextResponse.json({ sessionId: session.id, url: session.url });
        } else {
             throw new Error("Stripe não retornou uma URL de sessão.");
        }

    } catch (stripeError) {
        console.error("Checkout - Erro ao criar sessão Stripe:", stripeError);
        const errorMessage = stripeError instanceof Error ? stripeError.message : 'Erro desconhecido do Stripe.';
        return NextResponse.json({ error: `Erro ao iniciar pagamento: ${errorMessage}` }, { status: 500 });
    }

  } catch (error) {
    console.error("[API /api/checkout ERROR]:", error);
    const errorMessage = error instanceof Error ? error.message : 'Ocorreu um erro interno.';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
