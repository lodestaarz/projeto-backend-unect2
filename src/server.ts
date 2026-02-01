import app from './app'
import { env } from './config/env'
import { connectDB } from './config/db'

import dotenv from "dotenv";
dotenv.config();


connectDB().then(() => {
    app.listen(env.port, () => {
    console.log(`Servidor rodando na porta ${env.port}`)
    })
})