import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

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

    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === "dummy_key_for_testing") {
      // Simulate failure for dummy key or missing key to trigger the fallback
      throw new Error("Missing or invalid API key");
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Formatting history for Gemini SDK
    // The SDK expects { role: "user" | "model", parts: [{ text: string }] }
    let formattedHistory = history.map((msg: any) => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content }],
    }));

    // Gemini requires the history to start with a 'user' message.
    // If the first message is 'model' (like our frontend initial greeting), we drop it.
    if (formattedHistory.length > 0 && formattedHistory[0].role === "model") {
      formattedHistory.shift();
    }

    // Start chat with system prompt in history or as a system instruction (supported in 1.5)
    const chat = model.startChat({
      history: formattedHistory,
      systemInstruction: SYSTEM_PROMPT,
    });

    const result = await chat.sendMessage(message);
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({ success: true, text });
  } catch (error) {
    console.error("Chat API Error:", error);
    // Triggers the fallback message on the frontend
    return NextResponse.json(
      { error: "Uy, hubo un problema. Podés consultarnos directamente por WhatsApp 😊", link: "https://wa.me/543518792797" },
      { status: 500 }
    );
  }
}
