import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { create, getNumericDate } from "https://deno.land/x/djwt@v3.0.1/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Generate a crypto key for JWT signing
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
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const token = url.searchParams.get('token');

    if (!token) {
      return new Response(renderErrorPage('Missing verification token'), {
        status: 400,
        headers: { 'Content-Type': 'text/html' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const jwtSecret = Deno.env.get('JWT_SECRET')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Validate token
    const { data: tokenData, error: tokenError } = await supabase
      .from('verification_tokens')
      .select('*')
      .eq('token', token)
      .single();

    if (tokenError || !tokenData) {
      console.error('Token lookup error:', tokenError);
      return new Response(renderErrorPage('Invalid or expired token'), {
        status: 400,
        headers: { 'Content-Type': 'text/html' },
      });
    }

    // Check if token is already used
    if (tokenData.used) {
      return new Response(renderErrorPage('This verification link has already been used'), {
        status: 400,
        headers: { 'Content-Type': 'text/html' },
      });
    }

    // Check if token is expired
    if (new Date(tokenData.expires_at) < new Date()) {
      return new Response(renderErrorPage('Verification link has expired'), {
        status: 400,
        headers: { 'Content-Type': 'text/html' },
      });
    }

    // Mark token as used
    await supabase
      .from('verification_tokens')
      .update({ used: true })
      .eq('id', tokenData.id);

    // Grant 36-hour access in ad_access table
    const expiresAt = new Date(Date.now() + 36 * 60 * 60 * 1000); // 36 hours from now
    
    // Upsert ad_access record
    const { error: accessError } = await supabase
      .from('ad_access')
      .upsert({
        user_id: tokenData.user_id,
        expires_at: expiresAt.toISOString(),
        granted_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id',
      });

    if (accessError) {
      // If upsert fails due to unique constraint, try insert
      console.log('Upsert failed, trying insert:', accessError);
      await supabase
        .from('ad_access')
        .insert({
          user_id: tokenData.user_id,
          expires_at: expiresAt.toISOString(),
        });
    }

    // Generate JWT valid for 36 hours
    const key = await getJwtKey(jwtSecret);
    const jwt = await create(
      { alg: "HS256", typ: "JWT" },
      {
        sub: tokenData.user_id,
        exp: getNumericDate(36 * 60 * 60), // 36 hours
        iat: getNumericDate(0),
        verified: true,
      },
      key
    );

    // Get the frontend URL from referer or use default
    const frontendUrl = Deno.env.get('FRONTEND_URL') || 'https://erxesybkqdckxlzparjx.lovableproject.com';

    // Redirect to frontend with success and set cookie
    const redirectUrl = `${frontendUrl}/verify-success?verified=true`;
    
    return new Response(null, {
      status: 302,
      headers: {
        'Location': redirectUrl,
        'Set-Cookie': `verification_access=${jwt}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${36 * 60 * 60}`,
      },
    });

  } catch (error) {
    console.error('Verify access error:', error);
    return new Response(renderErrorPage('Verification failed'), {
      status: 500,
      headers: { 'Content-Type': 'text/html' },
    });
  }
});

function renderErrorPage(message: string): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Verification Error</title>
      <style>
        body {
          font-family: system-ui, -apple-system, sans-serif;
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          margin: 0;
          background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
          color: white;
        }
        .container {
          text-align: center;
          padding: 2rem;
          background: rgba(255,255,255,0.1);
          border-radius: 16px;
          backdrop-filter: blur(10px);
        }
        .error-icon {
          font-size: 4rem;
          margin-bottom: 1rem;
        }
        h1 { margin: 0 0 1rem 0; }
        p { opacity: 0.8; }
        a {
          display: inline-block;
          margin-top: 1rem;
          padding: 0.75rem 1.5rem;
          background: #4F46E5;
          color: white;
          text-decoration: none;
          border-radius: 8px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="error-icon">⚠️</div>
        <h1>Verification Failed</h1>
        <p>${message}</p>
        <a href="/">Go to Homepage</a>
      </div>
    </body>
    </html>
  `;
}
