// pages/api/socket.js
import { Server } from 'socket.io';

if (!global.userSocketMap) {
  global.userSocketMap = new Map();
}

const ioHandler = (req, res) => {
  if (!res.socket.server.io) {
    console.log('*Starting Socket.IO server...');
    
    const io = new Server(res.socket.server, {
      path: '/api/socket', 
      addTrailingSlash: false,
    });

    io.on('connection', (socket) => {
      console.log('Socket connected:', socket.id);

      socket.on('register_user', (userId) => {
        if (userId) {
          console.log(`Registering user ${userId} with socket ${socket.id}`);
          global.userSocketMap.set(userId, socket.id);
        }
      });

      // 🚨 ADDED: The Relay! This listens for a message and sends it to the receiver
      socket.on('send_private_message', (data) => {
        // data contains: { receiverId, senderId, senderName, message }
        const receiverSocketId = global.userSocketMap.get(data.receiverId);
        
        if (receiverSocketId) {
          // If the receiver is online, shoot it directly to their screen!
          io.to(receiverSocketId).emit('receive_private_message', data);
        }
      });

      socket.on('disconnect', () => {
        console.log('Socket disconnected:', socket.id);
        for (let [userId, socketId] of global.userSocketMap.entries()) {
          if (socketId === socket.id) {
            global.userSocketMap.delete(userId);
            break;
          }
        }
      });
    });

    res.socket.server.io = io;
  } else {
    console.log('Socket.IO server already running.');
  }
  
  res.end();
};

export default ioHandler;