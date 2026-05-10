

const sanitizeHtml = require('sanitize-html');
const { verifyToken } = require('../services/authService');

const handleSockets = (io) => {

  io.use((socket, next) => {

    const token = socket.handshake.auth?.token;
    
    if (!token) {
      return next(new Error("Authentication error: Missing JWT Token"));
    }
    
    try {

      const decodedUser = verifyToken(token);

      socket.user = decodedUser; 
      next();
    } catch (err) {
      return next(new Error("Authentication error: Invalid or expired JWT Token"));
    }
  });

  io.on('connection', (socket) => {
    console.log(`[+] Secure Connection established: ${socket.id} (${socket.user.username})`);

    socket.on('join-room', () => {
      const { roomId, username } = socket.user;

      socket.join(roomId);

      socket.roomId = roomId;
      socket.username = username;

      console.log(`User ${username} (${socket.id}) joined room: ${roomId}`);

      socket.to(roomId).emit('user-connected', {
        userId: socket.id,
        username: username,
      });

      socket.on('send-message', (payload) => {

        const safeText = sanitizeHtml(payload.text, {
          allowedTags: [], // Strip all HTML tags entirely
          allowedAttributes: {}
        });

        io.to(roomId).emit('receive-message', {
          sender: socket.user.username,
          text: safeText,
          fileUrl: payload.fileUrl || null,
          fileName: payload.fileName ? sanitizeHtml(payload.fileName, { allowedTags: [] }) : null,
          userId: socket.id,
          timestamp: new Date().toISOString()
        });
      });

      socket.on('toggle-media', ({ type, isMuted }) => {
        socket.to(roomId).emit('media-updated', {
          userId: socket.id,
          type,
          isMuted
        });
      });

      socket.on('reaction', ({ type }) => {
        io.to(roomId).emit('reaction', {
          userId: socket.id,
          username: socket.user.username,
          type
        });
      });

      socket.on('draw', (drawData) => {

        socket.to(roomId).emit('draw', drawData);
      });

      socket.on('clear-board', () => {
        socket.to(roomId).emit('clear-board');
      });

      socket.on('offer', (payload) => {

        io.to(payload.targetUserId).emit('offer', {
          callerId: socket.id,     // Let the target know who is calling
          sdp: payload.sdp,        // The connection details
          username: socket.username // Present the username
        });
      });

      socket.on('answer', (payload) => {

        io.to(payload.targetUserId).emit('answer', {
          callerId: socket.id,    // The replier's ID
          sdp: payload.sdp        // The return connection details
        });
      });

      socket.on('ice-candidate', (payload) => {

        io.to(payload.targetUserId).emit('ice-candidate', {
          senderId: socket.id,
          candidate: payload.candidate
        });
      });

      socket.on('disconnect', () => {
        console.log(`[-] User Disconnected: ${socket.username} (${socket.id})`);

        socket.to(roomId).emit('user-disconnected', {
          userId: socket.id,
          username: socket.username
        });
      });
      
    });
  });
};

module.exports = handleSockets;
