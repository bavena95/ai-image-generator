import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

// Configuração do Stripe (sem alterações)
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set');
}
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20',
});

// Segredo do Webhook (sem alterações)
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
if (!webhookSecret) {
  throw new Error('STRIPE_WEBHOOK_SECRET is not set');
}

// Configuração do Cliente Supabase Admin (sem alterações)
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
     console.warn("Supabase URL or Service Role Key not set for webhook processing.");
}
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// --- Mapeamentos de Crédito ---

// Mapeamento para compras AVULSAS (One-Time)
// !! IMPORTANTE !! Atualize com seus Price IDs REAIS de pagamento único.
const oneTimePriceIdToCreditsMap: { [key: string]: number } = {
    'price_1PxxxxxxxAVULSOxxxxxxx001': 1,   // Exemplo: R$ 3,40 por 1 crédito
    // Adicione outros Price IDs de pagamento único aqui, se houver...
};

// Mapeamento para planos RECORRENTES (Subscriptions)
// !! IMPORTANTE !! Atualize com seus Price IDs REAIS de assinatura.
const subscriptionPriceIdToCreditsMap: { [key: string]: number } = {
    'price_1PxxxxxxxRECxxxxxxx00A': 10,  // Exemplo: R$ 29,90 por 10 créditos
    'price_1PxxxxxxxRECxxxxxxx00B': 30,  // Exemplo: R$ 79,90 por 30 créditos
    'price_1PxxxxxxxRECxxxxxxx00C': 60,  // Exemplo: R$ 149,90 por 60 créditos
    // Adicione outros Price IDs de assinatura aqui...
};

// --- Função Auxiliar para Adicionar Créditos ---
// Evita repetição de código
async function addCreditsToUser(userId: string, creditsToAdd: number, sourceEvent: string) {
    console.log(`[${sourceEvent}] Attempting to add ${creditsToAdd} credits to user ${userId}`);
    try {
        // 1. Busca os créditos atuais
        const { data: currentProfile, error: fetchError } = await supabaseAdmin
            .from('profiles')
            .select('credits')
            .eq('id', userId)
            .single();

        if (fetchError) {
            console.error(`[${sourceEvent}] Webhook Error: Failed to fetch profile for user ${userId}`, fetchError);
            return false; // Indica falha
        }

        const currentCredits = currentProfile?.credits ?? 0;
        const newCredits = currentCredits + creditsToAdd;

        // 2. Atualiza os créditos
        const { error: updateError } = await supabaseAdmin
            .from('profiles')
            .update({ credits: newCredits })
            .eq('id', userId);

        if (updateError) {
            console.error(`[${sourceEvent}] Webhook Error: Failed to update credits for user ${userId}`, updateError);
            return false; // Indica falha
        }

        console.log(`[${sourceEvent}] Successfully added ${creditsToAdd} credits to user ${userId}. New balance: ${newCredits}`);
        return true; // Indica sucesso

    } catch (dbError) {
        console.error(`[${sourceEvent}] Webhook DB Error for user ${userId}:`, dbError);
        return false; // Indica falha
    }
}


