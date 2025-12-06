import jwt from "jsonwebtoken";
import User from "../models/user.js";

//verify route
export const protectRoute = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        console.log("header :-", authHeader)
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ message: "Token not provided" });
        }

        const token = authHeader.split(" ")[1];
        console.log("token :-", token)
        const decode = jwt.verify(token, process.env.JWT_SECRET);

        const user = await User.findById(decode.userId).select("-password");

        if (!user) return res.status(400).json({ message: "User not found" });

        req.user = user;
        next();
    } catch (error) {
        console.log("error msg", error.message);
        res.status(401).json({ message: error.message });
    }
}