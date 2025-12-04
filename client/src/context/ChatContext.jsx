import axios from "axios";
import { createContext, useContext, useState } from "react";
import { AuthContext } from "./AuthContext";
import toast from "react-hot-toast";

export const ChatContext = createContext();

export const ChatProvider = ({ children }) => {

    const [message, setMessage] = useState([]);
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [unseenMessages, setUnseenMessages] = useState({});

    const { socket, axios } = useContext(AuthContext);

    //function to get all users sidebar
    const getUsers = async () => {
        try {
            const { data } = await axios.get("/api/messages/users");
            if(data.success){
                setUsers(data.users)
                setUnseenMessages(data.unseenMessages)
            }
        } catch (error) {
            toast.error(error.message)
        }
    }

    //function to get messages for selected user
    const getMessages = async (userId) =>{
        try {
            const {data } = await axios.get(`/api/messages/${userId}`);

            if(data.success){
                setMessage(data.message)
            }
        } catch (error) {
            toast.error(error.message)
        }
    }

    // function to send message selected user
    const sendMessage = async(messageData) =>{
        try {
            const { data } = await axios.post(`/api/messages/send/${selectedUser._id}`, messageData);

            if(data.success){
                setMessage((prevMessages)=> [...prevMessages, data.newMessage])
            }else{
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.message);
        }
    }

    //function to subscribe the msg for selected user like user is watch the msg - mark (seen the msg)
    const subscribeToMessages = async ()=>{
        if(!socket) return;

        socket.on("newMessage", (newMessage)=>{
            if(selectedUser && newMessage.senderId === selectedUser._id){
                newMessage.seen = true;
                setMessage((prevMessages)=> [...prevMessages, newMessage]);
                axios.put(`/api/messages/mark/${newMessage._id}`);
            }
            else{
                setUnseenMessages((prevUnseenMessages)=>({
                    ...prevUnseenMessages, [newMessage.senderId] :
                    prevUnseenMessages[newMessage.senderId] ? 
                    prevUnseenMessages [newMessage.senderId] + 1 : 1
                }))
            }
        })
    }



    const value = {

    }
    return (
        <ChatContext.Provider>
            {children}
        </ChatContext.Provider>
    )
}