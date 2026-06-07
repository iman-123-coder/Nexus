module.exports = (io) => {
  const onlineUsers = new Map();

  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // User comes online
    socket.on('user-online', (userId) => {
      onlineUsers.set(userId, socket.id);
      io.emit('online-users', Array.from(onlineUsers.keys()));
    });

    // Join personal room for DMs
    socket.on('join-room', (roomId, userId) => {
      socket.join(roomId);
      socket.to(roomId).emit('user-connected', userId);
    });

    // Real-time chat message
    socket.on('send-message', (message) => {
      const receiverSocketId = onlineUsers.get(message.receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('receive-message', message);
      }
    });

    // Typing indicator
    socket.on('typing', ({ senderId, receiverId }) => {
      const receiverSocketId = onlineUsers.get(receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('typing', senderId);
      }
    });

    socket.on('stop-typing', ({ senderId, receiverId }) => {
      const receiverSocketId = onlineUsers.get(receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('stop-typing', senderId);
      }
    });

    // WebRTC Signaling
    socket.on('offer', (offer, roomId) => {
      socket.to(roomId).emit('offer', offer);
    });

    socket.on('answer', (answer, roomId) => {
      socket.to(roomId).emit('answer', answer);
    });

    socket.on('ice-candidate', (candidate, roomId) => {
      socket.to(roomId).emit('ice-candidate', candidate);
    });

    socket.on('disconnect', () => {
      onlineUsers.forEach((sId, userId) => {
        if (sId === socket.id) onlineUsers.delete(userId);
      });
      io.emit('online-users', Array.from(onlineUsers.keys()));
      console.log('User disconnected:', socket.id);
    });
  });
};