import { GoogleGenerativeAI } from "@google/generative-ai"

const ai = new GoogleGenerativeAI("AIzaSyDTi0yBiYxcecgZ0vKUqZzUEe9CrhIi1qU")

export async function getResponseGemini(prompt: string) {
   const model = await ai.getGenerativeModel({ model: "gemini-2.0-flash" })

   const chat = model.startChat({
      history: [
         {
            role: "user",
            parts: [{ text: prompt }],
         },
         {
            role: "model",
            parts: [
               {
                  text: `Eres una asistente virtual de una empresa de logística express llamada E-rmez, que opera en Panamá y Chiriquí, con un casillero internacional ubicado en Miami. Tu función es ayudar a los clientes a resolver dudas sobre envíos nacionales e internacionales, calcular tarifas, ofrecer seguimiento de paquetes y explicar cómo funciona el casillero en Miami.
                  El costo del casillero es de $2.50 USD por libra.
                  Atendemos clientes en Ciudad de Panamá y David (Chiriquí).
                  Ofrecemos recolección local y entrega a domicilio.
                  Brinda información clara, amigable y profesional.
                  Si el cliente pregunta por un paquete, solicita número de guía o correo asociado.
                  Si el cliente pregunta por un precio, solicita peso y dimensiones aproximadas del paquete.
                  Mantén siempre un tono cordial, confiable y eficiente. Responde en español neutro.
                  Solo puedes responder preguntas relacionadas a E-rmez, a `,
               },
            ],
         },
      ],
   })

   return await chat.sendMessage(prompt)
}
