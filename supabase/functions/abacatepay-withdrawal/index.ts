import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.49.1';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

const ABACATEPAY_API_KEY = Deno.env.get('ABACATEPAY_API_KEY') || 'abc_dev_sW4hJwZsEUqSUPJuL4S6NBS3';
const ABACATEPAY_BASE_URL = 'https://api.abacatepay.com/v1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

interface WithdrawalRequest {
  amount: number;
  pix_key: string;
  description?: string;
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

    const { amount, pix_key, description = 'Saque FutZone' }: WithdrawalRequest = await req.json();

    // Validate parameters
    if (!amount || amount < 1) {
      return new Response(JSON.stringify({ error: 'Invalid amount' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!pix_key) {
      return new Response(JSON.stringify({ error: 'PIX key is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get user from auth token
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: getUserError } = await supabase.auth.getUser(token);

    if (getUserError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get customer
    const { data: customer, error: getCustomerError } = await supabase
      .from('abacatepay_customers')
      .select('customer_id')
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .single();

    if (getCustomerError || !customer) {
      return new Response(JSON.stringify({ error: 'Customer not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check user balance
    const { data: balanceData, error: balanceError } = await supabase.rpc('get_user_balance', {
      user_id: user.id,
    });

    if (balanceError) {
      console.error('Error checking balance:', balanceError);
      return new Response(JSON.stringify({ error: 'Failed to check balance' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const currentBalance = balanceData || 0;
    if (currentBalance < amount) {
      return new Response(JSON.stringify({ error: 'Insufficient balance' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create withdrawal with AbacatePay
    const withdrawalData = {
      amount: Math.round(amount * 100), // Convert to cents
      pix_key,
      description,
    };

    const abacatePayResponse = await fetch(`${ABACATEPAY_BASE_URL}/payout/pix`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ABACATEPAY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(withdrawalData),
    });

    if (!abacatePayResponse.ok) {
      const errorText = await abacatePayResponse.text();
      console.error('AbacatePay withdrawal error:', errorText);
      return new Response(JSON.stringify({ error: 'Withdrawal creation failed' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const withdrawalResponse = await abacatePayResponse.json();

    // Store withdrawal in database
    const { error: withdrawalError } = await supabase
      .from('abacatepay_withdrawals')
      .insert({
        withdrawal_id: withdrawalResponse.id,
        customer_id: customer.customer_id,
        amount: amount,
        currency: 'BRL',
        pix_key,
        description,
        status: 'pending',
      });

    if (withdrawalError) {
      console.error('Error storing withdrawal:', withdrawalError);
      return new Response(JSON.stringify({ error: 'Failed to store withdrawal' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Deduct amount from user balance immediately
    const { error: deductError } = await supabase.rpc('update_user_balance', {
      user_id: user.id,
      amount_change: -amount,
    });

    if (deductError) {
      console.error('Error updating balance:', deductError);
      return new Response(JSON.stringify({ error: 'Failed to update balance' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Add withdrawal transaction
    const { error: transactionError } = await supabase
      .from('wallet_transactions')
      .insert({
        user_id: user.id,
        type: 'withdrawal',
        amount: -amount,
        description: `Saque via PIX - R$ ${amount.toFixed(2)}`,
        status: 'pending',
      });

    if (transactionError) {
      console.error('Error creating transaction:', transactionError);
    }

    return new Response(JSON.stringify({
      id: withdrawalResponse.id,
      amount: amount,
      pix_key,
      status: 'pending',
      message: 'Withdrawal request created successfully',
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Withdrawal creation error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});