import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { getAdminClub } from '@/lib/club';
import { getMemberLimit } from '@/lib/plan-limits';

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

  const membership = await getAdminClub(supabase, user.id);
  if (!membership) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  const { club, club_id } = membership;
  const limit = getMemberLimit(club.plan);

  const { count } = await supabase
    .from('club_members')
    .select('*', { count: 'exact', head: true })
    .eq('club_id', club_id);

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
    data: { invited_by_club: club.id },
  });

  if (inviteError) {
    return NextResponse.json({ error: inviteError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
