import { readFile } from "fs/promises"
import "dotenv/config"
import { HistoryRow } from "@builderbot/database-mysql/dist/types"
import { GoogleGenerativeAI } from "@google/generative-ai"
import { getPromptData } from "~/config/database"

const ai = new GoogleGenerativeAI(process.env.GEMINI_KEY)

export async function getResponseGemini(
   message: string,
   historyRow?: HistoryRow[]
) {
   const model = await ai.getGenerativeModel({ model: "gemini-2.0-flash" })
   // const historyArr = historyRow ? mapHistoryChats(historyRow) : []

   const promptData = await getPromptData()
   const data = await readFile("./prompt.txt", "utf-8")

   const chat = model.startChat({
      history: [
         // ...historyArr,
         {
            role: "user",
            parts: [
               {
                  text: `${promptData}`,
               },
            ],
         },
      ],
   })

   return await chat.sendMessage(message)
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
