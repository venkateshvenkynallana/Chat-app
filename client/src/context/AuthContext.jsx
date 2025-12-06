import { createContext, useEffect, useState } from "react";
import axios from 'axios';
import toast from "react-hot-toast";
import { io } from "socket.io-client"
import { useNavigate } from "react-router-dom";

const backendUrl = import.meta.env.VITE_BACKEND_URL;
axios.defaults.baseURL = backendUrl;

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {

    const [token, setToken] = useState(localStorage.getItem("token"));
    const [authUser, setAuthUser] = useState(null);
    const [socket, setSocket] = useState(null);
    const [onlineUser, setOnlineUser] = useState([]);


    //Check if user is authenticated and if so , set the user data and connect the socket
    const checkAuth = async () => {
        try {
            const token = localStorage.getItem("token");
            if (!token) return;

            const { data } = await axios.get("/api/auth/check", {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (data.success) {
                setAuthUser(data.user);
                connectSocket(data.user);
            }
        } catch (error) {
            console.error("checkAuth error:", error.response?.data || error.message);
            toast.error(error.message);
        }
    }

    //Login function to handle user authentication and socket connection
    const login = async (state, credentials) => {
        try {
            const { data } = await axios.post(`/api/auth/${state}`, credentials);
            if (data.success) {
                setAuthUser(data.userData);
                connectSocket(data.userData);
                setToken(data.token);
                axios.defaults.headers.common["Authorization"] = `Bearer ${data.token}`;
                localStorage.setItem("token", data.token);
                toast.success("Login successful.");

            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.message);
        }
    }

    //Logout function to handle user logout and socketdisconnection
    const logout = async () => {
        localStorage.removeItem("token");
        setToken(null);
        setAuthUser(null);
        setOnlineUser([]);
        axios.defaults.headers.common["Authorization"] = null;
        toast.success("Logged out successfully.");
        socket.disconnect();
    }

    //Update profile function to handle user profile updates
    const updateProfile = async (body) => {
        try {
            const { data } = await axios.put("/api/auth/update-profile", body);
            if (data.success) {
                setAuthUser(data.user);
                toast.success("Profile Updated successfully")
            }
        } catch (error) {
            toast.error(error.message);
        }
    }

    //Connect socket function to handle socket connection and online users updates
    const connectSocket = (userData) => {
        if (!userData || socket?.connected) return;

        const newSocket = io(backendUrl, {
            query: {
                userId: userData._id,
            }
        });
        newSocket.connect();
        setSocket(newSocket);

        newSocket.on("getOnlineUsers", (userIds) => {
            setOnlineUser(userIds);
        })
    }

    useEffect(() => {
        const initAuth = async () => {
            const localToken = localStorage.getItem("token");
            if (localToken) {
                setToken(localToken); // Just set state
                checkAuth(); // New checkAuth handles header
            }
        };
        initAuth();
    }, []);



    const value = {
        token,
        authUser,
        socket,
        onlineUser,
        login,
        logout,
        updateProfile
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    )
}