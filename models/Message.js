import mongoose from "mongoose";

const MessageSchema = new mongoose.Schema({
    roomId: {
        type: String,
        required: true,
        index: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    username: {
        type: String,
        required: true
    },
    text: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ["chat", "system"],
        default: "chat"
    }
}, { timestamps: true });

export default mongoose.model("Message", MessageSchema);
