import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.49.1';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

interface AbacatePayWebhook {
  id: string;
  status: 'pending' | 'paid' | 'cancelled' | 'expired';
  amount: number;
  external_id?: string;
  customer_email?: string;
  paid_at?: string;
  expires_at: string;
  created_at: string;
}

Deno.serve(async (req: Request) => {
  try {
    if (req.method === 'OPTIONS') {
      return new Response(null, {
        status: 200,
        headers: corsHeaders,
      });
    }

    if (req.method !== 'POST') {
      return new Response('Method not allowed', {
        status: 405,
        headers: corsHeaders,
      });
    }

    const webhook: AbacatePayWebhook = await req.json();
    console.log('AbacatePay webhook received:', webhook);

    EdgeRuntime.waitUntil(handleWebhook(webhook));

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });
  } catch (error: any) {
    console.error('Error processing webhook:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });
  }
});

async function handleWebhook(webhook: AbacatePayWebhook) {
  try {
    // Update payment status
    const { error: paymentError } = await supabase
      .from('abacatepay_payments')
      .update({
        status: webhook.status,
        paid_at: webhook.paid_at ? new Date(webhook.paid_at).toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq('payment_id', webhook.id);

    if (paymentError) {
      console.error('Error updating payment:', paymentError);
      return;
    }

    // If payment was successful, handle specific actions
    if (webhook.status === 'paid') {
      await handleSuccessfulPayment(webhook);
    }

    console.log(`Successfully processed webhook for payment ${webhook.id}`);
  } catch (error) {
    console.error('Error handling webhook:', error);
    throw error;
  }
}

async function handleSuccessfulPayment(webhook: AbacatePayWebhook) {
  try {
    // Get payment details
    const { data: payment, error: getPaymentError } = await supabase
      .from('abacatepay_payments')
      .select(`
        *,
        abacatepay_customers!inner(user_id)
      `)
      .eq('payment_id', webhook.id)
      .single();

    if (getPaymentError || !payment) {
      console.error('Payment not found:', getPaymentError);
      return;
    }

    const userId = payment.abacatepay_customers.user_id;

    // Handle different payment types
    switch (payment.payment_type) {
      case 'deposit':
        await handleDepositPayment(userId, payment.amount);
        break;
      case 'subscription':
        await handleSubscriptionPayment(payment.customer_id, payment.amount);
        break;
      case 'bet_payment':
        await handleBetPayment(userId, payment.amount);
        break;
    }
  } catch (error) {
    console.error('Error handling successful payment:', error);
    throw error;
  }
}

async function handleDepositPayment(userId: string, amount: number) {
  try {
    // Add transaction to user's wallet
    const { error: transactionError } = await supabase
      .from('wallet_transactions')
      .insert({
        user_id: userId,
        type: 'deposit',
        amount: amount,
        description: `Depósito via PIX - R$ ${amount.toFixed(2)}`,
        status: 'completed',
      });

    if (transactionError) {
      console.error('Error creating deposit transaction:', transactionError);
      return;
    }

    // Update user balance
    const { error: balanceError } = await supabase.rpc('update_user_balance', {
      user_id: userId,
      amount_change: amount,
    });

    if (balanceError) {
      console.error('Error updating user balance:', balanceError);
    }

    console.log(`Deposit of R$ ${amount} processed for user ${userId}`);
  } catch (error) {
    console.error('Error handling deposit payment:', error);
    throw error;
  }
}

async function handleSubscriptionPayment(customerId: string, amount: number) {
  try {
    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setMonth(periodEnd.getMonth() + 1); // 1 month subscription

    // Update subscription status
    const { error: subscriptionError } = await supabase
      .from('abacatepay_subscriptions')
      .update({
        status: 'active',
        current_period_start: now.toISOString(),
        current_period_end: periodEnd.toISOString(),
        updated_at: now.toISOString(),
      })
      .eq('customer_id', customerId);

    if (subscriptionError) {
      console.error('Error updating subscription:', subscriptionError);
      return;
    }

    console.log(`Subscription activated for customer ${customerId}`);
  } catch (error) {
    console.error('Error handling subscription payment:', error);
    throw error;
  }
}

async function handleBetPayment(userId: string, amount: number) {
  try {
    // Add transaction for bet payment
    const { error: transactionError } = await supabase
      .from('wallet_transactions')
      .insert({
        user_id: userId,
        type: 'bet_loss',
        amount: -amount,
        description: `Pagamento de aposta - R$ ${amount.toFixed(2)}`,
        status: 'completed',
      });

    if (transactionError) {
      console.error('Error creating bet transaction:', transactionError);
      return;
    }

    console.log(`Bet payment of R$ ${amount} processed for user ${userId}`);
  } catch (error) {
    console.error('Error handling bet payment:', error);
    throw error;
  }
}