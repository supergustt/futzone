import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.49.1';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

interface SubscriptionRequest {
  action: 'create' | 'cancel' | 'status';
  plan_id?: string;
}

Deno.serve(async (req: Request) => {
  try {
    if (req.method === 'OPTIONS') {
      return new Response(null, {
        status: 200,
        headers: corsHeaders,
      });
    }

    const { action, plan_id }: SubscriptionRequest = await req.json();

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

    switch (action) {
      case 'create':
        return await createSubscription(customer.customer_id, plan_id || 'premium');
      case 'cancel':
        return await cancelSubscription(customer.customer_id);
      case 'status':
        return await getSubscriptionStatus(customer.customer_id);
      default:
        return new Response(JSON.stringify({ error: 'Invalid action' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

  } catch (error: any) {
    console.error('Subscription error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function createSubscription(customerId: string, planId: string) {
  try {
    const now = new Date();
    const trialEnd = new Date(now);
    trialEnd.setDate(trialEnd.getDate() + 3); // 3 days trial

    // Create or update subscription
    const { error: subscriptionError } = await supabase
      .from('abacatepay_subscriptions')
      .upsert({
        customer_id: customerId,
        subscription_id: `sub_${customerId}_${Date.now()}`,
        plan_id: planId,
        amount: 27.90,
        currency: 'BRL',
        trial_start: now.toISOString(),
        trial_end: trialEnd.toISOString(),
        status: 'trial',
      }, {
        onConflict: 'customer_id',
      });

    if (subscriptionError) {
      console.error('Error creating subscription:', subscriptionError);
      throw new Error('Failed to create subscription');
    }

    return new Response(JSON.stringify({
      status: 'trial',
      trial_end: trialEnd.toISOString(),
      amount: 27.90,
      currency: 'BRL',
      message: 'Trial subscription created successfully',
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error creating subscription:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

async function cancelSubscription(customerId: string) {
  try {
    const { error: subscriptionError } = await supabase
      .from('abacatepay_subscriptions')
      .update({
        status: 'canceled',
        cancel_at_period_end: true,
        updated_at: new Date().toISOString(),
      })
      .eq('customer_id', customerId);

    if (subscriptionError) {
      console.error('Error canceling subscription:', subscriptionError);
      throw new Error('Failed to cancel subscription');
    }

    return new Response(JSON.stringify({
      status: 'canceled',
      message: 'Subscription canceled successfully',
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error canceling subscription:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

async function getSubscriptionStatus(customerId: string) {
  try {
    const { data: subscription, error: subscriptionError } = await supabase
      .from('abacatepay_subscriptions')
      .select('*')
      .eq('customer_id', customerId)
      .is('deleted_at', null)
      .maybeSingle();

    if (subscriptionError) {
      console.error('Error fetching subscription:', subscriptionError);
      throw new Error('Failed to fetch subscription');
    }

    if (!subscription) {
      return new Response(JSON.stringify({
        status: 'not_started',
        message: 'No subscription found',
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if trial has expired
    const now = new Date();
    if (subscription.trial_end && new Date(subscription.trial_end) < now && subscription.status === 'trial') {
      // Update subscription to expired
      await supabase
        .from('abacatepay_subscriptions')
        .update({
          status: 'expired',
          updated_at: now.toISOString(),
        })
        .eq('customer_id', customerId);

      subscription.status = 'expired';
    }

    return new Response(JSON.stringify({
      status: subscription.status,
      plan_id: subscription.plan_id,
      amount: subscription.amount,
      currency: subscription.currency,
      trial_start: subscription.trial_start,
      trial_end: subscription.trial_end,
      current_period_start: subscription.current_period_start,
      current_period_end: subscription.current_period_end,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error fetching subscription status:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}