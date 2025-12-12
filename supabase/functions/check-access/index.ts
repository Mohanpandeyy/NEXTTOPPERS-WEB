import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { verify } from "https://deno.land/x/djwt@v3.0.1/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, cookie',
  'Access-Control-Allow-Credentials': 'true',
};

async function getJwtKey(secret: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  return await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const jwtSecret = Deno.env.get('JWT_SECRET')!;
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ hasAccess: false, reason: 'Not authenticated' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseAuth = createClient(supabaseUrl, Deno.env.get('SUPABASE_PUBLISHABLE_KEY')!, {
      global: { headers: { Authorization: authHeader } }
    });
    
    const { data: { user }, error: userError } = await supabaseAuth.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ hasAccess: false, reason: 'Invalid user' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check JWT from cookie (if provided in request body)
    const { jwt: jwtFromBody } = await req.json().catch(() => ({}));
    
    // First try JWT validation
    if (jwtFromBody) {
      try {
        const key = await getJwtKey(jwtSecret);
        const payload = await verify(jwtFromBody, key);
        
        if (payload.sub === user.id && payload.verified) {
          return new Response(JSON.stringify({ 
            hasAccess: true, 
            source: 'jwt',
            expiresAt: new Date(Number(payload.exp) * 1000).toISOString()
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      } catch (jwtError) {
        console.log('JWT validation failed:', jwtError);
      }
    }

    // Fallback: Check ad_access table
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data: accessData, error: accessError } = await supabase
      .from('ad_access')
      .select('expires_at')
      .eq('user_id', user.id)
      .single();

    if (accessError || !accessData) {
      return new Response(JSON.stringify({ hasAccess: false, reason: 'No access record' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const expiresAt = new Date(accessData.expires_at);
    const hasAccess = expiresAt > new Date();

    return new Response(JSON.stringify({ 
      hasAccess,
      source: 'database',
      expiresAt: accessData.expires_at,
      remainingHours: hasAccess ? Math.floor((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60)) : 0
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Check access error:', error);
    return new Response(JSON.stringify({ hasAccess: false, error: 'Server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
