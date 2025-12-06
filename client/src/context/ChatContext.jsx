import axios from "axios";
import { createContext, useContext, useEffect, useState } from "react";
import { AuthContext } from "./AuthContext";
import toast from "react-hot-toast";

export const ChatContext = createContext();

export const ChatProvider = ({ children }) => {

    const [message, setMessage] = useState([]);
    const [user, setUser] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [unseenMessages, setUnseenMessages] = useState({});

    const { socket, token } = useContext(AuthContext);
    const [isLoading, setIsLoading] = useState(true);

    //function to get all users sidebar
    const getUser = async () => {
        setIsLoading(true);
        try {
            if (!token) {
                console.log("getUser: no token, skipping request");
                setIsLoading(false);
                return;
            }

            const { data } = await axios.get("/api/messages/users", {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (data && (data.success || data.user)) {
                setUser(data.user || []);
                setUnseenMessages(data.unseenMessages || data.unSeenMessages || {});
            } else {
                console.log("getUser: no data.success", data);
            }
        } catch (error) {
            toast.error(error.message)
        } finally {
            setIsLoading(false)
        }
    }

    //function to get messages for selected user
    const getMessages = async (userId) => {
        try {
            const { data } = await axios.get(`/api/messages/${userId}`);

            if (data.success) {
                setMessage(data.message)
            }
        } catch (error) {
            toast.error(error.message)
        }
    }

    // function to send message selected user
    const sendMessage = async (messageData) => {
        try {
            const { data } = await axios.post(`/api/messages/send/${selectedUser._id}`, messageData);

            if (data.success) {
                setMessage((prevMessages) => [...prevMessages, data.newMessage])
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.message);
        }
    }

    //function to subscribe the msg for selected user like user is watch the msg - mark (seen the msg)
    const subscribeToMessages = async () => {
        if (!socket) return;

        socket.on("newMessage", (newMessage) => {
            if (selectedUser && newMessage.senderId === selectedUser._id) {
                newMessage.seen = true;
                setMessage((prevMessages) => [...prevMessages, newMessage]);
                axios.put(`/api/messages/mark/${newMessage._id}`);
            }
            else {
                setUnseenMessages((prevUnseenMessages) => ({
                    ...prevUnseenMessages, [newMessage.senderId]:
                        prevUnseenMessages[newMessage.senderId] ?
                            prevUnseenMessages[newMessage.senderId] + 1 : 1
                }))
            }
        })
    }


    //function to unsubscribe from msg
    const unsubscribeFromMessage = () => {
        if (socket) socket.off("newMessage");
    }

    useEffect(() => {
        subscribeToMessages();
        return () => {
            unsubscribeFromMessage();
        }
    }, [socket, selectedUser])


    const value = {
        message,
        user,
        selectedUser,
        setSelectedUser,
        getUser,
        setMessage,
        sendMessage,
        unseenMessages,
        setUnseenMessages,
        isLoading,
        getMessages
    }
    return (
        <ChatContext.Provider value={value}>
            {children}
        </ChatContext.Provider>
    )
}