import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: Record<string, unknown>;
  userId?: string; // If provided by admin, send to specific user; otherwise send to self
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY')!;
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY')!;
    const vapidSubject = Deno.env.get('VAPID_SUBJECT')!;

    // Authentication check
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      console.error('Missing or invalid authorization header');
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify JWT and get authenticated user
    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await authClient.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims) {
      console.error('Invalid token:', claimsError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const authenticatedUserId = claimsData.claims.sub as string;
    console.log('Authenticated user:', authenticatedUserId);

    // Service client for database operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const payload: PushPayload = await req.json();
    console.log('Received push notification request:', payload);

    // Determine target user
    let targetUserId = payload.userId || authenticatedUserId;

    // If trying to send to someone else or broadcast (no userId = all users), check admin role
    if (payload.userId && payload.userId !== authenticatedUserId) {
      const { data: isAdmin, error: roleError } = await supabase.rpc('has_role', {
        _user_id: authenticatedUserId,
        _role: 'admin'
      });

      if (roleError) {
        console.error('Error checking admin role:', roleError);
        return new Response(
          JSON.stringify({ error: 'Failed to verify permissions' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (!isAdmin) {
        console.error('Non-admin user attempted to send to another user');
        return new Response(
          JSON.stringify({ error: 'Only admins can send notifications to other users' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Get subscriptions for target user only (no broadcast to all users for non-admins)
    const { data: subscriptions, error } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', targetUserId);

    if (error) {
      console.error('Error fetching subscriptions:', error);
      throw error;
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log('No subscriptions found for user:', targetUserId);
      return new Response(
        JSON.stringify({ success: true, sent: 0, message: 'No subscriptions found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${subscriptions.length} subscriptions for user ${targetUserId}`);

    // Import web-push library
    const webPush = await import("https://esm.sh/web-push@3.6.7");

    webPush.setVapidDetails(
      vapidSubject,
      vapidPublicKey,
      vapidPrivateKey
    );

    const notificationPayload = JSON.stringify({
      title: payload.title,
      body: payload.body,
      icon: payload.icon || '/pwa-192.png',
      badge: payload.badge || '/pwa-192.png',
      tag: payload.tag,
      data: payload.data,
    });

    let successCount = 0;
    let failureCount = 0;
    const failedSubscriptions: string[] = [];

    // Send notifications to all subscriptions
    for (const subscription of subscriptions) {
      try {
        const pushSubscription = {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: subscription.p256dh,
            auth: subscription.auth,
          },
        };

        await webPush.sendNotification(pushSubscription, notificationPayload);
        successCount++;
        console.log(`Notification sent successfully to subscription ${subscription.id}`);
      } catch (pushError: unknown) {
        failureCount++;
        const error = pushError as { statusCode?: number };
        console.error(`Failed to send notification to subscription ${subscription.id}:`, pushError);
        
        // If subscription is invalid (410 Gone or 404), mark for deletion
        if (error.statusCode === 410 || error.statusCode === 404) {
          failedSubscriptions.push(subscription.id);
        }
      }
    }

    // Clean up invalid subscriptions
    if (failedSubscriptions.length > 0) {
      console.log(`Cleaning up ${failedSubscriptions.length} invalid subscriptions`);
      await supabase
        .from('push_subscriptions')
        .delete()
        .in('id', failedSubscriptions);
    }

    console.log(`Notifications sent: ${successCount} success, ${failureCount} failed`);

    return new Response(
      JSON.stringify({
        success: true,
        sent: successCount,
        failed: failureCount,
        cleaned: failedSubscriptions.length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error sending push notification:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
