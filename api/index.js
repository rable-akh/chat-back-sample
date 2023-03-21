const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const cors = require("cors");
const uuidv5 = require('uuidv5');
var privns = uuidv5('null', 'usernamelsit', true);
const { Server } = require("socket.io");
const mongoose = require('mongoose');
const usersMod = require('./model/user');
const crypto = require("crypto");
const bodyParser = require('body-parser');

// const { createClient } = require("redis");
const { createAdapter } = require("@socket.io/redis-adapter");

// const { RedisMessageStore } = require("./cores/messageStore");
const msgStore = require('./factory/Chat');

// const pubClient = createClient({ url: "redis://localhost:6379" });
// const subClient = pubClient.duplicate();

// const saveMessage = new RedisMessageStore(pubClient);


const dbConnection = "mongodb://0.0.0.0:27017/chatTest";

const randomId = () => crypto.randomBytes(8).toString("hex");

const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
        transports: ['websocket', 'polling'],
        credentials: true
    },
    pingTimeout: 60000,
    allowEIO3: true,
});


app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json({limit: "60mb"}));

app.use(cors())

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

app.post('/login', async (req, res) => {
    console.log(req.body);
    var cu = await usersMod.findOneAndUpdate({user: req.body.user}, {connected: true})
    if(cu === 0){
        await usersMod.create({
            user: username
        })
        cu = await usersMod.find()
    }
    return res.json(cu)
});

app.get('/users', async (req, res) => {
    
    const userData = await usersMod.find()

    return res.json(userData)
})

app.get('/messages/:id/:idc', async (req, res) => {

    const messages = await msgStore.getUserMesages({
        id: req.params.id,
        to: req.params.idc
    })
    console.log(messages);
    return res.json(messages)
})

// socket middware
// io.use((socket, next) => {

// })

// pubClient.connect()
// io.adapter(createAdapter(pubClient, subClient));

io.use(async (socket, next) => {
    console.log("test", socket.handshake.auth);
    const username = socket.handshake.auth.user;
    if (!username) {
      return next(new Error("invalid username"));
    }
    console.log(`⚡: ${socket.id} current id!`);
    socket.username = username;
    const cu = await usersMod.findOneAndUpdate({user: username}, {connected: true, socketID: socket.id})
    socket.userId = (cu._id).toString();
    const userData = await usersMod.find()
    if(cu === 0){
        await usersMod.create({
            user: username
        })
    }
    
    socket.join(socket.userId)
    next();
});

io.on('connection', async (socket) => {

    console.log(`⚡: ${socket.id} user just connected!`);
    // socket.broadcast.emit("activeUserResponse", async () => {
    //     console.log("start broadcast");
    //     const userData = await usersMod.find()
    //     return userData
    // })
    console.log(`ID : ${socket.userId} user just connected!`);
    socket.join(socket.userId)

    console.log(`USR : ${socket.username} user just connected!`);
    socket.on('users', async (msg) => {
        const cu = await usersMod.findOneAndUpdate({user: msg.user}, {connected: true, socketID: socket.id})
        const userData = await usersMod.find()
        if(cu === 0){
            await usersMod.create({
                user: msg.user
            })
        }
        // io.emit('currentUser', cu)
        io.emit('activeUserResponse', userData)
    })

    socket.on("userLeave", async (msg) => {
        console.log("userLeave", msg);
        await usersMod.updateOne({_id: msg._id}, {connected: false})
        const cu = await usersMod.find()
        io.emit("activeUserResponse", cu)
    })

    socket.on('disconnect', async () => {
        console.log("disconnect");
        await usersMod.updateOne({_id: socket.userId}, {connected: false})
        const cu = await usersMod.find()
        io.emit("userLeave", {id:socket.userId});
        io.emit("activeUserResponse", cu)
    });

    socket.on('typing', (msg) => {
        io.to(msg.to).emit("typingResponse", msg.msg)
    });

    // Calling
    socket.on('call-user', (msg) => {
        console.log('call-user', msg);
        io.to(msg.to).emit("call-made", msg)
    })

    // Made Answer
    socket.on("make-answer", (msg) => {
        console.log("make-answer", msg);
        io.to(msg.to).emit("answer-made", msg)
    })

    socket.on("answer-success", (msg)=> {
        console.log(msg);
        io.to(msg.to).emit("answer-response", msg.msg)
    })

    // fetch existing users
    // const users = [];
    // const [messages, sessions] = await Promise.all([
    //     saveMessage.findMessagesForUser(socket.userID),
    //     // saveMessage.findAllSessions(),
    // ]);
    // const messagesPerUser = new Map();
    // messages.forEach((message) => {
    //     const { from, to } = message;
    //     const otherUser = socket.userId === from ? to : from;
    //     if (messagesPerUser.has(otherUser)) {
    //     messagesPerUser.get(otherUser).push(message);
    //     } else {
    //     messagesPerUser.set(otherUser, [message]);
    //     }
    // });

    socket.on("privateMessage", async (msg) => {
        const message = {
            ...msg,
            from: msg.id,
            create_at: Date.now()
        };
        // await usersMod.updateOne({_id: msg.id}, {connected: true, socketID: msg.socketID})
        // const withUser = await usersMod.findOne({_id: msg.to})
        console.log("withSocket MSG", msg);
        console.log("socket.userId", socket.userId);
        console.log("msg.id", msg.id);
        io.to(msg.to).emit('newMessages', {from: msg.id, new: true})
        io.to(msg.to).to(msg.id).emit("pvtMsgResponse", {
            message: {
                ...msg,
                from: msg.id
            }
        })
        await msgStore.saveMessage(message)
        // await usermsgMod.create({
        //     from: msg.id,
        //     to: msg.to,
        //     text: msg.text
        // })
        // await usermsgMod.create({
        //     from: msg.id,
        //     to: msg.to,
        //     text: msg.text
        // })
        // saveMessage.saveMessage(message)
        // socket.broadcast.to(withUser?.socketID).emit("pvtMsgResponse", {
        //     ...msg,
        //     from: msg._id
        // })
    })

    // socket.on("create", async (data) => {
    //     console.log("Create", data);
    //     // socket.join(data.withId)
    //     // socket.join(data.userId)

    //     // await usersMod.updateOne({_id: data.userId}, {connected: true, socketID: data.socketId})
    //     // await usersMod.updateOne({user: data.withId}, {connected: true, socketID: socket.id})

    //     // const withUser = await usersMod.findOne({_id: data.withId})
    //     // console.log("withUser", withUser);
    //     // console.log("withUser.socketID", withUser.socketID)
    //     // socket.broadcast.to(withUser.socketID).emit("invited", data)
    //     // io.emit("invited", data)
    //     // socket.broadcast.to(withSocket.id).emit("invited",{room:data})
    // })

    // socket.on("joinUser", async (data) => {
    //     console.log("Join User Room", data);
    //     // socket.join(data.withId)
    //     // socket.join(data.userId)
    // })
});

mongoose.set("strictQuery", true);
mongoose
    .connect(dbConnection, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(function (result) {
        console.log("Mongodb running");
    })
    .catch((err) => {
        console.log(err);
    });

server.listen(4000, () => {
    console.log('listening on *:4000');
}); 