import jwt from "jsonwebtoken";
import User from "../models/user.js";

//verify route
export const protectRoute = async (req, res, next) => {
    try {
        const token = req.header('token') || req.headers['token'] || req.header('authorization');

        if (!token) return res.status(401).json({ message: 'Token not provided' });

        // support `Authorization: Bearer <token>` as well as a raw `token` header
        const rawToken = token.startsWith('Bearer ') ? token.split(' ')[1] : token;

        const decode = jwt.verify(rawToken, process.env.JWT_SECRET);

        const user = await User.findById(decode.userId).select("-password");

        if (!user) return res.status(400).json({ message: "User not found" });

        req.user = user;
        next();
    } catch (error) {
        console.log("error msg", error.message);
        res.status(401).json({ message: error.message });
    }
}