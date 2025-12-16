import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    const { messages, imageUrl } = await req.json();
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

    if (!openAIApiKey) {
      console.error('OPENAI_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'AI service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build messages array
    const chatMessages: any[] = [
      {
        role: 'system',
        content: `You are a helpful AI study assistant for students. You help with:
- Explaining concepts in simple terms
- Solving problems step by step
- Providing study tips and strategies
- Answering questions about subjects like Physics, Chemistry, Math, Biology
- Motivating students and keeping them focused

Be friendly, encouraging, and explain things clearly. Use examples when helpful.
If you're shown an image, analyze it and help with any questions, problems, or content shown.
Keep responses concise but thorough. Use Hindi-English mix if the student asks in Hindi.`
      }
    ];

    // Add user messages
    if (messages && Array.isArray(messages)) {
      messages.forEach((msg: any) => {
        if (msg.role === 'user' && imageUrl && msg === messages[messages.length - 1]) {
          // Last user message with image
          chatMessages.push({
            role: 'user',
            content: [
              { type: 'text', text: msg.content || 'What do you see in this image? Help me understand it.' },
              { type: 'image_url', image_url: { url: imageUrl } }
            ]
          });
        } else {
          chatMessages.push({
            role: msg.role,
            content: msg.content
          });
        }
      });
    }

    console.log('Calling OpenAI with', chatMessages.length, 'messages');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: imageUrl ? 'gpt-4o' : 'gpt-4o-mini',
        messages: chatMessages,
        max_tokens: 2048,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI error:', response.status, errorText);
      return new Response(
        JSON.stringify({ error: 'AI service error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const assistantMessage = data.choices[0]?.message?.content || 'Sorry, I could not generate a response.';

    console.log('AI response generated successfully');

    return new Response(
      JSON.stringify({ message: assistantMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('AI chat error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to process request' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
