import { NextResponse } from 'next/server';
import CryptoJS from 'crypto-js';

const providerEndpoints = {
  openai: 'https://api.openai.com/v1/chat/completions',
  anthropic: 'https://api.anthropic.com/v1/messages',
  google: 'https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent',
  groq: 'https://api.groq.com/openai/v1/chat/completions',
  mistral: 'https://api.mistral.ai/v1/chat/completions',
  openrouter: 'https://openrouter.ai/api/v1/chat/completions'
};

const providerHeaders = {
  openai: (key: string) => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${key}`
  }),
  anthropic: (key: string) => ({
    'Content-Type': 'application/json',
    'x-api-key': key,
    'anthropic-version': '2023-06-01'
  }),
  google: (key: string) => ({
    'Content-Type': 'application/json',
    'x-goog-api-key': key
  }),
  groq: (key: string) => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${key}`
  }),
  mistral: (key: string) => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${key}`
  }),
  openrouter: (key: string) => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${key}`,
    'HTTP-Referer': 'https://omnillm.com',
    'X-Title': 'OmniLLM'
  })
};

const providerRequestBodies = {
  openai: (model: string, messages: any[]) => ({
    model,
    messages
  }),
  anthropic: (model: string, messages: any[]) => ({
    model,
    messages: messages.map(msg => ({
      role: msg.role,
      content: msg.content
    }))
  }),
  google: (model: string, messages: any[]) => ({
    contents: messages.map(msg => ({
      role: msg.role === 'assistant' ? 'model' : msg.role,
      parts: [{ text: msg.content }]
    }))
  }),
  groq: (model: string, messages: any[]) => ({
    model,
    messages
  }),
  mistral: (model: string, messages: any[]) => ({
    model,
    messages
  }),
  openrouter: (model: string, messages: any[]) => ({
    model,
    messages
  })
};

export async function POST(request: Request) {
  try {
    const { provider, model, messages, encryptedKey } = await request.json();

    if (!provider || !model || !messages || !encryptedKey) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const bytes = CryptoJS.AES.decrypt(encryptedKey, process.env.NEXT_PUBLIC_ENCRYPTION_SALT!);
    const key = bytes.toString(CryptoJS.enc.Utf8);

    const endpoint = providerEndpoints[provider as keyof typeof providerEndpoints];
    const headers = providerHeaders[provider as keyof typeof providerHeaders](key);
    const body = providerRequestBodies[provider as keyof typeof providerRequestBodies](model, messages);

    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      if (response.status === 401) {
        return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });
      } else if (response.status === 429) {
        return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
      }
      return NextResponse.json({ error: 'Failed to fetch from provider' }, { status: response.status });
    }

    const reader = response.body?.getReader();
    const stream = new ReadableStream({
      async start(controller) {
        while (true) {
          const { done, value } = await reader!.read();
          if (done) break;
          controller.enqueue(value);
        }
        controller.close();
      }
    });

    return new NextResponse(stream, {
      headers: { 'Content-Type': 'text/event-stream' }
    });
  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}