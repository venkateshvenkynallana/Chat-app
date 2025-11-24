import express from "express";
import "dotenv/config";
import http from "http";
import cors from "cors";
import connectDB from "./lib/db.js"
import userRouter from "./routes/userRoutes.js";
import messageRouter from "./routes/messageRoutes.js";
import { Server } from "socket.io";

//create Express app and HTTP server
const app = express();
const server = http.createServer(app)

//Initilization socket io server
export const io = new Server(server, {
    cors: { origin: "*" }
})

//store online users
export const userSocketMap = {}; //{userId  : socketId}

io.on("connection", (socket) => {
    const userId = socket.handshake.query.userId;
    console.log("User Connected", userId);

    if (userId) userSocketMap[userId] = socket.id;

    //emit online users to all connected clients
    io.emit("getOnlineUsers", Object.keys(userSocketMap));

    socket.on("Disconnet", () => {
        console.log("User Disconnected ", userId);
        delete userSocketMap[userId];
        io.emit("getOnlineUsers", Object.keys(userSocketMap))
    })

})

//Middleware setup
app.use(express.json({ limit: "4mb" }));
app.use(cors());

//Route setup
app.use("/api/status", (req, res) => res.send("Server is live"));
app.use("/api/auth", userRouter);
app.use("/api/messages", messageRouter);

//Connect to mongoDB
await connectDB();

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log("Server is running on PORT: " + PORT));