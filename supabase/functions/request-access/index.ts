import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
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

    // Create authenticated client to get user
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

    // Create service role client for database operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Generate unique token
    const token = crypto.randomUUID();
    
    // Store token in database
    const { error: insertError } = await supabase
      .from('verification_tokens')
      .insert({
        user_id: user.id,
        token: token,
        used: false,
        expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour expiry
      });

    if (insertError) {
      console.error('Token insert error:', insertError);
      return new Response(JSON.stringify({ error: 'Failed to create token' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Build callback URL for after AroLinks verification
    const callbackUrl = `${supabaseUrl}/functions/v1/verify-access?token=${token}`;
    
    // Create AroLinks short link
    // AroLinks API endpoint (placeholder structure - update when docs available)
    // The API typically accepts: api_token, url, and returns a short link
    const arolinksEndpoint = 'https://arow.link/api';
    
    let shortLink = '';
    
    try {
      const aroResponse = await fetch(arolinksEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          api: arolinksApiKey,
          url: callbackUrl,
          // Additional params if needed by AroLinks API
        }),
      });

      const aroData = await aroResponse.json();
      console.log('AroLinks response:', aroData);
      
      // AroLinks typically returns shortenedUrl or short_url
      shortLink = aroData.shortenedUrl || aroData.short_url || aroData.shortlink || aroData.link;
      
      if (!shortLink) {
        // Fallback: use direct callback URL if AroLinks fails
        console.log('AroLinks did not return short link, using direct URL');
        shortLink = callbackUrl;
      }
    } catch (aroError) {
      console.error('AroLinks API error:', aroError);
      // Fallback to direct callback URL
      shortLink = callbackUrl;
    }

    return new Response(JSON.stringify({ 
      shortLink,
      token,
      message: 'Click the link to complete verification'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Request access error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