// --- Handler Principal do Webhook ---
export async function POST(request: Request) {
  const body = await request.text();
  const signature = headers().get('stripe-signature');

  if (!signature) {
    console.error("Webhook Error: Missing stripe-signature header");
    return new NextResponse('Missing stripe-signature header', { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    console.log(`Webhook received: ${event.type}`);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error(`Webhook signature verification failed: ${errorMessage}`);
    return new NextResponse(`Webhook Error: ${errorMessage}`, { status: 400 });
  }

  // Manipula os eventos
  switch (event.type) {
    case 'checkout.session.completed': { // Chaves para criar escopo local
      const session = event.data.object as Stripe.Checkout.Session;
      console.log('Processing checkout.session.completed:', session.id);

      const supabaseUUID = session.metadata?.supabaseUUID;
      const priceId = session.metadata?.priceId; // Assumindo que você ainda passa isso nos metadados

      if (!supabaseUUID) {
        console.error(`Webhook Error (checkout): Missing supabaseUUID in metadata for session ${session.id}`);
        return new NextResponse('Missing required metadata', { status: 200 }); // OK para Stripe
      }

      // Verifica se é uma compra AVULSA
      if (priceId && oneTimePriceIdToCreditsMap[priceId]) {
        const creditsToAdd = oneTimePriceIdToCreditsMap[priceId];
        await addCreditsToUser(supabaseUUID, creditsToAdd, event.type);
      }
      // Se for o início de uma ASSINATURA, o evento 'invoice.payment_succeeded'
      // geralmente dispara logo em seguida (ou quase simultaneamente) e cuidará
      // da adição inicial dos créditos da assinatura. Poderíamos adicionar aqui também,
      // mas é mais seguro confiar no 'invoice' para evitar duplicação se ambos chegarem.
      // Se o 'invoice.payment_succeeded' demorar, talvez adicionar aqui seja uma opção,
      // mas requer cuidado extra para não creditar duas vezes.
      else {
          console.log(`Checkout session ${session.id} completed, likely for a subscription setup or unknown priceId '${priceId}'. Waiting for invoice event.`);
      }
      break;
    } // Fim do case 'checkout.session.completed'

    case 'invoice.payment_succeeded': { // Chaves para criar escopo local
      const invoice = event.data.object as Stripe.Invoice;
      console.log('Processing invoice.payment_succeeded:', invoice.id);

      // Verifica se é um pagamento de assinatura (não um pagamento avulso)
      // O billing_reason pode ser 'subscription_create', 'subscription_cycle', 'subscription_update'
      if (invoice.billing_reason?.startsWith('subscription')) {
          const customerId = invoice.customer;
          const priceId = invoice.lines.data[0]?.price?.id; // Pega o Price ID da linha da fatura

          if (!customerId) {
              console.error(`Webhook Error (invoice): Missing customer ID in invoice ${invoice.id}`);
              return new NextResponse('Missing customer ID', { status: 200 }); // OK para Stripe
          }
          if (!priceId || !subscriptionPriceIdToCreditsMap[priceId]) {
              console.error(`Webhook Error (invoice): Invalid or missing subscription priceId ('${priceId}') in invoice ${invoice.id}`);
              return new NextResponse('Invalid or missing subscription priceId', { status: 200 }); // OK para Stripe
          }

          // Busca o usuário Supabase pelo ID do cliente Stripe
          console.log(`Finding Supabase user for Stripe customer ${customerId}`);
          const { data: profile, error: profileError } = await supabaseAdmin
              .from('profiles')
              .select('id') // Seleciona o ID do usuário Supabase (UUID)
              .eq('stripe_customer_id', customerId)
              .single();

          if (profileError || !profile) {
              console.error(`Webhook Error (invoice): Could not find profile for Stripe customer ${customerId}`, profileError);
              return new NextResponse('User profile not found for customer', { status: 200 }); // OK para Stripe
          }

          const supabaseUUID = profile.id;
          const creditsToAdd = subscriptionPriceIdToCreditsMap[priceId];

          // Adiciona os créditos recorrentes
          await addCreditsToUser(supabaseUUID, creditsToAdd, event.type);

      } else {
          console.log(`Invoice ${invoice.id} payment succeeded, but billing_reason is '${invoice.billing_reason}'. Skipping credit update.`);
      }
      break;
    } // Fim do case 'invoice.payment_succeeded'

    // Adicione outros eventos se necessário (ex: cancelamento de assinatura)
    // case 'customer.subscription.deleted':
    //   const subscription = event.data.object as Stripe.Subscription;
    //   // Lógica para talvez remover créditos restantes ou marcar usuário como inativo?
    //   break;

    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  // Retorna 200 OK para o Stripe
  return new NextResponse(JSON.stringify({ received: true }), { status: 200 });
}
