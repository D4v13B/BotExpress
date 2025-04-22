// import { readFile } from "fs/promises"
import "dotenv/config"
import { HistoryRow } from "@builderbot/database-mysql/dist/types"
import {
  FunctionCallingConfigMode,
  GenerateContentResponse,
  GoogleGenAI,
} from "@google/genai"
import { getPromptData } from "~/config/database"
import {
  getTrackingState,
  obtenerEstadoDelPaqueteDesdeAPI,
} from "./functionCalling/getTrackingState"
import { log } from "console"

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_KEY, vertexai: false })
const nameModel = "gemini-2.0-flash"

export async function getResponseGemini(
  message: string,
  historyRow?: HistoryRow[]
) {
  const promptData = `Personality:
   Eres un bot de {{ai.business_name}}, cuya tarea es ayudar a los clientes. Tu objetivo principal es generar confianza y guiar a los clientes para que reserven una cita.
   No puede ayudar con cancelaciones o reprogramaciones de citas; informe cortésmente al cliente que no puede ayudarlo con cancelaciones o reprogramaciones, sólo con nuevas reservas. 
   Si desean re agendar les vas a enviar nuevamente el link de agendamiento o haces el proceso de agendamiento nuevamente.
   ---------------------------------------------------------
   Nuestro negocio se dedica a:
   *Compras por internet
   *Servicio de Casillero Miami a Panamá
   *Carga aèrea y marítima
   *Venta de Celulares
   ---------------------------------------------------------
   Nuestros puntos fuertes son:
   *No Cobramos volumen
   *Tenemos vuelos Diarios de Miami a Panamà
   *somos libres de impuestos Ebay y Amazon
   ---------------------------------------------------------
   Productos/Servicios:
   *Servicio casillero
   *Servicio compra online
   *venta celulares y accesorios
   ---------------------------------------------------------
   Promociones/Ofertas:
   *Nuestra tarifa de Casilleros es de $2.95 por libra
   ---------------------------------------------------------
   Ubicación de empresa:
   Contamos con 7 sucursales a nivel nacional.
   *Sucursal de Panamà (Parque Lefevre), su horario es de 8 am a 5 pm.
   *Chorrera, su horario es de 9 am a 6 pm.
   *Penonomè, su horario es de 9 am a 6 pm.
   *Aguadulce, su horario es de 9 am a 6 pm.
   *Chitrè, su horario es de 8 am a 5 pm.
   *Santiago, su horario es de 9 am a 6 pm.
   *David, su horario es de 8 am a 5 pm.
   ---------------------------------------------------------
   Formas de pago:
   *EFECTIVO
   *YAPPY
   *ACH
   ---------------------------------------------------------
   Links e información importante del negocio:
   *Página web: WWW.soypsc.com
   *Link WhatsApp: wa.me/+50767906781
   *Número de Teléfono:+507 67906781
   ---------------------------------------------------------

	 Responde siempre de manera objetiva y corta
   `

  const response = await ai.models.generateContent({
    model: nameModel,
    // contents: "Donde está mi paquete 234553",
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `${promptData}`,
          },
        ],
      },
      {
        role: "user",
        parts: [
          {
            text: `${message}`,
          },
        ],
      },
    ],
    config: {
      tools: [{ functionDeclarations: [getTrackingState()] }],
      toolConfig: {
        functionCallingConfig: {
          mode: FunctionCallingConfigMode.AUTO,
          // allowedFunctionNames: ["obtener_estado_paquete"],
        },
      },
    },
  })

  const functionCall = response?.candidates?.[0]?.content?.parts?.find(
    (part) => part.functionCall
  )?.functionCall

  if (functionCall?.name == "obtener_estado_paquete") {
    const tracking = functionCall.args.trackingNumber as string
    const estadoPaquete = await obtenerEstadoDelPaqueteDesdeAPI(tracking)

    const functionResponse = {
      name: functionCall.name,
      response: {
        tool_call_id: response.candidates[0].content.parts.find(
          (part) => part.functionCall
        ).functionCall.name,
        output: JSON.stringify(estadoPaquete),
      },
    }

    const responseWithFunctionResult: GenerateContentResponse =
      await ai.models.generateContent({
        model: nameModel,
        // contents: [message, { : [functionResponse.response] }],
        contents: [
					{text: promptData},
          { text: message },
          {
            text: JSON.stringify(functionResponse),
          },
        ],
      })

    return responseWithFunctionResult.text // Devolver la respuesta final
  } else {
    return response.text
  }
}

const mapHistoryChats = (historyRow: HistoryRow[]) => {
  const historyArr: { role: string; parts: { text: string }[] }[] = []

  if (historyRow && historyRow.length > 0) {
    historyRow.forEach((e) => {
      if (
        e.keyword &&
        !e.keyword.startsWith("key") &&
        e.answer !== "__call_action__"
      ) {
        historyArr.push({
          role: "user",
          parts: [{ text: e.keyword }],
        })
      }

      if (!e.keyword) {
        historyArr.push({
          role: "model",
          parts: [{ text: e.answer }],
        })
      }
    })
  }

  return historyArr
}
