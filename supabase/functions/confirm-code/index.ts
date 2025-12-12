import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { create } from "https://deno.land/x/djwt@v3.0.1/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { token, code } = await req.json();

    if (!token || !code) {
      return new Response(JSON.stringify({ error: 'Token and code are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const jwtSecret = Deno.env.get('JWT_SECRET')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find and validate token with code
    const { data: tokenData, error: tokenError } = await supabase
      .from('verification_tokens')
      .select('*')
      .eq('token', token)
      .eq('code', code)
      .eq('used', false)
      .gt('expires_at', new Date().toISOString())
      .gt('code_expires_at', new Date().toISOString())
      .single();

    if (tokenError || !tokenData) {
      console.error('Token/code validation error:', tokenError);
      return new Response(JSON.stringify({ error: 'Invalid token or code' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Mark token as used
    await supabase
      .from('verification_tokens')
      .update({ used: true })
      .eq('id', tokenData.id);

    // Grant 36-hour access
    const expiresAt = new Date(Date.now() + 36 * 60 * 60 * 1000);
    
    await supabase
      .from('ad_access')
      .upsert({
        user_id: tokenData.user_id,
        granted_at: new Date().toISOString(),
        expires_at: expiresAt.toISOString(),
      }, { onConflict: 'user_id' });

    // Generate JWT (36 hours)
    const encoder = new TextEncoder();
    const keyData = encoder.encode(jwtSecret);
    const key = await crypto.subtle.importKey(
      "raw",
      keyData,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign", "verify"]
    );

    const jwt = await create(
      { alg: "HS256", typ: "JWT" },
      {
        sub: tokenData.user_id,
        exp: Math.floor(expiresAt.getTime() / 1000),
        iat: Math.floor(Date.now() / 1000),
      },
      key
    );

    // Set HttpOnly cookie
    const cookieOptions = [
      `lovable_access=${jwt}`,
      `Path=/`,
      `HttpOnly`,
      `SameSite=Lax`,
      `Max-Age=${36 * 60 * 60}`,
    ];

    // Add Secure flag in production
    if (supabaseUrl.includes('supabase.co')) {
      cookieOptions.push('Secure');
    }

    return new Response(JSON.stringify({ 
      success: true,
      message: 'Access granted for 36 hours',
      expiresAt: expiresAt.toISOString(),
    }), {
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json',
        'Set-Cookie': cookieOptions.join('; '),
      },
    });

  } catch (error) {
    console.error('Confirm code error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
