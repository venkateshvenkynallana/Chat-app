import mongoose from "mongoose";

//Function to connect to the mongodb database
const connectDB = async () =>{
    try {
        mongoose.connection.on('connected', ()=>console.log('Database Connected'));
        await mongoose.connect(`${process.env.MONGODB_URL}/chat-app`)
    } catch (error) {
        console.log(error);
    }
}

export default connectDB; 