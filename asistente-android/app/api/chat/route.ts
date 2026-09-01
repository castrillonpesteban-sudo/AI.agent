import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return new Response("GEMINI_API_KEY no está configurada en las variables de entorno de Vercel/Netlify.", {
        status: 500,
      });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      systemInstruction: `Eres un asistente personal inteligente, empático, atento y altamente resolutivo.
Hablas de forma natural, amigable y concisa en español.
Tus responsabilidades principales son:
1. Ayudar en la organización diaria, recordatorios, dudas, ideas y planificación cotidiana.
2. Dar respuestas útiles, directas y fáciles de leer en formato de chat móvil.
3. Mantener siempre un tono respetuoso, cariñoso y cercano.`,
    });

    const history = (messages.slice(0, -1) || []).map((m: { role: string; content: string }) => ({
      role: m.role === "user" ? "user" : "model",
      parts: [{ text: m.content || "" }],
    }));

    const lastMessage = messages[messages.length - 1]?.content || "";

    const chat = model.startChat({ history });
    const result = await chat.sendMessageStream(lastMessage);

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        try {
          for await (const chunk of result.stream) {
            const text = chunk.text();
            if (text) {
              controller.enqueue(encoder.encode(text));
            }
          }
        } catch (err) {
          controller.error(err);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
      },
    });
  } catch (error: any) {
    console.error("Error en API /api/chat:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Error al procesar el mensaje." }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
