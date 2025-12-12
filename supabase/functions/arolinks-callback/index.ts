import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  try {
    const url = new URL(req.url);
    const token = url.searchParams.get('token');

    if (!token) {
      return new Response(getErrorHTML('Missing verification token'), {
        status: 400,
        headers: { 'Content-Type': 'text/html' },
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
      return new Response(getErrorHTML('Invalid or expired token'), {
        status: 400,
        headers: { 'Content-Type': 'text/html' },
      });
    }

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const codeExpiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 min expiry

    // Update token with code
    const { error: updateError } = await supabase
      .from('verification_tokens')
      .update({
        code: code,
        code_expires_at: codeExpiresAt,
      })
      .eq('id', tokenData.id);

    if (updateError) {
      console.error('Code update error:', updateError);
      return new Response(getErrorHTML('Failed to generate code'), {
        status: 500,
        headers: { 'Content-Type': 'text/html' },
      });
    }

    // Return success page with code
    return new Response(getSuccessHTML(code), {
      status: 200,
      headers: { 'Content-Type': 'text/html' },
    });

  } catch (error) {
    console.error('Callback error:', error);
    return new Response(getErrorHTML('Internal server error'), {
      status: 500,
      headers: { 'Content-Type': 'text/html' },
    });
  }
});

function getSuccessHTML(code: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verification Code</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 20px;
    }
    .card {
      background: white;
      border-radius: 16px;
      padding: 40px;
      text-align: center;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      max-width: 400px;
      width: 100%;
    }
    .icon {
      width: 64px;
      height: 64px;
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 24px;
    }
    .icon svg { width: 32px; height: 32px; color: white; }
    h1 { color: #1f2937; font-size: 24px; margin-bottom: 8px; }
    p { color: #6b7280; margin-bottom: 24px; }
    .code {
      font-size: 48px;
      font-weight: 700;
      letter-spacing: 8px;
      color: #4f46e5;
      background: #f3f4f6;
      padding: 20px 32px;
      border-radius: 12px;
      margin-bottom: 24px;
      font-family: 'Courier New', monospace;
    }
    .note {
      font-size: 14px;
      color: #9ca3af;
    }
    .copy-btn {
      background: #4f46e5;
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 8px;
      font-size: 16px;
      cursor: pointer;
      margin-bottom: 16px;
      transition: background 0.2s;
    }
    .copy-btn:hover { background: #4338ca; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
      </svg>
    </div>
    <h1>Verification Successful!</h1>
    <p>Copy this code and enter it in the original tab:</p>
    <div class="code" id="code">${code}</div>
    <button class="copy-btn" onclick="copyCode()">Copy Code</button>
    <p class="note">This code expires in 15 minutes.<br>You can close this tab after copying.</p>
  </div>
  <script>
    function copyCode() {
      navigator.clipboard.writeText('${code}');
      document.querySelector('.copy-btn').textContent = 'Copied!';
      setTimeout(() => {
        document.querySelector('.copy-btn').textContent = 'Copy Code';
      }, 2000);
    }
  </script>
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
      border-radius: 16px;
      padding: 40px;
      text-align: center;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      max-width: 400px;
      width: 100%;
    }
    .icon {
      width: 64px;
      height: 64px;
      background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 24px;
    }
    .icon svg { width: 32px; height: 32px; color: white; }
    h1 { color: #1f2937; font-size: 24px; margin-bottom: 8px; }
    p { color: #6b7280; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
      </svg>
    </div>
    <h1>Verification Failed</h1>
    <p>${message}</p>
  </div>
</body>
</html>`;
}
