import express from "express";
import Room from "../models/Room.js";
import Message from "../models/Message.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// @desc    Get room details
// @route   GET /api/room/:roomId
// @access  Private
router.get("/:roomId", protect, async (req, res) => {
    try {
        const room = await Room.findOne({ roomId: req.params.roomId });
        if (!room) {
            return res.status(404).json({ message: "Room not found" });
        }
        res.status(200).json(room);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get room messages
// @route   GET /api/room/:roomId/messages
// @access  Private
router.get("/:roomId/messages", protect, async (req, res) => {
    try {
        const messages = await Message.find({ roomId: req.params.roomId })
            .sort({ createdAt: 1 })
            .limit(100);
        res.status(200).json(messages);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;
