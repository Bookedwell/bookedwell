import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET - Fetch notifications for current salon
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get current user's salon
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: staff } = await supabase
      .from('staff')
      .select('salon_id')
      .eq('user_id', user.id)
      .single();

    if (!staff) {
      return NextResponse.json({ error: 'No salon found' }, { status: 404 });
    }

    // Fetch notifications
    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get('unread') === 'true';
    const limit = parseInt(searchParams.get('limit') || '20');

    let query = supabase
      .from('notifications')
      .select('*')
      .eq('salon_id', staff.salon_id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (unreadOnly) {
      query = query.eq('read', false);
    }

    const { data: notifications, error } = await query;

    if (error) throw error;

    // Count unread
    const { count: unreadCount } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('salon_id', staff.salon_id)
      .eq('read', false);

    return NextResponse.json({
      notifications: notifications || [],
      unreadCount: unreadCount || 0,
    });
  } catch (error) {
    console.error('Notifications error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// PATCH - Mark notifications as read
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const { notificationIds, markAllRead } = body;

    // Get current user's salon
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: staff } = await supabase
      .from('staff')
      .select('salon_id')
      .eq('user_id', user.id)
      .single();

    if (!staff) {
      return NextResponse.json({ error: 'No salon found' }, { status: 404 });
    }

    if (markAllRead) {
      // Mark all as read
      await supabase
        .from('notifications')
        .update({ read: true, read_at: new Date().toISOString() })
        .eq('salon_id', staff.salon_id)
        .eq('read', false);
    } else if (notificationIds && Array.isArray(notificationIds)) {
      // Mark specific notifications as read
      await supabase
        .from('notifications')
        .update({ read: true, read_at: new Date().toISOString() })
        .eq('salon_id', staff.salon_id)
        .in('id', notificationIds);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Mark read error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
