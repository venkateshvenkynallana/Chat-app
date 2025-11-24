import cloudinary from "../lib/cloudinary.js";
import { generateToken } from "../lib/utils.js";
import User from "../models/user.js";
import bcrypt from "bcryptjs";

//sign up form

export const signUp = async (req, res) => {

    const { fullName, email, password, bio } = req.body;
    try {
        if (!fullName || !email || !password || !bio) {
            return res.status(400).json({ message: "fields are missing!" })
        }

        const user = User.findOne({ email });

        if (!user) {
            return res.status(409).json({ message: "User alredy exists!" })
        }

        const salt = await bcrypt.genSalt(10);
        const hashPassword = await bcrypt.hash(password, salt);

        const newUser = await User.create({
            fullName,
            email,
            password: hashPassword,
            bio
        });

        const token = generateToken(newUser._id);

        res.status(200).json({ userData: newUser, token, message: "Account created successfully." })

    } catch (error) {
        console.log("error msg", error.message);
        res.status(404).json({ message: error.message });
    }
}

//Controller to login a user
export const Login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const userData = await User.findOne({ email });

        const isPassword = await bcrypt.compare(password, userData.password);

        if (!isPassword) {
            res.status(409).json({ message: "Invalid credentials" });
        }

        const token = generateToken(userData._id);

        res.status(200).json({ userData, token, message: "Login successful" })
    } catch (error) {
        console.log("error msg", error.message);
        res.status(404).json({ message: error.message });
    }
}

//controller to check if user is authenticated
export const checkAuth = (req, res) => {
    res.status(200).json({ user: req.user })
}

//Controller to update user profile details
export const updateProfile = async (req, res) => {
    try {
        const { profilePic, fullName, bio } = req.body;

        const userId = req.user._id;

        let updatedUser;

        if (!profilePic) {
            updatedUser = await User.findByIdAndUpdate(userId, { bio, fullName }, { new: true })
        } else {
            const upload = await cloudinary.uploader.upload(profilePic);

            updatedUser = await User.findByIdAndUpdate(userId, {
                profilePic: upload.secure_url,
                fullName,
                bio
            }, { new: true })
        }
        res.status(200).json({user: updatedUser},"Updated Successful.");
    } catch (error) {
        console.log("error msg", error.message);
        res.status(404).json({ message: error.message });
    }
}