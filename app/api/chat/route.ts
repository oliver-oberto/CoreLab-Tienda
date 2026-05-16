import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";

const SYSTEM_PROMPT = `
Sos el asesor de suplementos de CoreLab, una tienda argentina de suplementos deportivos. 
Tu trabajo es ayudar a los clientes a elegir el suplemento ideal de forma personalizada, amigable y sin tecnicismos innecesarios.

Los productos disponibles son:
- Proteínas (Whey): para recuperación muscular y aumento de masa
- Creatina: para fuerza, potencia y rendimiento en entrenamientos intensos
- Pre-Entreno: para energía y enfoque antes de entrenar
- Aminoácidos (BCAAs): para recuperación y reducción de fatiga
- Vitaminas: para salud general y sistema inmune

Reglas:
- Hablá siempre en español, con tono cercano y argentino (tuteo)
- Hacé preguntas de a una por vez
- No recomiendes más de 2 productos a la vez para no abrumar
- Si el cliente dice que es principiante, sé más explicativo
- Si no tenés suficiente info, preguntá antes de recomendar
- Al recomendar, siempre explicá brevemente POR QUÉ ese producto es el indicado
- Al final, siempre ofrecé continuar por WhatsApp: https://wa.me/543518792797
- No inventes productos que no existen en el catálogo
`;

export async function POST(req: NextRequest) {
  try {
    const { history, message } = await req.json();

    if (!process.env.GROQ_API_KEY || process.env.GROQ_API_KEY === "dummy_key_for_testing") {
      throw new Error("Missing or invalid API key");
    }

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    // Formatting history for Groq SDK
    // The SDK expects { role: "system" | "user" | "assistant", content: string }
    const formattedHistory = history.map((msg: any) => ({
      role: msg.role === "assistant" ? "assistant" : "user",
      content: msg.content,
    }));

    // Groq doesn't require us to shift the first 'assistant' message if we want to provide it as context, 
    // but just in case, we'll keep the history clean. 
    // Actually, Groq handles alternating messages just fine. 
    // We just prepend the system prompt to the messages array.
    const messages = [
      { role: "system", content: SYSTEM_PROMPT },
      ...formattedHistory,
      { role: "user", content: message } // add the current message to the end
    ];

    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: messages as any,
      max_tokens: 1000,
    });

    const reply = response.choices[0]?.message?.content || "";

    return NextResponse.json({ success: true, text: reply });
  } catch (error) {
    console.error("Chat API Error:", error);
    // Triggers the fallback message on the frontend
    return NextResponse.json(
      { error: "Uy, hubo un problema. Podés consultarnos directamente por WhatsApp 😊", link: "https://wa.me/543518792797" },
      { status: 500 }
    );
  }
}
