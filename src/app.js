import express from "express"
import cors from "cors"
import dotenv from "dotenv"
import { MongoClient, ObjectId } from "mongodb"
import dayjs from 'dayjs'
import joi from 'joi'

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

    const validation = userSchema.validate({name});
    if (!validation) return res.sendStatus(422);

    const registeredUser = await db.collection('participants').findOne({ name });
    if (registeredUser) return res.status(409).send('Username already in use');

    // Saving user in database
    await db.collection("participants").insertOne({ name: name, lastStatus: Date.now() })

    // Saving entering message in database
    await db.collection('messages').insertOne({
        from: name,
        to: 'Todos',
        text: 'entra na sala...',
        type: 'status',
        time: dayjs(Date.now()).format('hh:mm:ss'),
    });

    res.status(201).send('User successfully logged in');
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

    const validation = userSchema.validate({ to, text, type });
    if (!validation) return res.sendStatus(422);

    const loggedUser = await db.collection('participants').findOne({ from });
    if (!loggedUser) return res.status(422).send('Unregistered user');

    await db.collection("messages").insertOne({
        from,
        to,
        text,
        type,
        time: dayjs(Date.now()).format('hh:mm:ss'),
    });

    res.status(201).send("Message posted successfully");
});

// Rota GET messages
server.get('/messages', async (req, res) => {
    const { limit } = req.query;
    const { user } = req.headers;

    const validLimit = Number(limit)

    if (isNaN(validLimit) || validLimit==0) return res.sendStatus(422)

    const messages = await db.collection("messages").find({
        $or:
            [
                { to: "Todos" },
                { to: user },
                { from: user }
            ]
    }).toArray();

    if (limit) return res.send(messages.slice(-limit));

    return res.send(messages);
});

// Rota POST status
server.post('/status', async (req, res) => {
    const { user } = req.headers;

    const userRegistered = await db.collection("participants").findOne({ name: user });
    if (!userRegistered) return res.sendStatus(404);

    await db.collection("participants").updateOne({ name: user }, { $set: { lastStatus: Date.now() } });
    res.sendStatus(200);
});

// Check user activity
setInterval(async () => {
    const thresholdTime = 10000 //ms;

    const allUsers = await db.collection('participants').find().toArray();
    allUsers.forEach(async user => {
        if (Date.now() - user.lastStatus > thresholdTime) {

            await db.collection("participants").deleteOne({ _id: ObjectId(user._id) })

            await db.collection("messages").insertOne({
                from: user.name,
                to: 'Todos',
                text: 'sai da sala...',
                type: 'status',
                time: dayjs(Date.now()).format('hh:mm:ss')
            });
        };
    });

}, 15000);

// Schema validacoes
const userSchema = joi.object({
    name: joi.string().required()
});

const messageSchema = joi.object({
	to: joi.string().required(),
	type: joi.string().valid('message', 'private_message').required(),
    text: joi.string().required()
});