import express from "express"
import cors from "cors"
import dotenv from "dotenv"
import { MongoClient, ObjectId } from "mongodb"
import dayjs from 'dayjs'

dotenv.config()

// Server configs
const PORT = 5000
const server = express()

server.use(express.json());
server.use(cors());
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`)
})

// Mongo configs
const mongoClient = new MongoClient(process.env.DATABASE_URL);
let db;

try {
	await mongoClient.connect();
	db = mongoClient.db();  
    console.log("Successfully connected to the database"); 
} catch (err) {
	console.log(err.message);
}

server.get('/participants', async (req, res) => {
	const users = await db.collection('participants').find().toArray();
	res.send(users);
});