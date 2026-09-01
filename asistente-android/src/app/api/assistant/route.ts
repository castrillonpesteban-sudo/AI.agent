import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

interface AssistantRequestBody {
  message: string;
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as AssistantRequestBody;
  const message = body.message?.trim();

  if (!message) {
    return NextResponse.json({ error: 'El mensaje no puede estar vacío.' }, { status: 400 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return NextResponse.json({
      reply:
        'Todavía no hay una clave de Anthropic configurada (ANTHROPIC_API_KEY). ' +
        'Este es un eco de prueba: ' +
        message,
    });
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-5',
      max_tokens: 1024,
      messages: [{ role: 'user', content: message }],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    return NextResponse.json({ error: `Error del asistente: ${errorText}` }, { status: 502 });
  }

  const data = await response.json();
  const reply = data.content?.[0]?.text ?? 'No obtuve respuesta del asistente.';

  return NextResponse.json({ reply });
}
