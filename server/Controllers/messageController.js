import cloudinary from "../lib/cloudinary.js";
import Message from "../models/message.js";
import User from "../models/user.js"
import { io, userSocketMap } from "../server.js";

//get all users 
export const getUserMessageCount = async (req, res) => {
    try {
        const userId = req.user._id;

        const filteredUser = await User.find({ _id: { $ne: userId } }).select("-password");

        //messages count
        const unSeenMessages = {};
        const promises = filteredUser.map(async (user) => {
            const messages = await Message.find(
                {
                    senderId: user._id,
                    receiverId: userId,
                    seen: false
                }
            );
            if (messages.length > 0) {
                unSeenMessages[user._id] = messages.length;
            }
        })
        await Promise.all(promises);
        res.status(200).json({ user: filteredUser, unSeenMessages })
    } catch (error) {
        console.log("error msg controller", error.message);
        res.status(404).json({ message: error.message });
    }
}

//Get all msg for selected user
export const getMessages = async (req, res) => {
    try {
        const { id: selectedUserId } = req.params;

        const myId = req.user._id;

        const messages = await Message.find({
            $or: [
                { senderId: myId, receiverId: selectedUserId },
                { senderId: selectedUserId, receiverId: myId }
            ]
        })
        await Message.updateMany({ senderId: selectedUserId, receiverId: myId }, { seen: true });

        res.status(200).json({ messages })
    } catch (error) {
        console.log("error get msg ");
        res.status(404).json({ message: error.message })
    }
}

//api to mark msg as seen using id
export const markMsgSeen = async (req, res) => {
    try {
        const { id } = req.params;
        await Message.findByIdAndUpdate(id, { seen: true })
        res.status(200).json({ success: true })
    } catch (error) {
        console.log("error msg user seen");
        res.status(404).json({ message: error.message });
    }
}


//post  send msgs to selected user
export const sendMessage = async (req, res) => {
    try {
        const { text, image } = req.body;
        const receiverId = req.params.id;
        const senderId = req.user._id;

        let imageUrl;
        if (image) {
            const base64 = image.replace(/^data:image\/\w+;base64,/, "");
            const uploadResponse = await cloudinary.uploader.upload
                (
                    `data:image/png;base64,${base64}`
                );
            imageUrl = uploadResponse.secure_url;
        }

        const newMessage = await Message.create({
            receiverId,
            senderId,
            text,
            image: imageUrl
        })

        //emit a new msg to the receiver's socket
        const receiverSocketId = userSocketMap[receiverId];
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("newMessage", newMessage);
        }

        res.status(200).json({ newMessage });

    } catch (error) {
        console.log("error msg :-sending msg", error);
        res.status(404).json({ message: error.message });
    }
}