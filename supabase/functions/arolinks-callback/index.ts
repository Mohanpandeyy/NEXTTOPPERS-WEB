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

    if (!token) {
      console.error('Missing token in callback');
      return new Response(getErrorHTML('Missing verification token'), {
        status: 400,
        headers: { 'Content-Type': 'text/html; charset=utf-8', ...corsHeaders },
      });
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
      return new Response(getErrorHTML('Invalid or expired verification link'), {
        status: 400,
        headers: { 'Content-Type': 'text/html; charset=utf-8', ...corsHeaders },
      });
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
      return new Response(getErrorHTML('Failed to grant access. Please try again.'), {
        status: 500,
        headers: { 'Content-Type': 'text/html; charset=utf-8', ...corsHeaders },
      });
    }

    console.log('Premium access granted until:', expiresAt);

    // Return success page - access granted!
    return new Response(getSuccessHTML(), {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8', ...corsHeaders },
    });

  } catch (error) {
    console.error('Callback error:', error);
    return new Response(getErrorHTML('Internal server error'), {
      status: 500,
      headers: { 'Content-Type': 'text/html; charset=utf-8', ...corsHeaders },
    });
  }
});

function getSuccessHTML(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Access Granted!</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      padding: 20px;
    }
    .card {
      background: white;
      border-radius: 20px;
      padding: 48px 40px;
      text-align: center;
      box-shadow: 0 25px 80px rgba(0,0,0,0.3);
      max-width: 420px;
      width: 100%;
      animation: slideUp 0.5s ease-out;
    }
    @keyframes slideUp {
      from { opacity: 0; transform: translateY(30px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .icon {
      width: 80px;
      height: 80px;
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 24px;
      animation: bounce 0.6s ease-out 0.3s;
    }
    @keyframes bounce {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.1); }
    }
    .icon svg { width: 40px; height: 40px; color: white; }
    h1 { 
      color: #1f2937; 
      font-size: 28px; 
      margin-bottom: 12px;
      font-weight: 700;
    }
    .subtitle {
      color: #059669;
      font-size: 20px;
      font-weight: 600;
      margin-bottom: 8px;
    }
    p { color: #6b7280; margin-bottom: 24px; line-height: 1.6; }
    .badge {
      display: inline-block;
      background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
      color: #1f2937;
      font-weight: 700;
      padding: 12px 24px;
      border-radius: 50px;
      font-size: 16px;
      margin-bottom: 24px;
      box-shadow: 0 4px 15px rgba(245, 158, 11, 0.3);
    }
    .note {
      font-size: 14px;
      color: #9ca3af;
      background: #f3f4f6;
      padding: 16px;
      border-radius: 12px;
    }
    .close-btn {
      background: #10b981;
      color: white;
      border: none;
      padding: 14px 32px;
      border-radius: 12px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      margin-top: 20px;
      transition: all 0.2s;
    }
    .close-btn:hover { 
      background: #059669;
      transform: translateY(-2px);
      box-shadow: 0 4px 15px rgba(16, 185, 129, 0.4);
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"></path>
      </svg>
    </div>
    <h1>🎉 Access Granted!</h1>
    <div class="subtitle">Premium Unlocked</div>
    <div class="badge">⏱️ 24 Hours Premium Access</div>
    <p>You now have full access to all premium lectures, notes, and materials.</p>
    <div class="note">
      ✨ Go back to the app and refresh the page to start learning!
    </div>
    <button class="close-btn" onclick="window.close()">Close This Tab</button>
  </div>
</body>
</html>`;
}

function getErrorHTML(message: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verification Error</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
      padding: 20px;
    }
    .card {
      background: white;
      border-radius: 20px;
      padding: 48px 40px;
      text-align: center;
      box-shadow: 0 25px 80px rgba(0,0,0,0.3);
      max-width: 420px;
      width: 100%;
    }
    .icon {
      width: 80px;
      height: 80px;
      background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 24px;
    }
    .icon svg { width: 40px; height: 40px; color: white; }
    h1 { color: #1f2937; font-size: 24px; margin-bottom: 12px; }
    p { color: #6b7280; line-height: 1.6; }
    .retry-btn {
      background: #ef4444;
      color: white;
      border: none;
      padding: 14px 32px;
      border-radius: 12px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      margin-top: 24px;
      transition: all 0.2s;
    }
    .retry-btn:hover { background: #dc2626; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"></path>
      </svg>
    </div>
    <h1>Verification Failed</h1>
    <p>${message}</p>
    <button class="retry-btn" onclick="window.close()">Close Tab</button>
  </div>
</body>
</html>`;
}
