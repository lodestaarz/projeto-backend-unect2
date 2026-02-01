import mongoose from 'mongoose'
import { env } from './env'


export const connectDB = async () => {
    await mongoose.connect(env.mongoUri)
    console.log('MongoDB conectado')
}