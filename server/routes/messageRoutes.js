import express from 'express'
import { getMessages, getUserMessageCount, markMsgSeen, sendMessage } from '../Controllers/messageController.js';
import { protectRoute } from '../middleware/auth.js';

const messageRouter = express.Router();

//Get Routes
messageRouter.get('/users', protectRoute, getUserMessageCount);
messageRouter.get('/:id', protectRoute, getMessages);
messageRouter.get('/mark/:id', protectRoute, markMsgSeen);

//Post Routes
messageRouter.post('/send/:id', protectRoute, sendMessage);

export default messageRouter;