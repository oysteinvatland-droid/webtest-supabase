import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createClient } from '@/lib/supabase/server';
import { getAdminClub } from '@/lib/club';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let priceId: string | null = null;
  const contentType = request.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    const body = await request.json().catch(() => ({}));
    priceId = body.priceId;
  } else {
    const formData = await request.formData().catch(() => null);
    priceId = formData?.get('priceId') as string ?? null;
  }

  if (!priceId) {
    return NextResponse.json({ error: 'Missing priceId' }, { status: 400 });
  }

  const membership = await getAdminClub(supabase, user.id);
  if (!membership) {
    return NextResponse.json({ error: 'No admin club found' }, { status: 403 });
  }

  const { club } = membership;
  let customerId = club.stripe_customer_id;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      name: club.name,
      metadata: { club_id: club.id },
    });
    customerId = customer.id;

    await supabase
      .from('clubs')
      .update({ stripe_customer_id: customerId })
      .eq('id', club.id);
  }

  const origin = request.headers.get('origin') ?? 'http://localhost:3000';

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${origin}/settings/billing?success=1`,
    cancel_url: `${origin}/pricing`,
    metadata: { club_id: club.id },
  });

  if (!contentType.includes('application/json')) {
    return NextResponse.redirect(session.url!, 303);
  }

  return NextResponse.json({ url: session.url });
}
