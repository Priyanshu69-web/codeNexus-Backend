import mongoose from "mongoose";

const RoomSchema = new mongoose.Schema({
    roomId: { type: String, required: true, unique: true },
    code: { type: String, default: "// Start coding here..." },
    language: { type: String, default: "javascript" },
    activeUsers: [{
        username: String,
        socketId: String
    }]
}, { timestamps: true });

export default mongoose.model("Room", RoomSchema);
