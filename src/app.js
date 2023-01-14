import express from "express"
import cors from "cors"
import dotenv from "dotenv"
import { MongoClient, ObjectId } from "mongodb"
import dayjs from 'dayjs'

const PORT = 5000
const app = express()
let db

dotenv.config()

app.use(cors())
app.use(express.json())
app.listen(PORT, () => {
    console.log(`Initialized server: port ${PORT}`)
})