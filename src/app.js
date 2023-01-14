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

// Rota POST participants
server.post('/participants', async (req, res) => {
	const { name } = req.body;

    const registeredUser = await db.collection('participants').findOne({ name });
    if (registeredUser) return res.status(409).send('Username already in use');

    // Saving user in database
    await db.collection("participants").insertOne({name: name, lastStatus: Date.now()})

    // Saving entering message in database
	await db.collection('messages').insertOne({
		from: name,
		to: 'Todos',
		text: 'entra na sala...',
		type: 'status',
		time: dayjs(Date.now()).format('hh:mm:ss'),
	});

    res.status(201).send('User successfully logged in ');
});

// Rota GET participants
server.get('/participants', async (req, res) => {
	const users = await db.collection('participants').find().toArray();
	res.send(users);
});


// Rota POST messages
server.post('/messages', async (req, res) => {
	const { to, text, type } = req.body;
    const from = req.headers.user;

    const loggedUser = await db.collection('participants').findOne({ from });
    if (loggedUser) return res.status(422).send('Unregistered user');

    await db.collection('messages').insertOne({
		from,
		to,
		text,
		type,
		time: dayjs(Date.now()).format('hh:mm:ss'),
	});

    res.status(201).send('Message posted successfully');
});