import dotenv from "dotenv"
dotenv.config()
import {
   createBot,
   createProvider,
   createFlow,
   addKeyword,
   EVENTS,
} from "@builderbot/bot"
import { MysqlAdapter as Database } from "@builderbot/database-mysql"
import { BaileysProvider as Provider } from "@builderbot/provider-baileys"
import { getResponseGemini } from "./gemini/geminiLLM"

const PORT = process.env.PORT ?? 3008

const adapterDB = new Database({
   host: process.env.MYSQL_DB_HOST as string,
   user: process.env.MYSQL_DB_USER as string,
   database: process.env.MYSQL_DB_NAME as string,
   password: process.env.MYSQL_DB_PASSWORD as string,
   port: 3306,
})

const welcomeFlow = addKeyword<Provider, Database>([EVENTS.WELCOME]).addAction(
   async (ctx, { flowDynamic, provider }) => {
      // const history = await adapterDB.getHistoryByNumber(ctx.from)

      const res = await getResponseGemini(ctx.body)
      await flowDynamic([{ body: res }])
   }
)

const main = async () => {
   const adapterFlow = createFlow([welcomeFlow])

   const adapterProvider = createProvider(Provider)

   const { handleCtx, httpServer } = await createBot({
      flow: adapterFlow,
      provider: adapterProvider,
      database: adapterDB,
   })

   adapterProvider.server.post(
      "/v1/messages",
      handleCtx(async (bot, req, res) => {
         const { number, message, urlMedia } = req.body
         await bot.sendMessage(number, message, { media: urlMedia ?? null })
         return res.end("sended")
      })
   )

   adapterProvider.server.post(
      "/v1/register",
      handleCtx(async (bot, req, res) => {
         const { number, name } = req.body
         await bot.dispatch("REGISTER_FLOW", { from: number, name })
         return res.end("trigger")
      })
   )

   adapterProvider.server.post(
      "/v1/samples",
      handleCtx(async (bot, req, res) => {
         const { number, name } = req.body
         await bot.dispatch("SAMPLES", { from: number, name })
         return res.end("trigger")
      })
   )

   adapterProvider.server.post(
      "/v1/blacklist",
      handleCtx(async (bot, req, res) => {
         const { number, intent } = req.body
         if (intent === "remove") bot.blacklist.remove(number)
         if (intent === "add") bot.blacklist.add(number)

         res.writeHead(200, { "Content-Type": "application/json" })
         return res.end(JSON.stringify({ status: "ok", number, intent }))
      })
   )

   httpServer(+PORT)
}

main()
