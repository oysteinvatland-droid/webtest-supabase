import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { getAdminClient } from '@/lib/supabase/admin';
import { getPlanFromPriceId } from '@/lib/stripe-helpers';

export const dynamic = 'force-dynamic';

const PRICE_TO_PLAN: Record<string, string> = {
  [process.env.STRIPE_PRICE_BASIC ?? '']: 'basic',
  [process.env.STRIPE_PRICE_PREMIUM ?? '']: 'premium',
};

export async function POST(request: Request) {
  const body = await request.text();
  const sig = request.headers.get('stripe-signature');

  if (!sig) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    console.error('Webhook signature error:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  console.log('[webhook] SUPABASE_URL set:', !!process.env.NEXT_PUBLIC_SUPABASE_URL);
  console.log('[webhook] SERVICE_ROLE_KEY length:', process.env.SUPABASE_SERVICE_ROLE_KEY?.length ?? 0);
  console.log('[webhook] SERVICE_ROLE_KEY prefix:', process.env.SUPABASE_SERVICE_ROLE_KEY?.slice(0, 10));
  const supabase = getAdminClient();

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      const clubId = session.metadata?.club_id;
      console.log('[webhook] checkout.session.completed clubId:', clubId, 'subscription:', session.subscription);
      if (!clubId || !session.subscription) break;

      const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
      const priceId = subscription.items.data[0]?.price.id;
      const plan = getPlanFromPriceId(priceId, PRICE_TO_PLAN);
      console.log('[webhook] priceId:', priceId, '→ plan:', plan, 'PRICE_TO_PLAN keys:', Object.keys(PRICE_TO_PLAN));

      const { error } = await supabase.from('clubs').update({ plan }).eq('id', clubId);
      if (error) console.error('[webhook] clubs update error:', error);
      else console.log('[webhook] clubs updated to plan:', plan);
      break;
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object;
      const customer = await stripe.customers.retrieve(subscription.customer as string);
      if (customer.deleted) break;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const clubId = (customer as any).metadata?.club_id;
      console.log('[webhook] subscription.updated clubId:', clubId);
      if (!clubId) break;

      const priceId = subscription.items.data[0]?.price.id;
      const plan = getPlanFromPriceId(priceId, PRICE_TO_PLAN);
      console.log('[webhook] priceId:', priceId, '→ plan:', plan);
      const { error } = await supabase.from('clubs').update({ plan }).eq('id', clubId);
      if (error) console.error('[webhook] clubs update error:', error);
      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object;
      const customer = await stripe.customers.retrieve(subscription.customer as string);
      if (customer.deleted) break;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const clubId = (customer as any).metadata?.club_id;
      if (!clubId) break;

      const { error } = await supabase.from('clubs').update({ plan: 'free' }).eq('id', clubId);
      if (error) console.error('[webhook] clubs update error (deleted):', error);
      break;
    }
  }

  return NextResponse.json({ received: true });
}
