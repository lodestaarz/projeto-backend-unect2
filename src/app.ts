import express from 'express'
import cors from 'cors'
import path from 'path'


import userRoutes from './routes/userRoutes'
import petRoutes from './routes/petRoutes'


const app = express()


app.use(express.json())
app.use(cors({ credentials: true, origin: 'http://localhost:3000' }))
app.use(express.static(path.join(__dirname, '..', 'public')))


app.use('/users', userRoutes)
app.use('/pets', petRoutes)


export default app