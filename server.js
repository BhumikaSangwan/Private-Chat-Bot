import express from "express";
import http from "http";
import {Server} from "socket.io";
import path from "path";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 9000;
const httpServer = http.createServer(app);
const socketServer = new Server(httpServer, {
    cors: { origin: "*" } 
});

let connectedUsers = [];

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

app.get('/script.js', (req, res) => {
    res.sendFile(__dirname + '/public/script.js')
})

socketServer.on("connection", (socket) => {
    console.log("New connection:", socket.id);

    socket.on("join", ({userId, username}) => {
        console.log(`${userId} joined with socket ID: ${socket.id}`);

        if (connectedUsers.length >= 2) {
            connectedUsers = []; 
            socketServer.emit("reload"); 
        }

        connectedUsers.push({ userId: userId, username: username, socketId: socket.id });
        console.log(connectedUsers);

        if (connectedUsers.length === 1) {
            socket.emit("waiting", "Waiting for another user...");
        }

        if (connectedUsers.length === 2) {
            socketServer.to(connectedUsers[0].socketId).emit("ready", "Chat started!");
            socketServer.to(connectedUsers[1].socketId).emit("ready", "Chat started!");
        }
    });

    socket.on("sendMessage", ({ message }) => {
        if (connectedUsers.length === 2) {
            let receiver = connectedUsers.find(user => user.socketId !== socket.id);
            if (receiver) {
                socketServer.to(receiver.socketId).emit("receiveMessage", {
                    message,
                    from: connectedUsers.find(user => user.socketId === socket.id).username
                });
            }
        }
    });

    socket.on("disconnect", () => {
        console.log(`User disconnected: ${socket.id}`);

        connectedUsers = connectedUsers.filter(user => user.socketId !== socket.id);

        if (connectedUsers.length === 1) {
            socketServer.to(connectedUsers[0].socketId).emit("waiting", "Other user disconnected. Reload to start again.");
        }
    });
});

httpServer.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
