// Get the client
import "dotenv/config"
import mysql from "mysql2/promise"

// Create the connection to database
const connection = await mysql.createConnection({
   host: process.env.MYSQL_DB_HOST,
   user: process.env.MYSQL_DB_USER,
   database: process.env.MYSQL_DB_NAME,
   password: process.env.MYSQL_DB_PASSWORD
})

export const getPromptData = async () => {
   try {
      const [results, fields] = await connection.query(
         "SELECT * FROM `prompt` WHERE `prom_id` = 1"
      )

      return results[0].prom_data
   } catch (err) {
      console.log(err)
   }
}
// // Using placeholders
// try {
//    const [results] = await connection.query(
//       "SELECT * FROM `table` WHERE `name` = ? AND `age` > ?",
//       ["Page", 45]
//    )

//    console.log(results)
// } catch (err) {
//    console.log(err)
// }
