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

interface PaymentRequest {
  amount: number;
  description: string;
  payment_type: 'deposit' | 'subscription' | 'bet_payment';
  external_id?: string;
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
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { amount, description, payment_type, external_id }: PaymentRequest = await req.json();

    // Validate parameters
    if (!amount || amount < 1) {
      return new Response(JSON.stringify({ error: 'Invalid amount' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!description || !payment_type) {
      return new Response(JSON.stringify({ error: 'Missing required parameters' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get user from auth token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: getUserError } = await supabase.auth.getUser(token);

    if (getUserError || !user) {
      console.error('Auth error:', getUserError);
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get or create customer
    let { data: customer, error: getCustomerError } = await supabase
      .from('abacatepay_customers')
      .select('customer_id')
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .maybeSingle();

    if (getCustomerError) {
      console.error('Error fetching customer:', getCustomerError);
      return new Response(JSON.stringify({ error: 'Database error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!customer) {
      // Create new customer
      const customerId = `customer_${user.id}_${Date.now()}`;
      const { error: createCustomerError } = await supabase
        .from('abacatepay_customers')
        .insert({
          user_id: user.id,
          customer_id: customerId,
          email: user.email!,
          name: user.user_metadata?.name || user.email!.split('@')[0],
        });

      if (createCustomerError) {
        console.error('Error creating customer:', createCustomerError);
        return new Response(JSON.stringify({ error: 'Failed to create customer' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      customer = { customer_id: customerId };
    }

    // Create payment with AbacatePay
    const paymentData = {
      amount: Math.round(amount * 100), // Convert to cents
      description,
      customer_email: user.email,
      customer_name: user.user_metadata?.name || user.email!.split('@')[0],
      external_id: external_id || `${payment_type}_${user.id}_${Date.now()}`,
    };

    console.log('Creating payment with AbacatePay:', paymentData);

    const abacatePayResponse = await fetch(`${ABACATEPAY_BASE_URL}/billing/pix`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ABACATEPAY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(paymentData),
    });

    if (!abacatePayResponse.ok) {
      const errorText = await abacatePayResponse.text();
      console.error('AbacatePay API error:', errorText);
      return new Response(JSON.stringify({ error: 'Payment creation failed', details: errorText }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const paymentResponse = await abacatePayResponse.json();
    console.log('AbacatePay response:', paymentResponse);

    // Store payment in database
    const { error: paymentError } = await supabase
      .from('abacatepay_payments')
      .insert({
        payment_id: paymentResponse.id,
        customer_id: customer.customer_id,
        amount: amount,
        currency: 'BRL',
        payment_type,
        pix_code: paymentResponse.pix_code,
        pix_qr_code: paymentResponse.pix_qr_code,
        description,
        external_id: paymentData.external_id,
        status: 'pending',
        expires_at: paymentResponse.expires_at,
      });

    if (paymentError) {
      console.error('Error storing payment:', paymentError);
      return new Response(JSON.stringify({ error: 'Failed to store payment' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Return payment details
    return new Response(JSON.stringify({
      id: paymentResponse.id,
      amount: amount,
      pix_code: paymentResponse.pix_code,
      pix_qr_code: paymentResponse.pix_qr_code,
      expires_at: paymentResponse.expires_at,
      status: 'pending',
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Payment creation error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});