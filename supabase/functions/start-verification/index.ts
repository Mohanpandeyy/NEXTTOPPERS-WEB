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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const arolinksApiKey = Deno.env.get('AROLINKS_API_KEY')!;
    
    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseAuth = createClient(supabaseUrl, Deno.env.get('SUPABASE_PUBLISHABLE_KEY')!, {
      global: { headers: { Authorization: authHeader } }
    });
    
    const { data: { user }, error: userError } = await supabaseAuth.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid user' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Generate unique token
    const token = crypto.randomUUID();
    
    // Store token in database (1 hour expiry)
    const { error: insertError } = await supabase
      .from('verification_tokens')
      .insert({
        user_id: user.id,
        token: token,
        used: false,
        expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      });

    if (insertError) {
      console.error('Token insert error:', insertError);
      return new Response(JSON.stringify({ error: 'Failed to create token' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Build callback URL for AroLinks redirect
    const callbackUrl = `${supabaseUrl}/functions/v1/arolinks-callback?token=${token}`;
    const encodedUrl = encodeURIComponent(callbackUrl);
    
    // Call AroLinks API with exact format specified
    // GET https://arolinks.com/api?api=API_KEY&url=ENCODED_URL
    const arolinksEndpoint = `https://arolinks.com/api?api=${arolinksApiKey}&url=${encodedUrl}`;
    
    let shortLink = '';
    
    try {
      console.log('Calling AroLinks API:', arolinksEndpoint.replace(arolinksApiKey, 'HIDDEN'));
      
      const aroResponse = await fetch(arolinksEndpoint, {
        method: 'GET',
      });

      const aroData = await aroResponse.json();
      console.log('AroLinks response:', aroData);
      
      // Response: {"status":"success","shortenedUrl":"https://arolinks.com/xxxxx"}
      if (aroData.status === 'success' && aroData.shortenedUrl) {
        shortLink = aroData.shortenedUrl;
      } else {
        console.log('AroLinks did not return expected format, using fallback');
        shortLink = callbackUrl;
      }
    } catch (aroError) {
      console.error('AroLinks API error:', aroError);
      shortLink = callbackUrl;
    }

    return new Response(JSON.stringify({ 
      token,
      shortLink,
      message: 'Open the link to get your verification code'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Start verification error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
