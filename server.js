import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import connectDB from "./config/db.js";
import Room from "./models/Room.js";
import Message from "./models/Message.js";
import authRoutes from "./routes/auth.js";
import roomRoutes from "./routes/room.js";
import dotenv from "dotenv";

dotenv.config(); // load .env

// Connect MongoDB
connectDB();

const app = express();
app.use(cors());
app.use(express.json()); // Body parser

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/room", roomRoutes);

const server = http.createServer(app);
const io = new Server(server, { 
    cors: { 
        origin: "*",
        methods: ["GET", "POST"]
    } 
});

io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("join-room", async ({ roomId, username }) => {
        socket.join(roomId);
        console.log(`${username} joined room: ${roomId}`);

        // Find room or create if it doesn't exist
        const room = await Room.findOneAndUpdate(
            { roomId },
            { 
                $setOnInsert: { code: "// Start coding here..." },
                $addToSet: { activeUsers: { username, socketId: socket.id } }
            },
            { upsert: true, new: true }
        );

        // Broadcast user joined
        socket.to(roomId).emit("user-joined", { 
            username, 
            activeUsers: room.activeUsers,
            message: `${username} joined the room`
        });

        // Send current room state to new user
        socket.emit("room-state", {
            code: room.code,
            language: room.language,
            activeUsers: room.activeUsers
        });
    });

    socket.on("code-change", async ({ roomId, code }) => {
        try {
            await Room.findOneAndUpdate({ roomId }, { code });
            socket.to(roomId).emit("code-change", code);
        } catch (err) {
            console.error("Error saving code:", err.message);
        }
    });

    socket.on("language-change", async ({ roomId, language }) => {
        try {
            await Room.findOneAndUpdate({ roomId }, { language });
            socket.to(roomId).emit("language-change", language);
        } catch (err) {
            console.error("Error saving language:", err.message);
        }
    });

    socket.on("send-message", async ({ roomId, userId, username, text }) => {
        try {
            const newMessage = await Message.create({
                roomId,
                user: userId,
                username,
                text,
                type: "chat"
            });
            io.to(roomId).emit("receive-message", newMessage);
        } catch (err) {
            console.error("Error saving message:", err.message);
        }
    });

    socket.on("typing", ({ roomId, username }) => {
        socket.to(roomId).emit("user-typing", { username });
    });

    socket.on("stop-typing", ({ roomId }) => {
        socket.to(roomId).emit("user-stop-typing");
    });

    socket.on("leave-room", async ({ roomId, username }) => {
        socket.leave(roomId);
        const room = await Room.findOneAndUpdate(
            { roomId },
            { $pull: { activeUsers: { socketId: socket.id } } },
            { new: true }
        );
        if (room) {
            socket.to(roomId).emit("user-left", { 
                username, 
                activeUsers: room.activeUsers,
                message: `${username} left the room`
            });
        }
    });

    socket.on("disconnect", async () => {
        console.log("User disconnected:", socket.id);
        const room = await Room.findOneAndUpdate(
            { "activeUsers.socketId": socket.id },
            { $pull: { activeUsers: { socketId: socket.id } } },
            { new: true }
        );
        if (room) {
            socket.to(room.roomId).emit("user-left", { 
                activeUsers: room.activeUsers 
            });
        }
    });
});

app.get("/", (req, res) => {
    res.send("CodeNexus Backend is running...");
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        message: err.message || "Internal Server Error",
        stack: process.env.NODE_ENV === "production" ? null : err.stack
    });
});

const PORT = process.env.PORT || 5000;


server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});