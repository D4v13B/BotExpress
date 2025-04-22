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

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_KEY, vertexai: false })
const nameModel = "gemini-2.0-flash"

export async function getResponseGemini(
  message: string,
  historyRow?: HistoryRow[]
) {

   
  const promptData = await getPromptData()

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
