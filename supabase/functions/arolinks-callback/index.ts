import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const token = url.searchParams.get('token');

    console.log('Received callback with token:', token);

    // Get the app URL from environment or use default
    const appUrl = Deno.env.get('APP_URL') || 'https://erxesybkqdckxlzparjx.lovableproject.com';

    if (!token) {
      console.error('Missing token in callback');
      return Response.redirect(`${appUrl}/verify-success?error=missing_token`, 302);
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find and validate token
    const { data: tokenData, error: tokenError } = await supabase
      .from('verification_tokens')
      .select('*')
      .eq('token', token)
      .eq('used', false)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (tokenError || !tokenData) {
      console.error('Token validation error:', tokenError);
      return Response.redirect(`${appUrl}/verify-success?error=invalid_token`, 302);
    }

    console.log('Valid token found for user:', tokenData.user_id);

    // Mark token as used
    const { error: updateError } = await supabase
      .from('verification_tokens')
      .update({
        used: true,
        verified_at: new Date().toISOString(),
        status: 'verified'
      })
      .eq('id', tokenData.id);

    if (updateError) {
      console.error('Token update error:', updateError);
    }

    // Grant 24-hour premium access
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    // Delete any existing access for this user first
    await supabase
      .from('ad_access')
      .delete()
      .eq('user_id', tokenData.user_id);

    // Insert new access
    const { error: accessError } = await supabase
      .from('ad_access')
      .insert({
        user_id: tokenData.user_id,
        granted_at: new Date().toISOString(),
        expires_at: expiresAt,
      });

    if (accessError) {
      console.error('Access grant error:', accessError);
      return Response.redirect(`${appUrl}/verify-success?error=access_failed`, 302);
    }

    console.log('Premium access granted until:', expiresAt);

    // Redirect back to app with success
    return Response.redirect(`${appUrl}/verify-success?success=true`, 302);

  } catch (error) {
    console.error('Callback error:', error);
    const appUrl = Deno.env.get('APP_URL') || 'https://erxesybkqdckxlzparjx.lovableproject.com';
    return Response.redirect(`${appUrl}/verify-success?error=server_error`, 302);
  }
});
