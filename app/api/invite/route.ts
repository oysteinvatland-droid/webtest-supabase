import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js';
import { getMemberLimit } from '@/lib/plan-limits';

function getAdminClient() {
  return createSupabaseAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(request: Request) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const email: string | undefined = body.email;
  if (!email || typeof email !== 'string') {
    return NextResponse.json({ error: 'Missing email' }, { status: 400 });
  }

  const { data: membership } = await supabase
    .from('club_members')
    .select('club_id, clubs(id, name, plan)')
    .eq('user_id', user.id)
    .eq('role', 'admin')
    .single();

  if (!membership) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const club = (membership as any).clubs;
  const plan: string = club?.plan ?? 'free';
  const limit = getMemberLimit(plan);

  const { count } = await supabase
    .from('club_members')
    .select('*', { count: 'exact', head: true })
    .eq('club_id', membership.club_id);

  const currentCount = count ?? 0;

  if (currentCount >= limit) {
    return NextResponse.json(
      {
        error: `Member limit reached (${currentCount}/${limit === Infinity ? '∞' : limit}). Upgrade your plan to invite more members.`,
        upgradeUrl: '/pricing',
      },
      { status: 403 }
    );
  }

  const admin = getAdminClient();
  const { error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, {
    data: { invited_by_club: club?.id },
  });

  if (inviteError) {
    return NextResponse.json({ error: inviteError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
